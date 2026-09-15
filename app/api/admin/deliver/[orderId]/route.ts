import { NextResponse } from "next/server";
import { isOrderId } from "@/lib/orders";
import { chatConfigured, getChatOrder, isAdmin, markDelivered } from "@/lib/chat-server";

/** Panel: marcar entregado. Borra la conversación y cierra el chat. */
export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  if (!process.env.ADMIN_KEY) return NextResponse.json({ error: "no_admin" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "forbidden" }, { status: 401 });
  if (!chatConfigured()) return NextResponse.json({ error: "no_db" }, { status: 503 });
  const { orderId } = await params;
  if (!isOrderId(orderId)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const order = await getChatOrder(orderId);
    if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await markDelivered(orderId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error marcando entregado:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
