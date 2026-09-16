import { NextResponse } from "next/server";
import { priceOrder, PricingError } from "@/lib/pricing";
import { DELIVERY_FEE_NIO, DELIVERY_ZONE } from "@/lib/checkout-util";
import { createOrder, newOrderId, type ReferralUse } from "@/lib/orders";
import { stripe, stripeConfigured, toCents } from "@/lib/stripe-server";
import { newChatToken } from "@/lib/chat-server";
import { isAllowedOrigin, siteOrigin } from "@/lib/site";
import { allow, clientIp } from "@/lib/rate-limit";
import { firstShort } from "@/lib/stock";
import { checkCode, normalizeCode } from "@/lib/referrals";
import { getProduct } from "@/lib/data";
import { ordersDbConfigured } from "@/lib/supabase-server";

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
  /** Código de referido (opcional). */
  code?: string;
  /** Identificador anónimo del dispositivo, para el canje único. */
  device?: string;
  /** Códigos propios guardados en el dispositivo (para canjear créditos). */
  own?: string[];
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Pagos no configurados." }, { status: 503 });
  }
  if (!allow(`init:${clientIp(request)}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Demasiados intentos. Esperá unos minutos." }, { status: 429 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  try {
    // Stock: si algo no alcanza, se avisa antes de cobrar.
    const short = ordersDbConfigured() ? await firstShort(priceOrder(body.items).lines) : null;
    if (short !== null) {
      return NextResponse.json(
        { error: `${getProduct(short)?.name ?? "Un producto"} ya no tiene existencias.`, soldOut: short },
        { status: 409 }
      );
    }

    // Referido: entrega gratis si el código vale para este dispositivo.
    let referral: ReferralUse | null = null;
    const code = normalizeCode(body.code);
    const device = typeof body.device === "string" && /^[a-f0-9]{32}$/.test(body.device) ? body.device : null;
    if (code.length === 6 && ordersDbConfigured()) {
      const own = Array.isArray(body.own) ? body.own.map(normalizeCode).filter((c) => c.length === 6) : [];
      const check = await checkCode(code, device ?? "sin-dispositivo", own);
      if (!check.ok) {
        const msg =
          check.reason === "used"
            ? "Este dispositivo ya usó un código de amigo."
            : check.reason === "no_credit"
              ? "Tu código todavía no tiene créditos."
              : "Código no válido.";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      referral = { code, kind: check.kind, device };
    }

    const order = priceOrder(body.items, { freeDelivery: referral !== null });
    const orderId = newOrderId();
    const base = siteOrigin(request);
    const embedded = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    const returnUrl = `${base}/order-success?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      // Solo tarjeta como tipo: Apple Pay y Google Pay aparecen solos dentro
      // de "card" cuando están activos en el panel de Stripe.
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
            product_data: { name: l.name },
          },
        })),
        ...(order.shippingUsd > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: "usd",
                  unit_amount: toCents(order.shippingUsd),
                  product_data: { name: `Entrega en ${DELIVERY_ZONE} (C$${DELIVERY_FEE_NIO})` },
                },
              },
            ]
          : []),
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

    // Secreto del chat del pedido: solo lo conoce este navegador.
    const chatToken = newChatToken();
    const tracked = await createOrder(orderId, order, session.id, chatToken, referral);

    return NextResponse.json({
      orderId,
      sessionId: session.id,
      clientSecret: embedded ? session.client_secret : null,
      url: embedded ? null : session.url,
      tracked,
      chatToken: tracked ? chatToken : null,
      subtotalUsd: order.subtotalUsd,
      deliveryUsd: order.shippingUsd,
      totalUsd: order.totalUsd,
      referralApplied: referral !== null,
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
