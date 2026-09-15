// =====================================================================
// Pedido pendiente de coordinar, guardado en el navegador.
//
// Guarda la referencia y el token secreto del chat del pedido para poder
// volver a la conversación desde cualquier página del sitio. La
// dirección de entrega sigue viviendo solo en este dispositivo hasta que
// el cliente la manda por el chat.
// =====================================================================

export const PENDING_KEY = "vibe_pending_order";

/** Evento propio para que el banner reaccione sin recargar la página. */
export const PENDING_EVENT = "vibe:pending-changed";

/**
 * - `iniciado`: se fue a pagar; no sabemos si completó.
 * - `pagado`: el pago se confirmó; el chat está abierto.
 */
export type PendingStage = "iniciado" | "pagado";

export interface PendingOrder {
  stage: PendingStage;
  ref: string;
  /** Token secreto del chat del pedido. */
  token: string;
  /** Datos de entrega ya redactados, para mandarlos al abrir el chat. */
  message: string;
  createdAt: string;
}

function announce(): void {
  try {
    window.dispatchEvent(new Event(PENDING_EVENT));
  } catch {
    /* noop */
  }
}

export function savePendingOrder(order: Omit<PendingOrder, "createdAt">): void {
  try {
    window.localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ ...order, createdAt: new Date().toISOString() } satisfies PendingOrder)
    );
    announce();
  } catch {
    /* noop */
  }
}

export function confirmPendingOrder(ref: string): void {
  const current = loadPendingOrder();
  if (!current || current.ref !== ref) return;
  savePendingOrder({ ...current, stage: "pagado" });
}

export function loadPendingOrder(): PendingOrder | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PendingOrder>;
    if (!p.ref || !p.token) return null;
    return {
      stage: p.stage === "iniciado" ? "iniciado" : "pagado",
      ref: p.ref,
      token: p.token,
      message: p.message ?? "",
      createdAt: p.createdAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearPendingOrder(): void {
  try {
    window.localStorage.removeItem(PENDING_KEY);
    announce();
  } catch {
    /* noop */
  }
}
