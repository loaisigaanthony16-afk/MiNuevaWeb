import { NextResponse } from "next/server";
import { isOrderId } from "@/lib/orders";
import { chatConfigured, getChatOrder, isAdmin, setFulfillment } from "@/lib/chat-server";
import { FULFILLMENT_NOTICE, isFulfillment } from "@/lib/fulfillment";
import { pushClient } from "@/lib/push-server";

/** Panel: cambiar el estado de entrega. Avisa al cliente por chat y push. */
export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  if (!process.env.ADMIN_KEY) return NextResponse.json({ error: "no_admin" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "forbidden" }, { status: 401 });
  if (!chatConfigured()) return NextResponse.json({ error: "no_db" }, { status: 503 });
  const { orderId } = await params;
  if (!isOrderId(orderId)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  let body: { fulfillment?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!isFulfillment(body.fulfillment)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const order = await getChatOrder(orderId);
    if (!order || order.status !== "paid") return NextResponse.json({ error: "not_found" }, { status: 404 });
    await setFulfillment(orderId, body.fulfillment);
    await pushClient(orderId, `Pedido ${orderId}`, FULFILLMENT_NOTICE[body.fulfillment]);
    return NextResponse.json({ ok: true, fulfillment: body.fulfillment });
  } catch (err) {
    console.error("Error cambiando el estado:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
