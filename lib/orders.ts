// =====================================================================
// Pedidos: registro y estado del pago.
//
// El pedido se guarda en Supabase al iniciar el cobro (`pending`) y el
// webhook de NOWPayments lo actualiza. La página consulta ese estado, así
// la confirmación no depende de que la pasarela devuelva al cliente.
//
// Sin datos personales: referencia, artículos, importes y estado.
// =====================================================================

import { db, ordersDbConfigured } from "@/lib/supabase-server";
import type { PricedOrder } from "@/lib/pricing";

/** Estado del pedido en nuestra base. */
export type OrderStatus =
  | "pending"
  | "confirming"
  | "paid"
  | "partially_paid"
  | "failed"
  | "expired"
  | "refunded";

/** Estados que manda NOWPayments en el IPN. */
const FROM_NOWPAYMENTS: Record<string, OrderStatus> = {
  waiting: "pending",
  confirming: "confirming",
  confirmed: "confirming",
  sending: "confirming",
  finished: "paid",
  partially_paid: "partially_paid",
  failed: "failed",
  refunded: "refunded",
  expired: "expired",
};

export function statusFromNowPayments(np: string): OrderStatus | null {
  return FROM_NOWPAYMENTS[np] ?? null;
}

/** Referencia válida: evita consultas raras contra la base. */
export function isOrderId(value: string): boolean {
  return /^VIBE-[A-Z0-9]{4,20}$/.test(value);
}

export function newOrderId(): string {
  const rand = Math.floor(Math.random() * 36 ** 3)
    .toString(36)
    .toUpperCase()
    .padStart(3, "0");
  return `VIBE-${Date.now().toString(36).toUpperCase()}${rand}`;
}

interface OrderRow {
  order_id: string;
  status: OrderStatus;
  total_usd: number;
  paid_at: string | null;
}

/** Guarda el pedido recién creado. Devuelve false si la base no está lista. */
export async function createOrder(
  orderId: string,
  order: PricedOrder,
  invoiceId: string | number | null
): Promise<boolean> {
  if (!ordersDbConfigured()) return false;
  try {
    await db("orders", {
      method: "POST",
      prefer: "return=minimal",
      body: {
        order_id: orderId,
        status: "pending",
        items: order.lines.map((l) => ({ id: l.id, name: l.name, qty: l.qty, unit_usd: l.unitPriceUsd })),
        subtotal_usd: order.subtotalUsd,
        delivery_usd: order.shippingUsd,
        total_usd: order.totalUsd,
        invoice_id: invoiceId === null ? null : String(invoiceId),
      },
    });
    return true;
  } catch (err) {
    // El cobro sigue igual: sin registro solo se pierde la confirmación
    // automática, y el respaldo por WhatsApp sigue funcionando.
    console.error("No se pudo guardar el pedido:", err instanceof Error ? err.message : "desconocido");
    return false;
  }
}

export interface IpnUpdate {
  orderId: string;
  npStatus: string;
  paymentId: string | number | null;
  priceAmount?: number;
  actuallyPaid?: number;
  payCurrency?: string;
}

/**
 * Aplica un aviso del webhook.
 *
 * - Un pedido pagado no retrocede por un aviso viejo o repetido (salvo
 *   reembolso).
 * - Si el importe del aviso no coincide con el del pedido, no se marca
 *   como pagado: queda para revisar.
 */
export async function applyIpn(update: IpnUpdate): Promise<void> {
  let status = statusFromNowPayments(update.npStatus);

  // Registro sin datos personales, útil aunque la base falle.
  console.log(
    "[pedido]",
    JSON.stringify({
      orderId: update.orderId,
      npStatus: update.npStatus,
      status,
      paymentId: update.paymentId,
      priceAmount: update.priceAmount,
    })
  );

  if (!status || !ordersDbConfigured() || !isOrderId(update.orderId)) return;

  const rows = await db<OrderRow[]>(
    `orders?order_id=eq.${encodeURIComponent(update.orderId)}&select=order_id,status,total_usd,paid_at`
  );
  const current = rows[0];
  if (!current) {
    console.warn("IPN de un pedido que no está en la base:", update.orderId);
    return;
  }

  if (
    status === "paid" &&
    typeof update.priceAmount === "number" &&
    Math.abs(update.priceAmount - Number(current.total_usd)) > 0.01
  ) {
    console.warn("IPN con importe distinto al del pedido, queda para revisar:", update.orderId);
    status = "partially_paid";
  }

  if (current.status === "paid" && status !== "refunded") return;

  await db(`orders?order_id=eq.${encodeURIComponent(update.orderId)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: {
      status,
      np_status: update.npStatus,
      payment_id: update.paymentId === null ? null : String(update.paymentId),
      actually_paid: update.actuallyPaid ?? null,
      pay_currency: update.payCurrency ?? null,
      ...(status === "paid" && !current.paid_at ? { paid_at: new Date().toISOString() } : {}),
    },
  });
}

/** Estado público de un pedido: solo lo que la página necesita saber. */
export async function getOrderStatus(
  orderId: string
): Promise<{ status: OrderStatus | "unknown" | "not_found"; totalUsd?: number }> {
  if (!ordersDbConfigured()) return { status: "unknown" };
  const rows = await db<OrderRow[]>(
    `orders?order_id=eq.${encodeURIComponent(orderId)}&select=order_id,status,total_usd,paid_at`
  );
  const row = rows[0];
  if (!row) return { status: "not_found" };
  return { status: row.status, totalUsd: Number(row.total_usd) };
}
