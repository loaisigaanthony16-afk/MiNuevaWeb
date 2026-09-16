import { NextResponse } from "next/server";
import { isOrderId } from "@/lib/orders";
import { chatConfigured, getChatOrder } from "@/lib/chat-server";
import { allow, clientIp } from "@/lib/rate-limit";

/**
 * Seguimiento público por referencia: solo el estado de entrega. Nada de
 * artículos, importes ni mensajes.
 */
export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!isOrderId(orderId) || !chatConfigured()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!allow(`track:${clientIp(request)}`, 60, 60 * 1000)) return NextResponse.json({ error: "slow_down" }, { status: 429 });
  try {
    const order = await getChatOrder(orderId);
    if (!order || order.status !== "paid") return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(
      { orderId, fulfillment: order.fulfillment, updatedAt: order.fulfillment_at ?? order.paid_at },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
