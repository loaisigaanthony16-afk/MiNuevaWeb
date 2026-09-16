// =====================================================================
// Programa de cliente frecuente: por cada 3 compras, un cupón de $10.
// El código del cliente (6 letras) identifica sus compras; no hay cuenta.
// =====================================================================

export const LOYALTY_EVERY = 3;
export const LOYALTY_COUPON_USD = 10;

/** Compras que faltan para el próximo cupón. */
export function purchasesToNext(purchases: number): number {
  const r = purchases % LOYALTY_EVERY;
  return r === 0 ? LOYALTY_EVERY : LOYALTY_EVERY - r;
}
