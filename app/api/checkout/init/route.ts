import { NextResponse } from "next/server";
import { priceOrder, PricingError } from "@/lib/pricing";
import { DELIVERY_FEE_NIO, DELIVERY_ZONE } from "@/lib/checkout-util";
import { createOrder, newOrderId } from "@/lib/orders";
import { stripe, stripeConfigured, toCents } from "@/lib/stripe-server";
import { isAllowedOrigin, siteOrigin } from "@/lib/site";

/**
 * Inicia el cobro con Stripe Checkout.
 *
 * El navegador solo manda qué producto y cuántas unidades: el precio sale
 * del catálogo del servidor. La dirección de entrega nunca llega acá.
 *
 * Con la clave publicable disponible se usa el formulario incrustado en
 * el modal (`embedded_page`); sin ella, la página alojada de Stripe.
 */

interface Body {
  items?: { id: number; qty: number }[];
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Pagos no configurados." }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  try {
    const order = priceOrder(body.items);
    const orderId = newOrderId();
    const base = siteOrigin(request);
    const embedded = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    const returnUrl = `${base}/order-success?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      client_reference_id: orderId,
      metadata: { order_id: orderId },
      payment_intent_data: { metadata: { order_id: orderId } },
      // Los productos tal como son: el cliente y Stripe ven lo que se compra.
      line_items: [
        ...order.lines.map((l) => ({
          quantity: l.qty,
          price_data: {
            currency: "usd",
            unit_amount: toCents(l.unitPriceUsd),
            product_data: { name: l.name, description: "2000 mg" },
          },
        })),
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: toCents(order.shippingUsd),
            product_data: { name: `Entrega en ${DELIVERY_ZONE} (C$${DELIVERY_FEE_NIO})` },
          },
        },
      ],
      ...(embedded
        ? { ui_mode: "embedded_page" as const, return_url: returnUrl, redirect_on_completion: "if_required" as const }
        : { success_url: returnUrl, cancel_url: `${base}/?canceled=true` }),
    });

    // Defensa: el total de Stripe debe coincidir con el calculado acá.
    if (session.amount_total !== toCents(order.totalUsd)) {
      console.error("Total de Stripe distinto al del pedido:", orderId);
      return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 500 });
    }

    const tracked = await createOrder(orderId, order, session.id);

    return NextResponse.json({
      orderId,
      sessionId: session.id,
      clientSecret: embedded ? session.client_secret : null,
      url: embedded ? null : session.url,
      tracked,
      subtotalUsd: order.subtotalUsd,
      deliveryUsd: order.shippingUsd,
      totalUsd: order.totalUsd,
    });
  } catch (err) {
    if (err instanceof PricingError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    // Solo el mensaje: nunca el objeto completo, que puede traer cabeceras.
    console.error("Error creando la sesión de Stripe:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 500 });
  }
}
