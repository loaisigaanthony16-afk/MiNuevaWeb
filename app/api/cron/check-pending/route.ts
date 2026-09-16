import { NextResponse } from "next/server";
import { db, ordersDbConfigured } from "@/lib/supabase-server";
import { stripe, stripeConfigured } from "@/lib/stripe-server";
import { applyPayment } from "@/lib/orders";
import { notifyAlert } from "@/lib/notify-email";

/**
 * Vigilancia del webhook. Revisa los pedidos que llevan más de 30 min en
 * `pending` con sesión de Stripe:
 * - si Stripe dice que se pagó, se corrige el pedido y se avisa por correo
 *   (el webhook falló);
 * - si la sesión venció, se marca `expired`.
 *
 * Lo llama el cron de Vercel (vercel.json) con el CRON_SECRET; también se
 * puede llamar a mano con `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "forbidden" }, { status: 401 });
  }
  if (!ordersDbConfigured() || !stripeConfigured()) return NextResponse.json({ ok: false, reason: "unconfigured" });

  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const rows = await db<{ order_id: string; stripe_session_id: string | null; created_at: string }[]>(
    `orders?status=in.(pending,confirming)&created_at=lt.${encodeURIComponent(cutoff)}&select=order_id,stripe_session_id,created_at&limit=100`
  );
  const fixed: string[] = [];
  const expired: string[] = [];
  for (const r of rows) {
    if (!r.stripe_session_id) continue;
    try {
      const s = await stripe().checkout.sessions.retrieve(r.stripe_session_id);
      if (s.payment_status === "paid") {
        await applyPayment({
          orderId: r.order_id,
          status: "paid",
          stripeSessionId: s.id,
          paymentIntent: typeof s.payment_intent === "string" ? s.payment_intent : null,
          amountTotalCents: s.amount_total,
        });
        fixed.push(r.order_id);
      } else if (s.status === "expired") {
        await applyPayment({ orderId: r.order_id, status: "expired", stripeSessionId: s.id, paymentIntent: null, amountTotalCents: null });
        expired.push(r.order_id);
      }
    } catch (err) {
      console.error("Cron: no se pudo revisar", r.order_id, err instanceof Error ? err.message : "");
    }
  }
  if (fixed.length) {
    await notifyAlert(
      "Webhook de Stripe: pedidos corregidos",
      `Estos pedidos estaban pagados en Stripe pero seguían pendientes en la base (el webhook no llegó): ${fixed.join(", ")}. Ya quedaron como pagados y con el chat abierto. Revisá en Stripe → Developers → Webhooks que el endpoint esté activo.`
    );
  }
  return NextResponse.json({ ok: true, checked: rows.length, fixed, expired });
}
