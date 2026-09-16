// =====================================================================
// Cliente frecuente: cada pedido pagado genera (o suma a) un código de 6
// letras. El cliente lo escribe al pagar y cada 3 compras gana un cupón
// de $10 que se descuenta en la siguiente compra donde lo use.
//
// Sin cuenta: el código es la única identidad. Se guarda en el dispositivo
// y también se muestra en la página del pedido.
// =====================================================================

import crypto from "node:crypto";
import { db } from "@/lib/supabase-server";
import { LOYALTY_COUPON_USD, LOYALTY_EVERY } from "@/lib/loyalty";

if (typeof window !== "undefined") {
  throw new Error("lib/referrals.ts es solo para el servidor");
}

export interface Referral {
  code: string;
  owner_order_id: string;
  /** Cupones de $10 disponibles. */
  credits: number;
  /** Compras acumuladas con este código. */
  purchases: number;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SELECT = "select=code,owner_order_id,credits,purchases";

export function normalizeCode(v: unknown): string {
  return String(v ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

function newCode(): string {
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Código del pedido (lo crea si no existe; la primera compra ya cuenta). */
export async function ensureCode(orderId: string): Promise<string> {
  const rows = await db<Referral[]>(`referrals?owner_order_id=eq.${encodeURIComponent(orderId)}&${SELECT}`);
  if (rows[0]) return rows[0].code;
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    try {
      await db("referrals", { method: "POST", prefer: "return=minimal", body: { code, owner_order_id: orderId, purchases: 1 } });
      await db(`orders?order_id=eq.${encodeURIComponent(orderId)}`, { method: "PATCH", prefer: "return=minimal", body: { referral_code: code } });
      return code;
    } catch {
      /* colisión: se intenta otro */
    }
  }
  throw new Error("No se pudo crear el código de cliente");
}

export async function getReferral(code: string): Promise<Referral | null> {
  const rows = await db<Referral[]>(`referrals?code=eq.${encodeURIComponent(code)}&${SELECT}`);
  return rows[0] ?? null;
}

export type CodeCheck =
  | { ok: true; kind: "credit" | "count"; code: string; purchases: number; credits: number; discountUsd: number }
  | { ok: false; reason: "invalid" };

/**
 * Qué pasa si usa este código ahora: descuento de $10 si tiene cupón
 * (`credit`), o solo suma la compra al contador (`count`).
 */
export async function checkCode(code: string): Promise<CodeCheck> {
  const ref = await getReferral(code);
  if (!ref) return { ok: false, reason: "invalid" };
  const hasCoupon = ref.credits > 0;
  return {
    ok: true,
    kind: hasCoupon ? "credit" : "count",
    code,
    purchases: ref.purchases,
    credits: ref.credits,
    discountUsd: hasCoupon ? LOYALTY_COUPON_USD : 0,
  };
}

/** Se aplica al confirmarse el pago del pedido que usó el código. */
export async function redeem(orderId: string, code: string, kind: "credit" | "count"): Promise<void> {
  const ref = await getReferral(code);
  if (!ref) return;
  const purchases = ref.purchases + 1;
  let credits = kind === "credit" ? Math.max(0, ref.credits - 1) : ref.credits;
  if (purchases % LOYALTY_EVERY === 0) credits += 1;
  await db(`referrals?code=eq.${encodeURIComponent(code)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: { purchases, credits },
  });
  // El nuevo pedido queda ligado al mismo código: no se crea otro.
  await db(`orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: { referral_code: code },
  });
}
