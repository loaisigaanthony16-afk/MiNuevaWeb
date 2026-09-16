import { NextResponse } from "next/server";
import { isOrderId } from "@/lib/orders";
import {
  addMessage,
  authorizeClient,
  chatConfigured,
  ensureWelcome,
  listMessages,
  touchSeen,
  unreadCount,
} from "@/lib/chat-server";
import { notifyClientMessage } from "@/lib/notify-email";
import { pushShop } from "@/lib/push-server";
import { allow } from "@/lib/rate-limit";

/**
 * Chat del pedido, lado cliente. Requiere el token secreto del pedido.
 *
 * GET  ?token=&after=  -> mensajes nuevos + estado del chat y de la entrega
 * POST { token, body } -> envía un mensaje (solo con el pago confirmado)
 */

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const after = Number(url.searchParams.get("after") ?? 0) || 0;
  if (!isOrderId(orderId) || !chatConfigured()) {
    return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
  }
  try {
    const order = await authorizeClient(orderId, token);
    if (!order) {
      // Sin token válido no se confirma ni que el pedido exista.
      return NextResponse.json({ error: "closed" }, { status: 410, headers: NO_STORE });
    }
    let messages = await listMessages(orderId, after);
    // Pagado y sin mensajes: el webhook aún no dejó la bienvenida.
    if (after === 0 && messages.length === 0 && order.status === "paid" && !order.delivered_at && (await ensureWelcome(orderId))) {
      messages = await listMessages(orderId, 0);
    }
    const unread = await unreadCount(orderId, "client", order.client_seen_at);
    if (url.searchParams.get("seen") === "1") await touchSeen(orderId, "client");
    return NextResponse.json(
      {
        status: order.status,
        delivered: Boolean(order.delivered_at),
        fulfillment: order.fulfillment,
        fulfillmentAt: order.fulfillment_at,
        items: (order.items ?? []).map((i) => ({ id: i.id ?? null, name: i.name, qty: i.qty })),
        referralCode: order.referral_code,
        messages,
        unread,
      },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error("Error leyendo el chat:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!isOrderId(orderId) || !chatConfigured()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  let body: { token?: string; body?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const text = (body.body ?? "").trim();
  if (!text || text.length > 1200) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (!allow(`chat:${orderId}`, 30, 60 * 1000)) return NextResponse.json({ error: "slow_down" }, { status: 429 });

  try {
    const order = await authorizeClient(orderId, body.token ?? "");
    if (!order) return NextResponse.json({ error: "closed" }, { status: 410 });
    if (order.status !== "paid") return NextResponse.json({ error: "unpaid" }, { status: 409 });
    if (order.delivered_at) return NextResponse.json({ error: "closed" }, { status: 410 });
    // Un aviso por tanda: si el comercio ya tenía mensajes sin leer de
    // este pedido, no se le vuelve a avisar hasta que los lea.
    const pendingBefore = await unreadCount(orderId, "shop", order.shop_seen_at);
    const message = await addMessage(orderId, "client", text);
    await touchSeen(orderId, "client");
    if (pendingBefore === 0) {
      await notifyClientMessage(orderId);
      await pushShop(`Mensaje nuevo · ${orderId}`, "El cliente escribió en el chat.");
    }
    return NextResponse.json({ message }, { headers: NO_STORE });
  } catch (err) {
    console.error("Error enviando al chat:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
