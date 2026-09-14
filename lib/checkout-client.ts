// =====================================================================
// Llamadas del navegador al checkout y armado del aviso de WhatsApp.
// =====================================================================

import { getProduct } from "@/lib/data";
import type { CartItem } from "@/lib/store";
import type { DeliveryInfo } from "@/lib/delivery";
import { buildWhatsappMessage } from "@/lib/whatsapp";

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
  invoiceUrl: string;
  embeddable: boolean;
  tracked: boolean;
  totalUsd: number;
}

export class CheckoutError extends Error {}

export async function initCheckout(items: CartItem[]): Promise<InitResponse> {
  let res: Response;
  try {
    res = await fetch("/api/checkout/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Solo id y cantidad: el precio lo pone el servidor y la dirección
      // se queda en este dispositivo.
      body: JSON.stringify({ items: items.map((it) => ({ id: it.id, qty: it.qty })) }),
    });
  } catch {
    throw new CheckoutError("network");
  }
  const data = (await res.json().catch(() => ({}))) as Partial<InitResponse> & { error?: string };
  if (!res.ok || !data.invoiceUrl || !data.orderId) {
    throw new CheckoutError(data.error ?? "start");
  }
  return data as InitResponse;
}

export async function fetchOrderStatus(orderId: string): Promise<OrderStatusValue> {
  try {
    const res = await fetch(`/api/checkout/status/${encodeURIComponent(orderId)}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { status?: OrderStatusValue };
    return data.status ?? "unknown";
  } catch {
    return "unknown";
  }
}

/** Mensaje de WhatsApp con lo que había en la bolsa y la dirección local. */
export function whatsappMessageFor(
  orderId: string | null,
  items: CartItem[],
  delivery: DeliveryInfo | null,
  totalUsd?: number
): string {
  return buildWhatsappMessage({
    orderId,
    lines: items.map((it) => ({ qty: it.qty, name: getProduct(it.id)?.name ?? "" })),
    delivery,
    totalUsd,
  });
}
