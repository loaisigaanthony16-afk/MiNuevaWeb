// =====================================================================
// Datos reales que usan las páginas legales. Un solo lugar para
// mantenerlos al día.
// =====================================================================

import { DELIVERY_FEE_NIO, DELIVERY_FEE_USD, DELIVERY_ZONE, EXCHANGE_RATE } from "@/lib/checkout-util";

export const LEGAL = {
  brand: "Vibe 505",
  site: "vibe505.com",
  zone: DELIVERY_ZONE,
  country: "Nicaragua",
  minAge: 21,
  deliveryFeeNio: DELIVERY_FEE_NIO,
  deliveryFeeUsd: DELIVERY_FEE_USD,
  exchangeRate: EXCHANGE_RATE,
  /** Canal de atención: el chat cifrado de cada pedido, dentro del sitio. */
  channel: "el chat de tu pedido en el sitio",
  paymentProcessor: "Stripe",
  updated: "14 de septiembre de 2026",
} as const;

/** Clave de la confirmación de edad (21+). Cambió desde la de 18+. */
export const AGE_KEY = "vibe21";
