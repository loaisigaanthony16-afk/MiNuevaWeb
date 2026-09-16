import { NextResponse } from "next/server";
import { db, ordersDbConfigured } from "@/lib/supabase-server";

/**
 * Público: cuántas veces se pidió cada producto en los últimos 7 días
 * (pedidos pagados reales). Sin nada más.
 */
export async function GET() {
  if (!ordersDbConfigured()) return NextResponse.json({ week: {}, total: 0 });
  try {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const rows = await db<{ items: { id?: number; qty: number }[] }[]>(
      `orders?status=eq.paid&paid_at=gte.${encodeURIComponent(since)}&select=items`
    );
    const week: Record<number, number> = {};
    for (const r of rows) {
      for (const it of r.items ?? []) {
        if (typeof it.id === "number") week[it.id] = (week[it.id] ?? 0) + it.qty;
      }
    }
    return NextResponse.json({ week, total: rows.length }, { headers: { "Cache-Control": "public, max-age=120" } });
  } catch {
    return NextResponse.json({ week: {}, total: 0 });
  }
}
