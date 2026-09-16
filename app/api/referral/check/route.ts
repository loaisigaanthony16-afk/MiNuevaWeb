import { NextResponse } from "next/server";
import { checkCode, normalizeCode } from "@/lib/referrals";
import { ordersDbConfigured } from "@/lib/supabase-server";
import { allow, clientIp } from "@/lib/rate-limit";

/** ¿Qué hace este código de cliente al pagar? (vista previa en la bolsa) */
export async function POST(request: Request) {
  if (!ordersDbConfigured()) return NextResponse.json({ ok: false, reason: "invalid" });
  if (!allow(`ref:${clientIp(request)}`, 30, 10 * 60 * 1000)) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 429 });
  let body: { code?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }
  const code = normalizeCode(body.code);
  if (code.length !== 6) return NextResponse.json({ ok: false, reason: "invalid" });
  try {
    return NextResponse.json(await checkCode(code), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 500 });
  }
}
