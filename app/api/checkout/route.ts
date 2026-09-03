import { NextResponse } from "next/server";
import Stripe from "stripe";

interface Body {
  totalAmount?: number;
  shippingAmount?: number;
  items?: { id: number; name: string; qty: number; price: number }[];
  delivery?: {
    alias?: string;
    phone?: string;
    region?: string;
    address?: string;
    notes?: string;
  };
}

/** Stripe limita cada valor de metadata a 500 caracteres. */
function clip(value: string | undefined, max = 480): string {
  return (value ?? "").slice(0, max);
}

export async function POST(request: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Pasarela no configurada." },
        { status: 500 }
      );
    }

    // Se instancia por request para no romper la recolección de rutas del
    // build cuando la variable de entorno no está definida en local.
    const stripe = new Stripe(secretKey);

    const body = (await request.json()) as Body;
    const { totalAmount, shippingAmount, items, delivery } = body;

    if (typeof totalAmount !== "number" || totalAmount <= 0) {
      return NextResponse.json(
        { error: "Monto de carrito inválido." },
        { status: 400 }
      );
    }

    // Sin dirección no hay a dónde despachar: el pedido es anónimo, no ciego.
    if (
      !delivery?.address ||
      !delivery.region ||
      !delivery.phone ||
      !delivery.alias
    ) {
      return NextResponse.json(
        { error: "Falta la dirección de entrega." },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    // El resumen del pedido y los datos de entrega viajan como metadata de la
    // sesión: es la única vía por la que recibimos la dirección, ya que no
    // guardamos cuentas ni perfiles de cliente.
    const summary = (items ?? [])
      .map((it) => `${it.qty}x ${it.name}`)
      .join(", ");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Compra Vibe 505" },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/?canceled=true`,
      metadata: {
        pedido: clip(summary),
        entrega_alias: clip(delivery.alias, 120),
        entrega_telefono: clip(delivery.phone, 40),
        entrega_region: clip(delivery.region, 80),
        entrega_direccion: clip(delivery.address),
        entrega_referencias: clip(delivery.notes, 300),
        envio_usd: String(shippingAmount ?? 0),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Error creando la sesión de Stripe:", err);
    return NextResponse.json(
      { error: "Error al crear la sesión de pago." },
      { status: 500 }
    );
  }
}
