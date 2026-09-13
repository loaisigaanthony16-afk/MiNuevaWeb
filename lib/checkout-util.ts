// =====================================================================
// Montos del pedido.
// - Precios en USD; los córdobas son de referencia.
// - Entrega solo en Estelí con tarifa fija de C$150 por pedido.
// =====================================================================

// Tipo de cambio de referencia USD → NIO.
export const EXCHANGE_RATE = 36.8;

/** Única zona de entrega por ahora. */
export const DELIVERY_ZONE = "Estelí";

// La entrega se cobra en córdobas; su equivalente en dólares sale de la
// tasa, redondeado a centavos para que cliente y servidor coincidan.
export const DELIVERY_FEE_NIO = 150;
export const DELIVERY_FEE_USD = Math.round((DELIVERY_FEE_NIO / EXCHANGE_RATE) * 100) / 100;

/** Costo de entrega: fijo por pedido, cero si la bolsa está vacía. */
export function deliveryFor(subtotal: number): number {
  return subtotal > 0 ? DELIVERY_FEE_USD : 0;
}

const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatUSD(value: number): string {
  return usdFmt.format(value);
}

export function formatNIO(usd: number): string {
  return `C$ ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(usd * EXCHANGE_RATE)}`;
}
