import { NextResponse } from "next/server";
import { chatConfigured, isAdmin, listOpenOrders, unreadCount } from "@/lib/chat-server";

/** Panel: pedidos pagados con chat abierto y cuántos mensajes sin leer. */
export async function GET(request: Request) {
  if (!process.env.ADMIN_KEY) return NextResponse.json({ error: "no_admin" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "forbidden" }, { status: 401 });
  if (!chatConfigured()) return NextResponse.json({ error: "no_db" }, { status: 503 });
  try {
    const orders = await listOpenOrders();
    const withUnread = await Promise.all(
      orders.map(async (o) => ({
        orderId: o.order_id,
        totalUsd: Number(o.total_usd),
        items: o.items,
        createdAt: o.created_at,
        fulfillment: o.fulfillment,
        unread: await unreadCount(o.order_id, "shop", o.shop_seen_at),
      }))
    );
    return NextResponse.json({ orders: withUnread }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Error listando pedidos:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
