// =====================================================================
// Pedidos: registro y estado del pago (Stripe + Supabase).
//
// El pedido se guarda al iniciar el cobro (`pending`) y el webhook de
// Stripe lo actualiza. La página consulta ese estado, así la confirmación
// no depende de que el navegador del cliente siga abierto.
//
// Sin datos personales: referencia, artículos, importes y estado.
// =====================================================================

import { db, ordersDbConfigured } from "@/lib/supabase-server";
import { notifyPaidOrder } from "@/lib/notify-email";
import type { PricedOrder } from "@/lib/pricing";

export type OrderStatus =
  | "pending"
  | "confirming"
  | "paid"
  | "partially_paid"
  | "failed"
  | "expired"
  | "refunded";

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
  stripe_session_id: string | null;
  items: { name: string; qty: number }[];
}

const SELECT = "select=order_id,status,total_usd,paid_at,stripe_session_id,items";

/** Guarda el pedido recién creado. Devuelve false si la base no está lista. */
export async function createOrder(
  orderId: string,
  order: PricedOrder,
  stripeSessionId: string,
  chatToken: string
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
        stripe_session_id: stripeSessionId,
        chat_token: chatToken,
      },
    });
    return true;
  } catch (err) {
    // El cobro sigue igual: sin registro solo se pierde la confirmación
    // desde la base, y la página verifica directamente con Stripe.
    console.error("No se pudo guardar el pedido:", err instanceof Error ? err.message : "desconocido");
    return false;
  }
}

export interface PaymentUpdate {
  orderId: string;
  status: OrderStatus;
  stripeSessionId: string;
  paymentIntent: string | null;
  amountTotalCents: number | null;
}

/**
 * Aplica un cambio de estado que llegó por webhook.
 *
 * - Un pedido pagado no retrocede por un evento viejo o repetido (salvo
 *   reembolso).
 * - Si el importe cobrado no coincide con el del pedido, no se marca como
 *   pagado: queda para revisar.
 */
export async function applyPayment(update: PaymentUpdate): Promise<void> {
  console.log(
    "[pedido]",
    JSON.stringify({ orderId: update.orderId, status: update.status, session: update.stripeSessionId })
  );

  if (!ordersDbConfigured() || !isOrderId(update.orderId)) return;

  const rows = await db<OrderRow[]>(`orders?order_id=eq.${encodeURIComponent(update.orderId)}&${SELECT}`);
  const current = rows[0];
  if (!current) {
    console.warn("Evento de un pedido que no está en la base:", update.orderId);
    return;
  }
  if (current.stripe_session_id && current.stripe_session_id !== update.stripeSessionId) {
    console.warn("Evento con una sesión distinta a la del pedido, descartado:", update.orderId);
    return;
  }

  let status = update.status;
  if (
    status === "paid" &&
    update.amountTotalCents !== null &&
    update.amountTotalCents !== Math.round(Number(current.total_usd) * 100)
  ) {
    console.warn("Importe cobrado distinto al del pedido, queda para revisar:", update.orderId);
    status = "partially_paid";
  }

  if (current.status === "paid" && status !== "refunded") return;

  await db(`orders?order_id=eq.${encodeURIComponent(update.orderId)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: {
      status,
      stripe_payment_intent: update.paymentIntent,
      ...(status === "paid" && !current.paid_at ? { paid_at: new Date().toISOString() } : {}),
    },
  });

  // Aviso al comercio solo la primera vez que el pedido queda pagado
  // (los eventos repetidos de Stripe no vuelven a escribir).
  if (status === "paid" && current.status !== "paid") {
    await notifyPaidOrder({ orderId: update.orderId, totalUsd: current.total_usd, items: current.items ?? [] });
  }
}

/** Estado de un pedido según la base. */
export async function getOrderRow(orderId: string): Promise<OrderRow | null | "unconfigured"> {
  if (!ordersDbConfigured()) return "unconfigured";
  const rows = await db<OrderRow[]>(`orders?order_id=eq.${encodeURIComponent(orderId)}&${SELECT}`);
  return rows[0] ?? null;
}
