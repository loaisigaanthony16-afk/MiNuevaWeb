// =====================================================================
// Pedido pendiente de coordinar por WhatsApp.
//
// Como la dirección nunca sale del dispositivo, si alguien no nos manda sus
// datos el pedido queda sin despachar. Este módulo guarda el aviso en el
// navegador para poder reclamarlo cuando la persona vuelva a entrar.
//
// CLAVE: el aviso se guarda ANTES de salir hacia la pasarela, no al volver.
// Si esperáramos al retorno y la pasarela no redirigiera —o el cliente
// cerrara la pestaña en la página de pago— no quedaría rastro de nada.
//
// El mensaje se guarda ya armado porque después del pago la bolsa se vacía
// y más tarde no habría forma de reconstruir la lista de artículos.
// =====================================================================

export const PENDING_KEY = "pending_whatsapp_order";

/** Evento propio para que el banner reaccione sin recargar la página. */
export const PENDING_EVENT = "vibe:pending-changed";

/**
 * En qué punto del pago quedó.
 * - `iniciado`: se fue a la pasarela; no sabemos si llegó a pagar.
 * - `pagado`: volvió por el success_url, así que el cobro se completó.
 */
export type PendingStage = "iniciado" | "pagado";

export interface PendingOrder {
  /** Marca explícita del pendiente. */
  pending_whatsapp_order: true;
  stage: PendingStage;
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

export function savePendingOrder(
  ref: string,
  message: string,
  stage: PendingStage
): void {
  try {
    const payload: PendingOrder = {
      pending_whatsapp_order: true,
      stage,
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

/**
 * Sube el pendiente a "pagado" conservando el mensaje ya guardado.
 * Se usa al volver por el success_url.
 */
export function confirmPendingOrder(ref: string, message?: string): void {
  const current = loadPendingOrder();
  savePendingOrder(
    ref || current?.ref || "",
    message ?? current?.message ?? "",
    "pagado"
  );
}

export function loadPendingOrder(): PendingOrder | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingOrder>;
    if (!parsed?.pending_whatsapp_order || !parsed.message) return null;
    return {
      pending_whatsapp_order: true,
      // Los avisos guardados antes de existir `stage` se tratan como pagados.
      stage: parsed.stage === "iniciado" ? "iniciado" : "pagado",
      ref: parsed.ref ?? "",
      message: parsed.message,
      createdAt: parsed.createdAt ?? new Date().toISOString(),
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
