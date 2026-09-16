import { NextResponse } from "next/server";
import { listStock } from "@/lib/stock";
import { ordersDbConfigured } from "@/lib/supabase-server";

/** Público: existencias por producto (solo los que tienen control). */
export async function GET() {
  if (!ordersDbConfigured()) return NextResponse.json({ stock: {} });
  try {
    return NextResponse.json({ stock: await listStock() }, { headers: { "Cache-Control": "public, max-age=30" } });
  } catch {
    return NextResponse.json({ stock: {} });
  }
}
