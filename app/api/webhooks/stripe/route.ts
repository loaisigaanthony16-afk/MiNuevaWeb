import type Stripe from "stripe";
import { applyPayment, type OrderStatus } from "@/lib/orders";
import { stripe } from "@/lib/stripe-server";

/**
 * Webhook de Stripe.
 *
 * La firma se valida con STRIPE_WEBHOOK_SECRET sobre el cuerpo CRUDO: si no
 * coincide, el evento se descarta. Sin esto cualquiera podría marcar un
 * pedido como pagado con un POST.
 *
 * Eventos a activar en el panel de Stripe:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded
 *   checkout.session.async_payment_failed
 *   checkout.session.expired
 *   charge.refunded
 */

function statusFor(event: Stripe.Event): OrderStatus | null {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      return s.payment_status === "paid" || s.payment_status === "no_payment_required" ? "paid" : "confirming";
    }
    case "checkout.session.async_payment_succeeded":
      return "paid";
    case "checkout.session.async_payment_failed":
      return "failed";
    case "checkout.session.expired":
      return "expired";
    default:
      return null;
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Falta STRIPE_WEBHOOK_SECRET: el webhook no se puede validar.");
    return new Response("Webhook no configurado", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Falta la firma", { status: 400 });

  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature, secret);
  } catch {
    console.warn("Evento de Stripe con firma inválida, descartado.");
    return new Response("Firma inválida", { status: 400 });
  }

  try {
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const orderId = charge.metadata?.order_id;
      if (orderId && charge.refunded) {
        const sessions = await stripe().checkout.sessions.list({
          payment_intent: typeof charge.payment_intent === "string" ? charge.payment_intent : undefined,
          limit: 1,
        });
        const session = sessions.data[0];
        if (session) {
          await applyPayment({
            orderId,
            status: "refunded",
            stripeSessionId: session.id,
            paymentIntent: typeof charge.payment_intent === "string" ? charge.payment_intent : null,
            amountTotalCents: null,
          });
        }
      }
      return new Response("OK", { status: 200 });
    }

    const status = statusFor(event);
    if (!status) return new Response("OK", { status: 200 });

    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.client_reference_id ?? session.metadata?.order_id ?? "";
    if (!orderId) return new Response("OK", { status: 200 });

    await applyPayment({
      orderId,
      status,
      stripeSessionId: session.id,
      paymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : null,
      amountTotalCents: session.amount_total,
    });
  } catch (err) {
    // Con 500 Stripe reintenta el evento más tarde.
    console.error("No se pudo procesar el evento:", err instanceof Error ? err.message : "desconocido");
    return new Response("Error procesando el evento", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
