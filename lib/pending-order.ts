// =====================================================================
// Pedidos por coordinar, guardados en el navegador.
//
// Guarda la referencia y el token secreto del chat de cada pedido para
// poder volver a la conversación desde cualquier página del sitio. Es una
// lista: empezar otra compra no borra el acceso a un pedido ya pagado.
// La dirección de entrega sigue viviendo solo en este dispositivo hasta
// que el cliente la manda por el chat.
// =====================================================================

export const PENDING_KEY = "vibe_pending_orders";
/** Versión anterior: un solo pedido. Se migra al leer. */
const LEGACY_KEY = "vibe_pending_order";
/** Más que suficiente para pedidos abiertos a la vez en un equipo. */
const MAX_ORDERS = 6;

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

function normalize(p: Partial<PendingOrder> | null | undefined): PendingOrder | null {
  if (!p || !p.ref || !p.token) return null;
  return {
    stage: p.stage === "iniciado" ? "iniciado" : "pagado",
    ref: p.ref,
    token: p.token,
    message: p.message ?? "",
    createdAt: p.createdAt ?? new Date().toISOString(),
  };
}

function readAll(): PendingOrder[] {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    let list = raw ? ((JSON.parse(raw) as Partial<PendingOrder>[]) ?? []).map(normalize).filter((p): p is PendingOrder => p !== null) : [];
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = normalize(JSON.parse(legacy) as Partial<PendingOrder>);
      window.localStorage.removeItem(LEGACY_KEY);
      if (old && !list.some((p) => p.ref === old.ref)) {
        list = [old, ...list];
        window.localStorage.setItem(PENDING_KEY, JSON.stringify(list));
      }
    }
    return list;
  } catch {
    return [];
  }
}

function writeAll(list: PendingOrder[]): void {
  try {
    if (list.length) window.localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(0, MAX_ORDERS)));
    else window.localStorage.removeItem(PENDING_KEY);
    announce();
  } catch {
    /* noop */
  }
}

/** Todos los pedidos guardados, el más nuevo primero. */
export function loadPendingOrders(): PendingOrder[] {
  return readAll();
}

/** Un pedido concreto, si este equipo lo tiene. */
export function getPendingOrder(ref: string): PendingOrder | null {
  return readAll().find((p) => p.ref === ref) ?? null;
}

/**
 * El pedido a mostrar en el aviso: el pagado más nuevo (tiene chat) o,
 * si no hay ninguno, el último que se fue a pagar.
 */
export function loadPendingOrder(): PendingOrder | null {
  const list = readAll();
  return list.find((p) => p.stage === "pagado") ?? list[0] ?? null;
}

/** Guarda o actualiza un pedido. Nunca vuelve "pagado" a "iniciado". */
export function savePendingOrder(order: Omit<PendingOrder, "createdAt">): void {
  const list = readAll();
  const prev = list.find((p) => p.ref === order.ref);
  const next: PendingOrder = {
    ...order,
    stage: prev?.stage === "pagado" ? "pagado" : order.stage,
    message: order.message || prev?.message || "",
    createdAt: prev?.createdAt ?? new Date().toISOString(),
  };
  writeAll([next, ...list.filter((p) => p.ref !== order.ref)]);
}

export function confirmPendingOrder(ref: string): void {
  const current = getPendingOrder(ref);
  if (!current || current.stage === "pagado") return;
  savePendingOrder({ ...current, stage: "pagado" });
}

/** Quita un pedido (entregado, cerrado o descartado). */
export function clearPendingOrder(ref: string): void {
  const list = readAll();
  if (!list.some((p) => p.ref === ref)) return;
  writeAll(list.filter((p) => p.ref !== ref));
}
