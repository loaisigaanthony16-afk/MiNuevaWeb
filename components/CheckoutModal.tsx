"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ExternalLink, Loader2, Lock, MessageCircle, RotateCcw, X } from "lucide-react";
import { useUi } from "@/components/ui-context";
import { useStore } from "@/lib/store";
import { useT } from "@/components/locale-context";
import { formatUSD } from "@/lib/checkout-util";
import {
  CheckoutError,
  fetchOrderStatus,
  initCheckout,
  whatsappMessageFor,
  type InitResponse,
} from "@/lib/checkout-client";
import { confirmPendingOrder, savePendingOrder } from "@/lib/pending-order";
import { whatsappLink } from "@/lib/whatsapp";
import CardLogos from "@/components/CardLogos";

type Phase = "creating" | "paying" | "verifying" | "paid" | "failed" | "partial" | "error";

const POLL_MS = 3000;

/**
 * Checkout en un modal: crea la factura, muestra la pasarela dentro del
 * sitio y consulta el estado del pedido cada 3 s hasta confirmar el pago.
 *
 * Cerrar el modal o fallar el pago nunca vacía la bolsa: se puede
 * reintentar al instante.
 */
export default function CheckoutModal() {
  const { checkoutOpen } = useUi();
  if (!checkoutOpen) return null;
  return <Checkout />;
}

function Checkout() {
  const t = useT();
  const router = useRouter();
  const { closeCheckout, closeDrawer, delivery } = useUi();
  const { items, total, clear } = useStore();

  const [phase, setPhase] = useState<Phase>("creating");
  const [session, setSession] = useState<InitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [tabOpened, setTabOpened] = useState(false);
  const started = useRef(false);

  const start = useCallback(async () => {
    setPhase("creating");
    setError(null);
    setFrameLoaded(false);
    setTabOpened(false);
    try {
      const data = await initCheckout(items);
      // Respaldo antes de pagar: si algo se corta, el aviso de WhatsApp
      // ya queda guardado en este dispositivo.
      savePendingOrder(data.orderId, whatsappMessageFor(data.orderId, items, delivery, data.totalUsd), "iniciado");
      setSession(data);
      setPhase("paying");
    } catch (err) {
      const code = err instanceof CheckoutError ? err.message : "start";
      setError(code === "network" ? t("pay.errorNetwork") : code === "start" ? t("pay.errorStart") : code);
      setPhase("error");
    }
  }, [items, delivery, t]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
  }, [start]);

  // Consulta del estado mientras se paga.
  useEffect(() => {
    if (!session?.tracked) return;
    if (phase !== "paying" && phase !== "verifying") return;
    let alive = true;
    const tick = async () => {
      const status = await fetchOrderStatus(session.orderId);
      if (!alive) return;
      if (status === "paid") setPhase("paid");
      else if (status === "confirming") setPhase("verifying");
      else if (status === "failed" || status === "expired" || status === "refunded") setPhase("failed");
      else if (status === "partially_paid") setPhase("partial");
    };
    const id = setInterval(tick, POLL_MS);
    void tick();
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [session, phase]);

  // Pago confirmado: animación y a la página del pedido.
  useEffect(() => {
    if (phase !== "paid" || !session) return;
    confirmPendingOrder(session.orderId);
    const timer = setTimeout(() => {
      clear();
      closeDrawer();
      closeCheckout();
      router.push(`/order-success?order_id=${session.orderId}`);
    }, 900);
    return () => clearTimeout(timer);
  }, [phase, session, clear, closeDrawer, closeCheckout, router]);

  // Sin scroll de fondo.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function openTab() {
    if (!session) return;
    window.open(session.invoiceUrl, "_blank", "noopener,noreferrer");
    setTabOpened(true);
  }

  const busy = phase === "creating";
  const showFrame = session && session.embeddable && (phase === "paying" || phase === "verifying");

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={t("co.title")}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md fade-overlay" onClick={phase === "paid" ? undefined : closeCheckout} />

      <div className="modal-pop relative flex h-[94dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[24px] border border-[#262626] bg-[#0A0A0A] shadow-pop sm:h-[min(820px,92dvh)] sm:rounded-[24px]">
        {/* Cabecera */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#262626] px-5 py-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide2 text-gold-300">
              <Lock className="h-3.5 w-3.5" />
              {t("co.kicker")}
            </p>
            <p className="mt-1 truncate font-display text-[17px] font-semibold text-ink-50">
              {session ? formatUSD(session.totalUsd) : formatUSD(total)}
              {session && <span className="ml-2 font-mono text-[11px] font-normal text-ink-500">{session.orderId}</span>}
            </p>
          </div>
          {phase !== "paid" && (
            <button onClick={closeCheckout} aria-label={t("co.close")} className="grid h-10 w-10 place-items-center rounded-full text-ink-400 transition hover:bg-white/5 hover:text-ink-50">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Cuerpo */}
        <div className="relative min-h-0 flex-1">
          {showFrame && (
            <iframe
              src={session.invoiceUrl}
              title={t("co.title")}
              onLoad={() => setFrameLoaded(true)}
              allow="payment; clipboard-write"
              referrerPolicy="no-referrer"
              className={`h-full w-full bg-[#0A0A0A] transition-opacity duration-500 ${frameLoaded ? "opacity-100" : "opacity-0"}`}
            />
          )}

          {/* Cargando */}
          {(busy || (showFrame && !frameLoaded)) && (
            <Center>
              <Spinner />
              <p className="mt-6 text-[15px] font-semibold text-ink-50">{busy ? t("co.creating") : t("co.loadingGateway")}</p>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-500">{t("co.secureNote")}</p>
              <div className="mt-8 w-full max-w-[260px] space-y-2.5" aria-hidden>
                <span className="skeleton block h-11 rounded-xl" />
                <span className="skeleton block h-11 rounded-xl" />
                <span className="skeleton block h-11 w-2/3 rounded-xl" />
              </div>
            </Center>
          )}

          {/* Pasarela en pestaña aparte */}
          {session && !session.embeddable && (phase === "paying" || phase === "verifying") && (
            <Center>
              <span className="grid h-16 w-16 place-items-center rounded-full border border-[#262626] bg-white/[0.03]">
                <ExternalLink className="h-6 w-6 text-gold-300" />
              </span>
              <p className="mt-6 text-[16px] font-semibold text-ink-50">{tabOpened ? t("co.waitingTab") : t("co.openTabTitle")}</p>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-500">{t("co.openTabBody")}</p>
              <button onClick={openTab} className="btn-gold mt-7">
                <ExternalLink className="h-4 w-4" />
                {tabOpened ? t("co.reopenTab") : t("co.openTab")}
              </button>
              {tabOpened && session.tracked && (
                <p className="mt-6 flex items-center gap-2 text-[12.5px] text-ink-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("co.watching")}
                </p>
              )}
            </Center>
          )}

          {/* Confirmando */}
          {phase === "verifying" && (
            <Overlay>
              <Spinner />
              <p className="mt-6 text-[16px] font-semibold text-ink-50">{t("co.verifying")}</p>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-500">{t("co.verifyingBody")}</p>
            </Overlay>
          )}

          {/* Pagado */}
          {phase === "paid" && (
            <Overlay>
              <span className="co-success grid h-20 w-20 place-items-center rounded-full bg-hybrid text-white">
                <Check className="h-10 w-10" strokeWidth={3} />
              </span>
              <p className="mt-6 font-display text-[22px] font-semibold text-ink-50">{t("co.paid")}</p>
              <p className="mt-2 text-[13px] text-ink-500">{t("co.redirecting")}</p>
            </Overlay>
          )}

          {/* Falló o expiró */}
          {(phase === "failed" || phase === "error") && (
            <Overlay>
              <span className="grid h-16 w-16 place-items-center rounded-full border border-red-500/40 bg-red-500/10">
                <AlertCircle className="h-7 w-7 text-red-400" />
              </span>
              <p className="mt-6 text-[16px] font-semibold text-ink-50">{phase === "failed" ? t("co.failed") : t("co.errorTitle")}</p>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-500">{error ?? t("co.failedBody")}</p>
              <div className="mt-7 flex w-full max-w-[280px] flex-col gap-2.5">
                <button onClick={() => void start()} className="btn-gold w-full">
                  <RotateCcw className="h-4 w-4" />
                  {t("co.retry")}
                </button>
                <button onClick={closeCheckout} className="btn-ghost w-full">{t("co.backToBag")}</button>
              </div>
              <p className="mt-5 text-[12px] text-ink-600">{t("co.cartKept")}</p>
            </Overlay>
          )}

          {/* Pago incompleto */}
          {phase === "partial" && session && (
            <Overlay>
              <span className="grid h-16 w-16 place-items-center rounded-full border border-gold-400/40 bg-gold-400/10">
                <AlertCircle className="h-7 w-7 text-gold-300" />
              </span>
              <p className="mt-6 text-[16px] font-semibold text-ink-50">{t("co.partial")}</p>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-500">{t("co.partialBody")}</p>
              <a
                href={whatsappLink(`Hola, mi pago del pedido ${session.orderId} quedó incompleto.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn mt-7 bg-[#25D366] text-ink-900 hover:bg-[#1fbe5a]"
              >
                <MessageCircle className="h-4 w-4" />
                {t("co.contact")}
              </a>
            </Overlay>
          )}
        </div>

        {/* Pie */}
        {session && (phase === "paying" || phase === "verifying") && (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#262626] px-5 py-3">
            <CardLogos />
            <span className="flex items-center gap-3">
              {session.tracked ? (
                <span className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
                  <span className="co-live h-1.5 w-1.5 rounded-full bg-hybrid" />
                  {t("co.live")}
                </span>
              ) : null}
              {session.embeddable && (
                <button onClick={openTab} className="flex items-center gap-1 text-[11.5px] text-ink-400 underline-offset-4 hover:text-ink-100 hover:underline">
                  {t("co.newTab")}
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0A] px-8 text-center">{children}</div>;
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fade-overlay absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0A0A0A]/95 px-8 text-center backdrop-blur-sm">
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span className="relative grid h-16 w-16 place-items-center">
      <span className="absolute inset-0 rounded-full border-2 border-[#262626]" />
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-gold-400" />
      <Lock className="h-5 w-5 text-gold-300" />
    </span>
  );
}
