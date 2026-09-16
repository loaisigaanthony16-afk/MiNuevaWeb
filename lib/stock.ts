// =====================================================================
// Stock por producto (tabla `stock`). Sin fila = sin control (se vende).
// =====================================================================

import { db, ordersDbConfigured } from "@/lib/supabase-server";

if (typeof window !== "undefined") {
  throw new Error("lib/stock.ts es solo para el servidor");
}

export interface StockRow {
  product_id: number;
  qty: number;
}

export async function listStock(): Promise<Record<number, number>> {
  if (!ordersDbConfigured()) return {};
  const rows = await db<StockRow[]>("stock?select=product_id,qty");
  return Object.fromEntries(rows.map((r) => [r.product_id, r.qty]));
}

/** Producto (id) que no alcanza, o null si todo está disponible. */
export async function firstShort(items: { id: number; qty: number }[]): Promise<number | null> {
  const stock = await listStock();
  for (const it of items) {
    const have = stock[it.id];
    if (have !== undefined && have < it.qty) return it.id;
  }
  return null;
}

export async function setStock(productId: number, qty: number): Promise<void> {
  await db("stock?on_conflict=product_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: { product_id: productId, qty, updated_at: new Date().toISOString() },
  });
}

export async function clearStock(productId: number): Promise<void> {
  await db(`stock?product_id=eq.${productId}`, { method: "DELETE", prefer: "return=minimal" });
}

/** Descuenta lo vendido (solo productos con fila de stock). */
export async function decrementStock(items: { id: number; qty: number }[]): Promise<void> {
  await db("rpc/stock_decrement", { method: "POST", body: { p_items: items.map((i) => ({ id: i.id, qty: i.qty })) } });
}
