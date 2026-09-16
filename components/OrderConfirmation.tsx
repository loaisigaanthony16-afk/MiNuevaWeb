"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { useT } from "@/components/locale-context";
import Wordmark from "@/components/Wordmark";
import { confirmPendingOrder, loadPendingOrder } from "@/lib/pending-order";
import OrderChat from "@/components/OrderChat";
import { fetchOrderStatus, deliveryMessageFor, type OrderStatusValue } from "@/lib/checkout-client";
import { deliveryFor } from "@/lib/checkout-util";

const POLL_MS = 3000;

type View = "loading" | "verifying" | "paid" | "failed" | "missing";

/**
 * Página de confirmación del pedido (/order-success?order_id=…).
 *
 * Solo muestra "pago confirmado" cuando la base lo dice. Si todavía no
 * está confirmado, espera consultando cada 3 s (la ruta de estado revisa
 * Supabase y, si hace falta, la sesión en Stripe).
 *
 * Con el pago confirmado se abre el chat del pedido en la misma página y
 * los datos de entrega (que viven solo en este dispositivo) se mandan por
 * ahí, cifrados.
 */
export default function OrderConfirmation() {
  const t = useT();
  const { items, clear, hydrated } = useStore();
  const { delivery, deliveryLoaded } = useUi();

  const [orderId, setOrderId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [view, setView] = useState<View>("loading");
  const [chat, setChat] = useState<{ token: string; message: string } | null>(null);
  const settled = useRef(false);

  // Si por algún motivo la página carga dentro de un iframe, se sale al sitio.
  useEffect(() => {
    if (window.top && window.top !== window.self) {
      try {
        window.top.location.href = window.location.href;
      } catch {
        /* distinto origen: se sigue acá */
      }
    }
    const params = new URLSearchParams(window.location.search);
    const id = params.get("order_id");
    setSessionId(params.get("session_id"));
    setOrderId(id && /^VIBE-[A-Z0-9]{4,20}$/.test(id) ? id : null);
    if (!id) setView("missing");
  }, []);

  // Estado del pedido.
  useEffect(() => {
    if (!orderId) return;
    let alive = true;
    let unknown = 0;
    const tick = async () => {
      const status: OrderStatusValue = await fetchOrderStatus(orderId, sessionId);
      if (!alive) return;
      // Sin base ni sesión de Stripe no hay forma de verificar el pago.
      if (status === "unknown" && ++unknown >= 3) {
        setView("missing");
        return;
      }
      if (status === "paid") setView("paid");
      else if (status === "failed" || status === "expired" || status === "refunded") setView("failed");
      else if (status === "not_found") setView("missing");
      else setView("verifying");
    };
    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [orderId, sessionId]);

  // Pagado: se arma el mensaje y se vacía la bolsa (una sola vez).
  useEffect(() => {
    if (view !== "paid" || !orderId || settled.current) return;
    if (!hydrated || !deliveryLoaded) return;
    settled.current = true;

    // El token del chat se guardó al pagar; el mensaje de entrega también.
    const saved = loadPendingOrder();
    if (saved && saved.ref === orderId) {
      const subtotal = items.reduce((a, it) => a + it.price * it.qty, 0);
      const msg = saved.message || deliveryMessageFor(orderId, items, delivery, subtotal + deliveryFor(subtotal));
      setChat({ token: saved.token, message: msg });
      confirmPendingOrder(orderId);
    }
    clear();
  }, [view, orderId, hydrated, deliveryLoaded, items, delivery, clear]);

  return (
    <section className="container-page grid min-h-[70vh] place-items-center py-8 sm:py-14">
      <div className="modal-pop w-full max-w-lg text-center sm:rounded-[24px] sm:border sm:border-[#262626] sm:bg-[#0A0A0A] sm:p-10">
        <div className="flex justify-center">
          <Wordmark />
        </div>

        {(view === "loading" || view === "verifying") && (
          <>
            <span className="mx-auto mt-10 grid h-16 w-16 place-items-center rounded-full border-2 border-[#262626]">
              <Loader2 className="h-7 w-7 animate-spin text-gold-300" />
            </span>
            <h1 className="mt-6 font-display text-[24px] font-semibold uppercase tracking-tightest text-ink-50">
              {t("co.verifying")}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink-400">{t("co.verifyingBody")}</p>
            {orderId && <p className="mt-6 font-mono text-[12px] text-ink-500">{orderId}</p>}
          </>
        )}

        {view === "failed" && (
          <>
            <span className="mx-auto mt-10 grid h-16 w-16 place-items-center rounded-full border border-red-500/40 bg-red-500/10">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </span>
            <h1 className="mt-6 font-display text-[24px] font-semibold uppercase tracking-tightest text-ink-50">{t("co.failed")}</h1>
            <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink-400">{t("co.failedBody")}</p>
            <Link href="/" className="btn-gold mt-8 w-full">{t("co.backToBag")}</Link>
            <p className="mt-4 text-[12px] text-ink-600">{t("co.cartKept")}</p>
          </>
        )}

        {view === "missing" && (
          <>
            <h1 className="mt-10 font-display text-[22px] font-semibold uppercase tracking-tightest text-ink-50">{t("co.missing")}</h1>
            <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink-400">{t("co.missingBody")}</p>
            <Link href="/" className="btn-primary mt-8 w-full">{t("order.retry")}</Link>
          </>
        )}

        {view === "paid" && (
          <>
            <div className="mt-8 flex items-center justify-center gap-2.5">
              <span className="check-ring grid h-7 w-7 place-items-center rounded-full bg-hybrid text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path className="check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              <h1 className="rise font-display text-[13px] font-bold uppercase tracking-[0.16em] text-ink-50" style={{ "--i": 1 } as React.CSSProperties}>
                {t("order.okTitle")}
              </h1>
            </div>
            {orderId && (
              <div className="rise mt-4" style={{ "--i": 2 } as React.CSSProperties}>
                <p className="font-display text-[30px] font-bold tracking-tight text-gold-gradient">{orderId}</p>
                <span className="ref-line mx-auto mt-2 block w-24" />
              </div>
            )}
            <p className="rise mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink-400" style={{ "--i": 3 } as React.CSSProperties}>
              {t("order.okBody")}
            </p>

            {chat ? (
              <div className="chat-card mt-7" style={{ "--i": 4 } as React.CSSProperties}>
                <OrderChat orderId={orderId!} token={chat.token} firstMessage={chat.message} />
              </div>
            ) : (
              <p className="rise mt-7 rounded-2xl border border-[#262626] px-5 py-4 text-[13px] leading-relaxed text-ink-400" style={{ "--i": 4 } as React.CSSProperties}>
                {t("chat.noToken")}
              </p>
            )}

            <p className="rise mx-auto mt-5 max-w-sm text-[12.5px] leading-relaxed text-ink-500" style={{ "--i": 6 } as React.CSSProperties}>
              {t("order.chatHint")}
            </p>

            <Link href="/" className="btn-ghost rise mt-6 w-full" style={{ "--i": 7 } as React.CSSProperties}>
              {t("order.done")}
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
