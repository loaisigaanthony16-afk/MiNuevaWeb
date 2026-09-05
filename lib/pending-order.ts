// =====================================================================
// Pedido pagado pendiente de coordinar.
//
// Como la dirección nunca sale del dispositivo, si alguien cierra la
// pestaña sin abrir WhatsApp el pedido queda pagado y sin datos de envío.
// Esto guarda el aviso en el navegador para poder reclamarlo cuando la
// persona vuelva a entrar.
//
// El mensaje se guarda ya armado: después del pago la bolsa se vacía, así
// que más adelante no habría forma de reconstruir la lista de artículos.
// =====================================================================

export const PENDING_KEY = "pending_whatsapp_order";

/** Evento propio para que el banner reaccione sin recargar la página. */
export const PENDING_EVENT = "vibe:pending-changed";

export interface PendingOrder {
  /** Marca explícita, tal como se pidió. */
  pending_whatsapp_order: true;
  /** Referencia del pedido, la que ve el cliente. */
  ref: string;
  /** Mensaje de WhatsApp ya construido. */
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

export function savePendingOrder(ref: string, message: string): void {
  try {
    const payload: PendingOrder = {
      pending_whatsapp_order: true,
      ref,
      message,
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
    announce();
  } catch {
    /* noop */
  }
}

export function loadPendingOrder(): PendingOrder | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingOrder>;
    if (!parsed?.pending_whatsapp_order || !parsed.ref || !parsed.message) {
      return null;
    }
    return parsed as PendingOrder;
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
