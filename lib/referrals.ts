// =====================================================================
// Referidos: cada pedido pagado genera un código. Quien lo usa recibe la
// entrega gratis (una vez por dispositivo); el dueño acumula un crédito
// por cada uso y lo canjea escribiendo su propio código.
// =====================================================================

import crypto from "node:crypto";
import { db } from "@/lib/supabase-server";

if (typeof window !== "undefined") {
  throw new Error("lib/referrals.ts es solo para el servidor");
}

export interface Referral {
  code: string;
  owner_order_id: string;
  credits: number;
  uses: number;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function isCode(v: unknown): v is string {
  return typeof v === "string" && /^[A-Z0-9]{6}$/.test(v);
}

export function normalizeCode(v: unknown): string {
  return String(v ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

function newCode(): string {
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Código del pedido (lo crea si no existe). */
export async function ensureCode(orderId: string): Promise<string> {
  const rows = await db<Referral[]>(`referrals?owner_order_id=eq.${encodeURIComponent(orderId)}&select=code,owner_order_id,credits,uses`);
  if (rows[0]) return rows[0].code;
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    try {
      await db("referrals", { method: "POST", prefer: "return=minimal", body: { code, owner_order_id: orderId } });
      await db(`orders?order_id=eq.${encodeURIComponent(orderId)}`, { method: "PATCH", prefer: "return=minimal", body: { referral_code: code } });
      return code;
    } catch {
      /* colisión: se intenta otro */
    }
  }
  throw new Error("No se pudo crear el código de referido");
}

export async function getReferral(code: string): Promise<Referral | null> {
  const rows = await db<Referral[]>(`referrals?code=eq.${encodeURIComponent(code)}&select=code,owner_order_id,credits,uses`);
  return rows[0] ?? null;
}

export type CodeCheck =
  | { ok: true; kind: "friend" | "credit"; code: string }
  | { ok: false; reason: "invalid" | "used" | "no_credit" };

/**
 * ¿Este código da entrega gratis a este dispositivo?
 * - Código ajeno: sí, si el dispositivo nunca canjeó uno.
 * - Código propio (guardado en el dispositivo): sí, si tiene créditos.
 */
export async function checkCode(code: string, deviceId: string, ownCodes: string[]): Promise<CodeCheck> {
  const ref = await getReferral(code);
  if (!ref) return { ok: false, reason: "invalid" };
  // El dueño solo puede canjear créditos, nunca "referirse" a sí mismo.
  if (ownCodes.includes(code)) {
    return ref.credits > 0 ? { ok: true, kind: "credit", code } : { ok: false, reason: "no_credit" };
  }
  const used = await db<{ device_id: string }[]>(`referral_uses?device_id=eq.${encodeURIComponent(deviceId)}&select=device_id`);
  if (used.length) return { ok: false, reason: "used" };
  return { ok: true, kind: "friend", code };
}

/** Se aplica al confirmarse el pago del pedido que usó el código. */
export async function redeem(orderId: string, code: string, deviceId: string | null, kind: "friend" | "credit"): Promise<void> {
  const ref = await getReferral(code);
  if (!ref) return;
  if (kind === "credit") {
    await db(`referrals?code=eq.${encodeURIComponent(code)}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: { credits: Math.max(0, ref.credits - 1) },
    });
    return;
  }
  if (deviceId) {
    try {
      await db("referral_uses", { method: "POST", prefer: "return=minimal", body: { device_id: deviceId, code, order_id: orderId } });
    } catch {
      /* ya canjeó con otro pedido: no se duplica el crédito */
      return;
    }
  }
  await db(`referrals?code=eq.${encodeURIComponent(code)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: { credits: ref.credits + 1, uses: ref.uses + 1 },
  });
}
