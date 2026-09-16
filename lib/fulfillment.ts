// =====================================================================
// Estados de entrega del pedido (compartido por cliente, panel y seguimiento).
// =====================================================================

export const FULFILLMENT_STEPS = ["recibido", "preparando", "en_camino", "entregado"] as const;
export type Fulfillment = (typeof FULFILLMENT_STEPS)[number];

export const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
  recibido: "Recibido",
  preparando: "Preparando",
  en_camino: "En camino",
  entregado: "Entregado",
};

/** Lo que ve el cliente al cambiar de estado (push y chat). */
export const FULFILLMENT_NOTICE: Record<Fulfillment, string> = {
  recibido: "Recibimos tu pedido.",
  preparando: "Estamos preparando tu pedido.",
  en_camino: "Tu pedido va en camino. Estate pendiente del teléfono.",
  entregado: "Pedido entregado. ¡Gracias por tu compra!",
};

export function isFulfillment(v: unknown): v is Fulfillment {
  return typeof v === "string" && (FULFILLMENT_STEPS as readonly string[]).includes(v);
}

export function stepIndex(f: Fulfillment): number {
  return FULFILLMENT_STEPS.indexOf(f);
}
