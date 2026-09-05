// =====================================================================
// Cálculo del total del pedido — SIEMPRE en el servidor.
//
// El cliente solo manda qué producto y cuántas unidades. El precio sale
// del catálogo del servidor, nunca del navegador: si viniera del cliente,
// cualquiera podría editar la petición y pagar lo que quisiera.
// =====================================================================

import { getProduct } from "@/lib/data";
import { FREE_SHIPPING_AT, shippingFor } from "@/lib/checkout-util";

/** Lo único que aceptamos del cliente. */
export interface CartLineInput {
  id: number;
  qty: number;
}

export interface PricedLine {
  id: number;
  name: string;
  qty: number;
  unitPriceUsd: number;
  lineTotalUsd: number;
}

export interface PricedOrder {
  lines: PricedLine[];
  subtotalUsd: number;
  shippingUsd: number;
  totalUsd: number;
  /** Total en la unidad mínima de la moneda (centavos). */
  amountInCents: number;
}

export const MAX_QTY_PER_LINE = 99;
export const MAX_LINES = 40;

/** Error de validación con mensaje apto para mostrar al cliente. */
export class PricingError extends Error {}

/**
 * Convierte la bolsa del cliente en un cobro verificado.
 * Lanza `PricingError` si la bolsa está vacía o trae datos inválidos.
 */
export function priceOrder(input: unknown): PricedOrder {
  if (!Array.isArray(input) || input.length === 0) {
    throw new PricingError("La bolsa está vacía.");
  }
  if (input.length > MAX_LINES) {
    throw new PricingError("Demasiados artículos en la bolsa.");
  }

  const lines: PricedLine[] = [];

  for (const raw of input as CartLineInput[]) {
    const id = Number(raw?.id);
    const qty = Math.floor(Number(raw?.qty));

    if (!Number.isInteger(id)) {
      throw new PricingError("Artículo inválido.");
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      throw new PricingError("Cantidad inválida.");
    }

    // El precio viene del catálogo del servidor, no de la petición.
    const product = getProduct(id);
    if (!product) {
      throw new PricingError("Ese producto ya no está disponible.");
    }

    lines.push({
      id: product.id,
      name: product.name,
      qty,
      unitPriceUsd: product.price,
      lineTotalUsd: round2(product.price * qty),
    });
  }

  const subtotalUsd = round2(lines.reduce((acc, l) => acc + l.lineTotalUsd, 0));
  const shippingUsd = round2(shippingFor(subtotalUsd));
  const totalUsd = round2(subtotalUsd + shippingUsd);

  if (totalUsd <= 0) {
    throw new PricingError("Total inválido.");
  }

  return {
    lines,
    subtotalUsd,
    shippingUsd,
    totalUsd,
    // A la unidad mínima de la moneda: 10.00 USD → 1000.
    amountInCents: Math.round(totalUsd * 100),
  };
}

/** Resumen corto del pedido, para la descripción de la factura. */
export function summarize(order: PricedOrder): string {
  return order.lines.map((l) => `${l.qty}x ${l.name}`).join(", ");
}

/** Envío gratis a partir de este monto (para mensajes al cliente). */
export const FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_AT;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
