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
import { ensureWelcome } from "@/lib/chat-server";
import { pushShop } from "@/lib/push-server";
import { decrementStock } from "@/lib/stock";
import { ensureCode, redeem, returnCredit } from "@/lib/referrals";
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
  items: { id?: number; name: string; qty: number }[];
  referral_used: string | null;
}

const SELECT = "select=order_id,status,total_usd,paid_at,stripe_session_id,items,referral_used";

/** Código de cliente que usó el pedido, guardado como JSON en `referral_used`. */
export interface ReferralUse {
  code: string;
  /** `credit`: descontó un cupón · `count`: solo suma la compra. */
  kind: "credit" | "count";
}

/** Guarda el pedido recién creado. Devuelve false si la base no está lista. */
export async function createOrder(
  orderId: string,
  order: PricedOrder,
  stripeSessionId: string,
  chatToken: string,
  referral: ReferralUse | null = null
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
        referral_used: referral ? JSON.stringify(referral) : null,
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

  // Pasar a pagado (o a cerrado sin pago) se reclama en la misma escritura:
  // si el webhook, el cron y la página de confirmación llegan a la vez,
  // solo uno recibe la fila de vuelta y dispara los efectos.
  const becomesPaid = status === "paid";
  const becomesDead = status === "expired" || status === "failed";
  const guard = becomesPaid
    ? "&status=neq.paid"
    : becomesDead
      ? "&status=not.in.(paid,expired,failed,refunded)"
      : "";
  const updated = await db<{ order_id: string }[]>(
    `orders?order_id=eq.${encodeURIComponent(update.orderId)}${guard}&select=order_id`,
    {
      method: "PATCH",
      prefer: "return=representation",
      body: {
        status,
        stripe_payment_intent: update.paymentIntent,
        ...(becomesPaid && !current.paid_at ? { paid_at: new Date().toISOString(), fulfillment_at: new Date().toISOString() } : {}),
      },
    }
  );

  if (becomesPaid && updated?.length) {
    await onPaid(current);
  }
  // Sin pago: el cupón reservado al iniciar el cobro vuelve al código.
  if (becomesDead && updated?.length) {
    const use = parseReferral(current.referral_used);
    if (use?.kind === "credit") {
      await returnCredit(use.code).catch((err) =>
        console.error("No se pudo devolver el cupón:", err instanceof Error ? err.message : "desconocido")
      );
    }
  }
}

function parseReferral(raw: string | null): ReferralUse | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ReferralUse;
  } catch {
    return null;
  }
}

/** Efectos de un pago confirmado: cada uno falla por su cuenta sin frenar al resto. */
async function onPaid(order: OrderRow): Promise<void> {
  const items = order.items ?? [];
  const safe = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (err) {
      console.error(`${label} falló:`, err instanceof Error ? err.message : "desconocido");
    }
  };
  await safe("Bienvenida del chat", () => ensureWelcome(order.order_id));
  await safe("Stock", () => decrementStock(items.filter((i) => typeof i.id === "number").map((i) => ({ id: i.id as number, qty: i.qty }))));
  // Con código: la compra suma a ese código. Sin código: primera compra,
  // se crea uno nuevo.
  if (order.referral_used) {
    await safe("Cliente frecuente", async () => {
      const use = JSON.parse(order.referral_used as string) as ReferralUse;
      await redeem(order.order_id, use.code);
    });
  } else {
    await safe("Código de cliente", () => ensureCode(order.order_id));
  }
  const summary = items.map((i) => `${i.qty}× ${i.name}`).join(", ");
  await notifyPaidOrder({ orderId: order.order_id, totalUsd: order.total_usd, items });
  await pushShop(`Nuevo pedido · ${order.order_id}`, `${summary} · $${Number(order.total_usd).toFixed(2)}`);
}

/** Estado de un pedido según la base. */
export async function getOrderRow(orderId: string): Promise<OrderRow | null | "unconfigured"> {
  if (!ordersDbConfigured()) return "unconfigured";
  const rows = await db<OrderRow[]>(`orders?order_id=eq.${encodeURIComponent(orderId)}&${SELECT}`);
  return rows[0] ?? null;
}
