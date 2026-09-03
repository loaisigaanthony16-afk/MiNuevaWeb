import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Pasarela no configurada." },
        { status: 500 }
      );
    }

    // Se instancia en tiempo de request (no en el módulo) para no romper
    // la recolección de rutas del build cuando falta la env local.
    const stripe = new Stripe(secretKey);

    const body = (await request.json()) as { totalAmount?: number };
    const totalAmount = body.totalAmount;

    if (
      !totalAmount ||
      typeof totalAmount !== "number" ||
      totalAmount <= 0
    ) {
      return NextResponse.json(
        { error: "Monto de carrito inválido." },
        { status: 400 }
      );
    }

    // Monto exacto al céntimo.
    const unitAmountInCents = Math.round(totalAmount * 100);
    const origin =
      request.headers.get("origin") ?? "http://localhost:3000";

    // La Checkout Session siempre manda un importe explícito y exacto.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Compra Vibe 505",
            },
            unit_amount: unitAmountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/?canceled=true`,
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
