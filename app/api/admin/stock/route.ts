import { NextResponse } from "next/server";
import { chatConfigured, isAdmin } from "@/lib/chat-server";
import { clearStock, listStock, setStock } from "@/lib/stock";
import { getProduct } from "@/lib/data";

function guard(request: Request) {
  if (!process.env.ADMIN_KEY) return NextResponse.json({ error: "no_admin" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "forbidden" }, { status: 401 });
  if (!chatConfigured()) return NextResponse.json({ error: "no_db" }, { status: 503 });
  return null;
}

/** Panel: stock actual (solo productos con control). */
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ stock: await listStock() }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Error leyendo stock:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}

/** Panel: fijar stock de un producto. `qty: null` quita el control. */
export async function PUT(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  let body: { productId?: number; qty?: number | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const id = Number(body.productId);
  if (!getProduct(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    if (body.qty === null || body.qty === undefined) await clearStock(id);
    else {
      const qty = Math.max(0, Math.min(9999, Math.floor(Number(body.qty))));
      if (!Number.isFinite(qty)) return NextResponse.json({ error: "invalid" }, { status: 400 });
      await setStock(id, qty);
    }
    return NextResponse.json({ stock: await listStock() });
  } catch (err) {
    console.error("Error guardando stock:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
