import { NextResponse } from "next/server";
import { isOrderId } from "@/lib/orders";
import { addMessage, chatConfigured, getChatOrder, isAdmin, listMessages, touchSeen } from "@/lib/chat-server";

const NO_STORE = { "Cache-Control": "no-store" };

function guard(request: Request) {
  if (!process.env.ADMIN_KEY) return NextResponse.json({ error: "no_admin" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "forbidden" }, { status: 401 });
  if (!chatConfigured()) return NextResponse.json({ error: "no_db" }, { status: 503 });
  return null;
}

/** Panel: leer un chat. */
export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const denied = guard(request);
  if (denied) return denied;
  const { orderId } = await params;
  if (!isOrderId(orderId)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const after = Number(new URL(request.url).searchParams.get("after") ?? 0) || 0;
  try {
    const order = await getChatOrder(orderId);
    if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const messages = await listMessages(orderId, after);
    await touchSeen(orderId, "shop");
    return NextResponse.json(
      { status: order.status, delivered: Boolean(order.delivered_at), items: order.items, totalUsd: Number(order.total_usd), messages },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error("Error leyendo el chat (panel):", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}

/** Panel: responder. */
export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const denied = guard(request);
  if (denied) return denied;
  const { orderId } = await params;
  if (!isOrderId(orderId)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  let body: { body?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const text = (body.body ?? "").trim();
  if (!text || text.length > 1200) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const order = await getChatOrder(orderId);
    if (!order || order.delivered_at) return NextResponse.json({ error: "closed" }, { status: 410 });
    const message = await addMessage(orderId, "shop", text);
    await touchSeen(orderId, "shop");
    return NextResponse.json({ message }, { headers: NO_STORE });
  } catch (err) {
    console.error("Error respondiendo (panel):", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
