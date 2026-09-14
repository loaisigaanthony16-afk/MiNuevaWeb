"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, Copy, Loader2, Lock, MessageCircle, PackageCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { useT } from "@/components/locale-context";
import Wordmark from "@/components/Wordmark";
import { whatsappLink } from "@/lib/whatsapp";
import { clearPendingOrder, confirmPendingOrder, loadPendingOrder } from "@/lib/pending-order";
import { fetchOrderStatus, whatsappMessageFor, type OrderStatusValue } from "@/lib/checkout-client";

const POLL_MS = 3000;

type View = "loading" | "verifying" | "paid" | "failed" | "missing";

/**
 * Página de confirmación del pedido (/order-success?order_id=…).
 *
 * Solo muestra "pago confirmado" cuando la base lo dice. Si todavía no
 * está confirmado, espera consultando cada 3 s. Si el servidor no tiene
 * base de datos configurada, confía en el retorno de la pasarela, como
 * antes.
 *
 * El paso de WhatsApp es obligatorio: la dirección vive solo en este
 * dispositivo y es la única vía por la que el comercio la recibe.
 */
export default function OrderConfirmation() {
  const t = useT();
  const { items, clear, hydrated } = useStore();
  const { delivery, deliveryLoaded } = useUi();

  const [orderId, setOrderId] = useState<string | null>(null);
  const [view, setView] = useState<View>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const settled = useRef(false);

  // La pasarela puede volver dentro del iframe del modal: se sale al sitio.
  useEffect(() => {
    if (window.top && window.top !== window.self) {
      try {
        window.top.location.href = window.location.href;
      } catch {
        /* distinto origen: se sigue acá */
      }
    }
    const id = new URLSearchParams(window.location.search).get("order_id");
    setOrderId(id && /^VIBE-[A-Z0-9]{4,20}$/.test(id) ? id : null);
    if (!id) setView("missing");
  }, []);

  // Estado del pedido.
  useEffect(() => {
    if (!orderId) return;
    let alive = true;
    const tick = async () => {
      const status: OrderStatusValue = await fetchOrderStatus(orderId);
      if (!alive) return;
      if (status === "paid" || status === "unknown") setView("paid");
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
  }, [orderId]);

  // Pagado: se arma el mensaje y se vacía la bolsa (una sola vez).
  useEffect(() => {
    if (view !== "paid" || !orderId || settled.current) return;
    if (!hydrated || !deliveryLoaded) return;
    settled.current = true;

    // Si el modal ya vació la bolsa, el mensaje guardado al pagar manda.
    const saved = loadPendingOrder();
    const msg =
      saved && saved.ref === orderId
        ? saved.message
        : whatsappMessageFor(orderId, items, delivery, items.reduce((a, it) => a + it.price * it.qty, 0));
    setMessage(msg);
    confirmPendingOrder(orderId, msg);
    clear();
  }, [view, orderId, hydrated, deliveryLoaded, items, delivery, clear]);

  function markSent() {
    clearPendingOrder();
    setSent(true);
  }

  function copy() {
    if (!message) return;
    void navigator.clipboard?.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="container-page grid min-h-[70vh] place-items-center py-14">
      <div className="modal-pop w-full max-w-lg rounded-[24px] border border-[#262626] bg-[#0A0A0A] p-8 text-center sm:p-10">
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
            <span className="co-success mx-auto mt-10 grid h-16 w-16 place-items-center rounded-full bg-hybrid text-white">
              <Check className="h-8 w-8" strokeWidth={3} />
            </span>
            <h1 className="mt-6 font-display text-[26px] font-semibold uppercase tracking-tightest text-ink-50">{t("order.okTitle")}</h1>
            <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-ink-400">{t("order.okBody")}</p>

            {orderId && (
              <div className="mt-7 rounded-2xl border border-[#262626] bg-white/[0.02] px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide3 text-ink-500">{t("order.ref")}</p>
                <p className="mt-2 font-display text-[22px] font-bold tracking-tight text-gold-gradient">{orderId}</p>
              </div>
            )}

            {message && (
              <div className="mt-6">
                <p className="mb-3 rounded-xl border border-gold-400/35 bg-gold-400/[0.06] px-4 py-3 text-[12.5px] font-semibold leading-relaxed text-gold-100">
                  {t("order.required")}
                </p>
                <a
                  href={whatsappLink(message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={markSent}
                  className="btn w-full bg-[#25D366] text-ink-900 hover:bg-[#1fbe5a]"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("order.whatsapp")}
                </a>
                <p className="mt-3 flex items-start gap-2 text-left text-[12px] leading-relaxed text-ink-500">
                  <Lock className="mt-0.5 h-3 w-3 shrink-0 text-hybrid" />
                  {t("order.whatsappBody")}
                </p>
                <button onClick={copy} className="btn-ghost mt-3 w-full">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? t("order.copied") : t("order.copy")}
                </button>
              </div>
            )}

            <ol className="mt-7 space-y-3 text-left text-[13.5px] leading-relaxed text-ink-400">
              {[t("order.step1"), t("order.step2"), t("order.step3")].map((line, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-display text-[12px] font-bold tabular-nums text-gold-300">0{i + 1}</span>
                  {line}
                </li>
              ))}
            </ol>

            {sent ? (
              <>
                <Link href="/" className="btn-gold mt-8 w-full">
                  <PackageCheck className="h-4 w-4" />
                  {t("order.done")}
                </Link>
                <p className="mt-4 flex items-center justify-center gap-2 text-[12.5px] text-hybrid">
                  <Check className="h-3.5 w-3.5" />
                  {t("order.sent")}
                </p>
              </>
            ) : (
              <p className="mt-6 text-[11.5px] leading-relaxed text-ink-600">{t("order.keepOpen")}</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
