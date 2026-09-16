import { NextResponse } from "next/server";
import { checkCode, normalizeCode } from "@/lib/referrals";
import { ordersDbConfigured } from "@/lib/supabase-server";
import { allow, clientIp } from "@/lib/rate-limit";
import { DELIVERY_FEE_NIO } from "@/lib/checkout-util";

/** ¿Vale este código para este dispositivo? (vista previa antes de pagar) */
export async function POST(request: Request) {
  if (!ordersDbConfigured()) return NextResponse.json({ ok: false, reason: "invalid" });
  if (!allow(`ref:${clientIp(request)}`, 30, 10 * 60 * 1000)) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 429 });
  let body: { code?: string; device?: string; own?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }
  const code = normalizeCode(body.code);
  if (code.length !== 6) return NextResponse.json({ ok: false, reason: "invalid" });
  const device = typeof body.device === "string" && /^[a-f0-9]{32}$/.test(body.device) ? body.device : "sin-dispositivo";
  const own = Array.isArray(body.own) ? body.own.map(normalizeCode).filter((c) => c.length === 6) : [];
  try {
    const res = await checkCode(code, device, own);
    return NextResponse.json(res.ok ? { ...res, savesNio: DELIVERY_FEE_NIO } : res, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 500 });
  }
}
