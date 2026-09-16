// =====================================================================
// Llamadas del navegador al checkout y armado del primer mensaje del chat.
// =====================================================================

import { getProduct } from "@/lib/data";
import type { CartItem } from "@/lib/store";
import type { DeliveryInfo } from "@/lib/delivery";
import { buildDeliveryMessage } from "@/lib/delivery-message";
import { deviceId } from "@/lib/community";
import { loadOwnCodes, loadRefCode } from "@/lib/referral-client";

export type OrderStatusValue =
  | "pending"
  | "confirming"
  | "paid"
  | "partially_paid"
  | "failed"
  | "expired"
  | "refunded"
  | "unknown"
  | "not_found";

export interface InitResponse {
  orderId: string;
  sessionId: string;
  /** Formulario incrustado de Stripe. */
  clientSecret: string | null;
  /** Página alojada de Stripe, cuando no hay formulario incrustado. */
  url: string | null;
  tracked: boolean;
  /** Token secreto del chat del pedido (null si no hay base). */
  chatToken: string | null;
  totalUsd: number;
  deliveryUsd: number;
  referralApplied: boolean;
}

export class CheckoutError extends Error {}

export async function initCheckout(items: CartItem[]): Promise<InitResponse> {
  let res: Response;
  try {
    res = await fetch("/api/checkout/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Solo id y cantidad: el precio lo pone el servidor y la dirección
      // se queda en este dispositivo. El código de referido y el id anónimo
      // del dispositivo van para validar la entrega gratis.
      body: JSON.stringify({
        items: items.map((it) => ({ id: it.id, qty: it.qty })),
        code: loadRefCode() || undefined,
        device: deviceId(),
        own: loadOwnCodes(),
      }),
    });
  } catch {
    throw new CheckoutError("network");
  }
  const data = (await res.json().catch(() => ({}))) as Partial<InitResponse> & { error?: string };
  if (!res.ok || !data.orderId || (!data.clientSecret && !data.url)) {
    throw new CheckoutError(data.error ?? "start");
  }
  return data as InitResponse;
}

export async function fetchOrderStatus(orderId: string, sessionId?: string | null): Promise<OrderStatusValue> {
  try {
    const q = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    const res = await fetch(`/api/checkout/status/${encodeURIComponent(orderId)}${q}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { status?: OrderStatusValue };
    return data.status ?? "unknown";
  } catch {
    return "unknown";
  }
}

/** Primer mensaje del chat: lo que había en la bolsa y la dirección local. */
export function deliveryMessageFor(
  orderId: string | null,
  items: CartItem[],
  delivery: DeliveryInfo | null,
  totalUsd?: number
): string {
  return buildDeliveryMessage({
    orderId,
    lines: items.map((it) => ({ qty: it.qty, name: getProduct(it.id)?.name ?? "" })),
    delivery,
    totalUsd,
  });
}
