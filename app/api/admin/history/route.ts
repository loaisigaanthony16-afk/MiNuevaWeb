import { NextResponse } from "next/server";
import { chatConfigured, isAdmin, listHistory } from "@/lib/chat-server";

/** Panel: historial de ventas (referencia, artículos, total, fechas). */
export async function GET(request: Request) {
  if (!process.env.ADMIN_KEY) return NextResponse.json({ error: "no_admin" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "forbidden" }, { status: 401 });
  if (!chatConfigured()) return NextResponse.json({ error: "no_db" }, { status: 503 });
  try {
    const rows = await listHistory();
    const sales = rows.map((r) => ({
      orderId: r.order_id,
      items: r.items,
      totalUsd: Number(r.total_usd),
      paidAt: r.paid_at,
      deliveredAt: r.delivered_at,
      fulfillment: r.fulfillment,
    }));
    // Totales por mes (YYYY-MM), para la cabecera del panel.
    const months: Record<string, { count: number; totalUsd: number; units: number }> = {};
    for (const s of sales) {
      const key = (s.paidAt ?? "").slice(0, 7);
      const m = (months[key] ??= { count: 0, totalUsd: 0, units: 0 });
      m.count += 1;
      m.totalUsd += s.totalUsd;
      m.units += s.items.reduce((a, i) => a + i.qty, 0);
    }
    return NextResponse.json({ sales, months }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Error listando ventas:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
