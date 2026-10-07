// =====================================================================
// Panel: resumen de visitas. Solo con la clave del comercio.
// =====================================================================

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/chat-server";
import { db, ordersDbConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.ADMIN_KEY) return NextResponse.json({ error: "no_admin" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "forbidden" }, { status: 401 });
  if (!ordersDbConfigured()) return NextResponse.json({ error: "no_db" }, { status: 503 });

  const pedido = Number(new URL(request.url).searchParams.get("dias"));
  const dias = [7, 30, 90].includes(pedido) ? pedido : 30;

  try {
    // Dos funciones en Postgres que ya devuelven todo armado: el resumen
    // del período y los últimos recorridos, paso a paso.
    const [resumen, recorridos] = await Promise.all([
      db<Record<string, unknown>>("rpc/visitas_resumen", { method: "POST", body: { dias } }),
      db<unknown[]>("rpc/visitas_sesiones", { method: "POST", body: { dias, limite: 40 } }),
    ]);
    return NextResponse.json(
      // `sesiones` dentro del resumen es el CONTEO de visitantes; la
      // lista paso a paso va aparte para no pisarlo.
      { ...resumen, recorridos },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Error leyendo visitas:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
