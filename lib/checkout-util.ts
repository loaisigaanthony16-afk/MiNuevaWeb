// =====================================================================
// Utilidades de pago / checkout.
// - Bimoneda (USD primaria, córdobas de referencia).
// - Envío nacional con tarifa única.
// - Payload de pedido: incluye los datos de entrega que el cliente eligió
//   dar, cifrados dentro del código. Sin cuentas ni perfiles.
// =====================================================================

import type { DeliveryInfo } from "@/lib/delivery";

// Tipo de cambio de referencia USD → NIO.
export const EXCHANGE_RATE = 36.8;

// Envío nacional: una sola tarifa para todo Nicaragua.
export const NATIONAL_SHIPPING = 4.0;
export const FREE_SHIPPING_AT = 60;
export const DELIVERY_ETA = "24 a 48 horas";

// ---- Formateadores bimoneda ----
const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatUSD(value: number): string {
  return usdFmt.format(value);
}

export function toNIO(usd: number): number {
  return usd * EXCHANGE_RATE;
}

export function formatNIO(usd: number): string {
  return `C$ ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(toNIO(usd))}`;
}

export function formatCompactUSD(value: number): string {
  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

/** Costo de envío según subtotal. */
export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_AT ? 0 : NATIONAL_SHIPPING;
}

// ---- Tipos de pedido ----
export type PaymentChannel = "card" | "bank" | "cash";
export type BankMethod = "BAC" | "Banpro" | "LAFISE";

export const PAYMENT_LABEL: Record<PaymentChannel, string> = {
  card: "Tarjeta",
  bank: "Transferencia",
  cash: "Efectivo",
};

export interface LineItemOutgoing {
  product_id: number;
  name: string;
  qty: number;
  unit_price_usd: number;
  line_total_usd: number;
}

export interface OrderPayload {
  channel: "checkout";
  created_at: string;
  currency_rates: { usd_to_nio: number };
  items: LineItemOutgoing[];
  delivery: {
    scope: "nacional";
    eta: string;
    shipping_usd: number;
    alias: string;
    phone: string;
    region: string;
    address: string;
    notes: string;
  };
  payment: {
    channel: PaymentChannel;
    bank?: BankMethod;
  };
  totals: {
    subtotal_usd: number;
    shipping_usd: number;
    total_usd: number;
    total_nio: number;
  };
}

export interface OrderDraft {
  items: { id: number; name: string; qty: number; price: number }[];
  delivery: DeliveryInfo;
  payment: PaymentChannel;
  bank?: BankMethod;
  subtotalUsd: number;
  shippingUsd: number;
  totalUsd: number;
}

/** Payload estructurado del pedido, listo para cifrar en el código. */
export function buildOrderPayload(draft: OrderDraft): OrderPayload {
  return {
    channel: "checkout",
    created_at: new Date().toISOString(),
    currency_rates: { usd_to_nio: EXCHANGE_RATE },
    items: draft.items.map((it) => ({
      product_id: it.id,
      name: it.name,
      qty: it.qty,
      unit_price_usd: it.price,
      line_total_usd: it.price * it.qty,
    })),
    delivery: {
      scope: "nacional",
      eta: DELIVERY_ETA,
      shipping_usd: draft.shippingUsd,
      alias: draft.delivery.alias,
      phone: draft.delivery.phone,
      region: draft.delivery.region,
      address: draft.delivery.address,
      notes: draft.delivery.notes,
    },
    payment: {
      channel: draft.payment,
      ...(draft.payment === "bank" && draft.bank ? { bank: draft.bank } : {}),
    },
    totals: {
      subtotal_usd: draft.subtotalUsd,
      shipping_usd: draft.shippingUsd,
      total_usd: draft.totalUsd,
      total_nio: toNIO(draft.totalUsd),
    },
  };
}

/** Codifica el pedido en un bloque seguro de copiar/pegar. */
export function encodeOrder(payload: OrderPayload): string {
  const json = JSON.stringify(payload);
  if (typeof window === "undefined") return "";
  return btoa(unescape(encodeURIComponent(json)));
}

/** Código corto legible que el cliente guarda. */
export function makeOrderCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `VIBE-${n}`;
}
