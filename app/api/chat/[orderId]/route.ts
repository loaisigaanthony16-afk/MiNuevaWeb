import { NextResponse } from "next/server";
import { isOrderId } from "@/lib/orders";
import {
  addMessage,
  authorizeClient,
  chatConfigured,
  listMessages,
  touchSeen,
  unreadCount,
} from "@/lib/chat-server";
import { notifyClientMessage } from "@/lib/notify-email";

/**
 * Chat del pedido, lado cliente. Requiere el token secreto del pedido.
 *
 * GET  ?token=&after=  -> mensajes nuevos + estado del chat
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
      // Sin token válido no se confirma ni que el pedido exista, salvo que
      // ya esté entregado (el chat se cerró y el token se borró).
      const closed = /^[a-f0-9]{48}$/.test(token) ? null : null;
      return NextResponse.json({ error: "closed", closed }, { status: 410, headers: NO_STORE });
    }
    const messages = await listMessages(orderId, after);
    const unread = await unreadCount(orderId, "client", order.client_seen_at);
    if (url.searchParams.get("seen") === "1") await touchSeen(orderId, "client");
    return NextResponse.json(
      { status: order.status, delivered: Boolean(order.delivered_at), messages, unread },
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

  try {
    const order = await authorizeClient(orderId, body.token ?? "");
    if (!order) return NextResponse.json({ error: "closed" }, { status: 410 });
    if (order.status !== "paid") return NextResponse.json({ error: "unpaid" }, { status: 409 });
    // Un correo por tanda: si el comercio ya tenía mensajes sin leer de
    // este pedido, no se le vuelve a avisar hasta que los lea.
    const pendingBefore = await unreadCount(orderId, "shop", order.shop_seen_at);
    const message = await addMessage(orderId, "client", text);
    await touchSeen(orderId, "client");
    if (pendingBefore === 0) await notifyClientMessage(orderId);
    return NextResponse.json({ message }, { headers: NO_STORE });
  } catch (err) {
    console.error("Error enviando al chat:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
