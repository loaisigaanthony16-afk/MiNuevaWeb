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

// Envío nacional: tarifa única de C$200 a cualquier punto del país.
// Se cobra en córdobas, así que el monto en dólares se deriva de la tasa.
export const NATIONAL_SHIPPING_NIO = 200;
export const NATIONAL_SHIPPING = NATIONAL_SHIPPING_NIO / EXCHANGE_RATE;
export const FREE_SHIPPING_AT = 120;
// Rango que cubre ambos modos de entrega. El tiempo exacto depende del
// departamento y lo calcula lib/shipping.ts.
export const DELIVERY_ETA = "24 a 72 horas";

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
// Único medio de pago aceptado.
export type PaymentChannel = "card";

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
    payment: { channel: "card" },
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
