import { NextResponse } from "next/server";
import { isOrderId } from "@/lib/orders";
import { authorizeClient, chatConfigured } from "@/lib/chat-server";
import { isSubscription, pushConfigured, saveSubscription } from "@/lib/push-server";
import { allow, clientIp } from "@/lib/rate-limit";

/** Cliente: recibir avisos push de su pedido (requiere el token del chat). */
export async function POST(request: Request) {
  if (!chatConfigured() || !pushConfigured()) return NextResponse.json({ error: "no_push" }, { status: 503 });
  if (!allow(`push:${clientIp(request)}`, 20, 10 * 60 * 1000)) return NextResponse.json({ error: "slow_down" }, { status: 429 });
  let body: { orderId?: string; token?: string; subscription?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const orderId = body.orderId ?? "";
  if (!isOrderId(orderId) || !isSubscription(body.subscription)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const order = await authorizeClient(orderId, body.token ?? "");
    if (!order) return NextResponse.json({ error: "closed" }, { status: 410 });
    await saveSubscription("client", body.subscription, orderId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error guardando push:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
