import { NextResponse } from "next/server";
import { applyPayment, getOrderRow, isOrderId, type OrderStatus } from "@/lib/orders";
import type Stripe from "stripe";
import { stripe, stripeConfigured } from "@/lib/stripe-server";

/**
 * Estado de un pedido para la consulta periódica del modal y de la página
 * de confirmación. Devuelve solo el estado: nada que identifique a nadie.
 *
 * Fuente principal: Supabase (actualizada por el webhook). Si el pedido
 * aún no figura pagado o la base no está configurada, se consulta la
 * sesión en Stripe, verificando que pertenezca a este pedido. Si Stripe ya
 * lo cobró y la base no se enteró (webhook demorado o perdido), se guarda
 * acá mismo: así el chat se abre sin esperar al cron.
 */

const NO_STORE = { "Cache-Control": "no-store" };

type PublicStatus = OrderStatus | "unknown" | "not_found";

async function fromStripe(
  orderId: string,
  sessionId: string
): Promise<{ status: PublicStatus; session: Stripe.Checkout.Session | null } | null> {
  if (!stripeConfigured() || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return null;
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    // La sesión tiene que ser de este pedido: nadie consulta pedidos ajenos.
    if (session.client_reference_id !== orderId) return { status: "not_found", session: null };
    if (session.payment_status === "paid" || session.payment_status === "no_payment_required") return { status: "paid", session };
    if (session.status === "expired") return { status: "expired", session };
    if (session.status === "complete") return { status: "confirming", session };
    return { status: "pending", session };
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  if (!isOrderId(orderId)) {
    return NextResponse.json({ error: "Referencia inválida." }, { status: 400 });
  }
  const sessionFromQuery = new URL(request.url).searchParams.get("session_id");

  let status: PublicStatus = "unknown";
  let sessionId = sessionFromQuery;
  let inDb = false;

  try {
    const row = await getOrderRow(orderId);
    if (row === null) status = "not_found";
    else if (row !== "unconfigured") {
      inDb = true;
      status = row.status;
      sessionId = row.stripe_session_id ?? sessionId;
    }
  } catch (err) {
    console.error("Error leyendo el pedido:", err instanceof Error ? err.message : "desconocido");
  }

  // Si la base todavía no lo confirma, se pregunta a Stripe directamente.
  if (status !== "paid" && status !== "refunded" && sessionId) {
    const live = await fromStripe(orderId, sessionId);
    if (live && !(status === "not_found" && live.status === "not_found")) {
      if (live.status === "paid" && inDb && live.session) {
        try {
          await applyPayment({
            orderId,
            status: "paid",
            stripeSessionId: live.session.id,
            paymentIntent: typeof live.session.payment_intent === "string" ? live.session.payment_intent : null,
            amountTotalCents: live.session.amount_total,
          });
        } catch (err) {
          console.error("No se pudo guardar el pago:", err instanceof Error ? err.message : "desconocido");
        }
      }
      status = live.status;
    }
  }

  return NextResponse.json({ status }, { status: status === "not_found" ? 404 : 200, headers: NO_STORE });
}
