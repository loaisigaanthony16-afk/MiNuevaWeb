// =====================================================================
// Estado de los pedidos.
//
// ⚠️ LÍMITE IMPORTANTE: este proyecto no tiene base de datos. Lo que hay
// acá deja constancia estructurada en los registros del servidor (que en
// Vercel se ven en Runtime Logs) y centraliza el punto donde conectar un
// almacenamiento real.
//
// Para que el estado sobreviva a un reinicio y se pueda consultar después,
// hay que reemplazar `persist()` por una escritura a una base de datos.
// Mientras tanto la fuente de verdad sigue siendo el panel de NOWPayments.
// =====================================================================

/** Estados que envía NOWPayments en el IPN. */
export type PaymentStatus =
  | "waiting"
  | "confirming"
  | "confirmed"
  | "sending"
  | "partially_paid"
  | "finished"
  | "failed"
  | "refunded"
  | "expired";

/** Cómo interpretamos cada estado de cara al despacho. */
export type OrderState = "pendiente" | "pagado" | "revisar" | "cancelado";

const STATE_BY_STATUS: Record<PaymentStatus, OrderState> = {
  waiting: "pendiente",
  confirming: "pendiente",
  confirmed: "pagado",
  sending: "pagado",
  finished: "pagado",
  partially_paid: "revisar",
  failed: "cancelado",
  refunded: "cancelado",
  expired: "cancelado",
};

export function stateForStatus(status: string): OrderState {
  return STATE_BY_STATUS[status as PaymentStatus] ?? "revisar";
}

/** Un pedido solo se despacha cuando el cobro está realmente cerrado. */
export function isPayable(status: string): boolean {
  return stateForStatus(status) === "pagado";
}

export interface OrderUpdate {
  orderId: string;
  paymentId: string | number;
  status: string;
  state: OrderState;
  priceAmount?: number;
  priceCurrency?: string;
  actuallyPaid?: number;
  payCurrency?: string;
}

/**
 * Deja constancia del cambio de estado.
 *
 * Solo se registran identificadores e importes: nunca datos personales ni
 * credenciales. La descripción del pedido no se guarda a propósito.
 *
 * Hoy escribe en los registros del servidor. El punto de extensión está
 * marcado: acá va la escritura a la base de datos o el aviso al comercio.
 */
export async function recordOrderStatus(update: OrderUpdate): Promise<void> {
  // Registro estructurado: una sola línea por evento, fácil de filtrar.
  console.log(
    "[pedido]",
    JSON.stringify({
      ...update,
      recibido_en: new Date().toISOString(),
    })
  );

  // TODO(persistencia): guardar en base de datos y avisar al comercio.
  // Ejemplo del contrato esperado:
  //   await db.orders.upsert({ where: { orderId }, update: { state, status } })
}
