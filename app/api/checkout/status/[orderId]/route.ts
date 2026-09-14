import { NextResponse } from "next/server";
import { getOrderRow, isOrderId, type OrderStatus } from "@/lib/orders";
import { stripe, stripeConfigured } from "@/lib/stripe-server";

/**
 * Estado de un pedido para la consulta periódica del modal y de la página
 * de confirmación. Devuelve solo el estado: nada que identifique a nadie.
 *
 * Fuente principal: Supabase (actualizada por el webhook). Si el pedido
 * aún no figura pagado o la base no está configurada, se consulta la
 * sesión en Stripe, verificando que pertenezca a este pedido.
 */

const NO_STORE = { "Cache-Control": "no-store" };

type PublicStatus = OrderStatus | "unknown" | "not_found";

async function fromStripe(orderId: string, sessionId: string): Promise<PublicStatus | null> {
  if (!stripeConfigured() || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return null;
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    // La sesión tiene que ser de este pedido: nadie consulta pedidos ajenos.
    if (session.client_reference_id !== orderId) return "not_found";
    if (session.payment_status === "paid" || session.payment_status === "no_payment_required") return "paid";
    if (session.status === "expired") return "expired";
    if (session.status === "complete") return "confirming";
    return "pending";
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

  try {
    const row = await getOrderRow(orderId);
    if (row === null) status = "not_found";
    else if (row !== "unconfigured") {
      status = row.status;
      sessionId = row.stripe_session_id ?? sessionId;
    }
  } catch (err) {
    console.error("Error leyendo el pedido:", err instanceof Error ? err.message : "desconocido");
  }

  // Si la base todavía no lo confirma, se pregunta a Stripe directamente.
  if (status !== "paid" && status !== "refunded" && sessionId) {
    const live = await fromStripe(orderId, sessionId);
    if (live && !(status === "not_found" && live === "not_found")) status = live;
  }

  return NextResponse.json({ status }, { status: status === "not_found" ? 404 : 200, headers: NO_STORE });
}
