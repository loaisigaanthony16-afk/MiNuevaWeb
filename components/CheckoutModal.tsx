"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { AlertCircle, Check, Loader2, Lock, RotateCcw, X } from "lucide-react";
import { useUi } from "@/components/ui-context";
import { useStore } from "@/lib/store";
import { useT } from "@/components/locale-context";
import { formatUSD } from "@/lib/checkout-util";
import {
  CheckoutError,
  fetchOrderStatus,
  initCheckout,
  deliveryMessageFor,
  type InitResponse,
} from "@/lib/checkout-client";
import { confirmPendingOrder, savePendingOrder } from "@/lib/pending-order";
import CardLogos from "@/components/CardLogos";

type Phase = "confirm" | "creating" | "paying" | "verifying" | "paid" | "failed" | "error";

const POLL_MS = 3000;

// Stripe.js se carga una sola vez y solo si hay clave publicable.
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

/**
 * Checkout en un modal con el formulario de Stripe incrustado: la persona
 * pone su tarjeta sin salir del sitio. Tras pagar se consulta el estado
 * del pedido cada 3 s hasta confirmarlo.
 *
 * Cerrar el modal o fallar el pago nunca vacía la bolsa.
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

  // Primero la confirmación de edad: sin ella no se crea el cobro.
  const [phase, setPhase] = useState<Phase>("confirm");
  const [adult, setAdult] = useState(false);
  const [session, setSession] = useState<InitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setPhase("creating");
    setError(null);
    setSession(null);
    try {
      const data = await initCheckout(items);
      // Antes de pagar queda guardado el acceso al chat del pedido y los
      // datos de entrega, que solo salen de este equipo por ese chat.
      if (data.chatToken) {
        savePendingOrder({
          stage: "iniciado",
          ref: data.orderId,
          token: data.chatToken,
          message: deliveryMessageFor(data.orderId, items, delivery, data.totalUsd),
        });
      }
      if (!data.clientSecret && data.url) {
        // Sin formulario incrustado: página segura de Stripe.
        window.location.href = data.url;
        return;
      }
      if (!stripePromise) {
        // El servidor pidió formulario incrustado pero este build no tiene la
        // clave publicable: mejor avisar que dejar el modal en blanco.
        throw new CheckoutError("start");
      }
      setSession(data);
      setPhase("paying");
    } catch (err) {
      const code = err instanceof CheckoutError ? err.message : "start";
      setError(code === "network" ? t("pay.errorNetwork") : code === "start" ? t("pay.errorStart") : code);
      setPhase("error");
    }
  }, [items, delivery, t]);

  // Tras enviar el formulario, se consulta el estado hasta confirmarlo.
  useEffect(() => {
    if (!session || phase !== "verifying") return;
    let alive = true;
    const tick = async () => {
      const status = await fetchOrderStatus(session.orderId, session.sessionId);
      if (!alive) return;
      if (status === "paid") setPhase("paid");
      else if (status === "failed" || status === "expired") setPhase("failed");
    };
    void tick();
    const id = setInterval(tick, POLL_MS);
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
      router.push(`/order-success?order_id=${session.orderId}&session_id=${session.sessionId}`);
    }, 900);
    return () => clearTimeout(timer);
  }, [phase, session, clear, closeDrawer, closeCheckout, router]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const canClose = phase !== "paid" && phase !== "verifying";

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={t("co.title")}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md fade-overlay" onClick={canClose ? closeCheckout : undefined} />

      <div className="modal-pop relative flex h-[94dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[24px] border border-[#262626] bg-[#0A0A0A] shadow-pop sm:h-[min(860px,92dvh)] sm:rounded-[24px]">
        <div className="flex shrink-0 items-center justify-between border-b border-[#262626] px-5 py-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide2 text-gold-300">
              <Lock className="h-3.5 w-3.5" />
              {t("co.kicker")}
            </p>
            <p className="mt-1 truncate font-display text-[17px] font-semibold text-ink-50">
              {formatUSD(session?.totalUsd ?? total)}
              {session && <span className="ml-2 font-mono text-[11px] font-normal text-ink-500">{session.orderId}</span>}
            </p>
          </div>
          {canClose && (
            <button onClick={closeCheckout} aria-label={t("co.close")} className="grid h-10 w-10 place-items-center rounded-full text-ink-400 transition hover:bg-white/5 hover:text-ink-50">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          {session?.clientSecret && stripePromise && (
            <div className="min-h-full p-3 sm:p-4">
              <EmbeddedCheckoutProvider
                key={session.sessionId}
                stripe={stripePromise}
                options={{ clientSecret: session.clientSecret, onComplete: () => setPhase("verifying") }}
              >
                <EmbeddedCheckout className="overflow-hidden rounded-2xl" />
              </EmbeddedCheckoutProvider>
            </div>
          )}

          {phase === "confirm" && (
            <Center>
              <span className="grid h-16 w-16 place-items-center rounded-full border border-gold-400/35 bg-gold-400/[0.06] font-display text-[20px] font-bold text-gold-200">
                21+
              </span>
              <p className="mt-6 text-[17px] font-semibold text-ink-50">{t("co.ageTitle")}</p>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-500">{t("co.ageBody")}</p>

              <label className="mt-7 flex w-full max-w-sm cursor-pointer items-start gap-3 rounded-2xl border border-[#262626] bg-white/[0.02] p-4 text-left transition hover:border-white/20">
                <input
                  type="checkbox"
                  checked={adult}
                  onChange={(e) => setAdult(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#c9a758]"
                />
                <span className="text-[13.5px] leading-relaxed text-ink-200">
                  {t("co.ageCheck")}{" "}
                  <span className="text-ink-400">
                    {t("co.ageAccept")}{" "}
                    <Link href="/terms" target="_blank" className="text-gold-300 underline underline-offset-4">{t("foot.terms")}</Link>
                    {" · "}
                    <Link href="/refunds" target="_blank" className="text-gold-300 underline underline-offset-4">{t("foot.refunds")}</Link>
                  </span>
                </span>
              </label>

              <button onClick={() => void start()} disabled={!adult} className="btn-gold mt-6 w-full max-w-sm disabled:cursor-not-allowed disabled:opacity-40">
                <Lock className="h-4 w-4" />
                {t("co.continue")}
              </button>
            </Center>
          )}

          {phase === "creating" && (
            <Center>
              <Spinner />
              <p className="mt-6 text-[15px] font-semibold text-ink-50">{t("co.creating")}</p>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-500">{t("co.secureNote")}</p>
              <div className="mt-8 w-full max-w-[260px] space-y-2.5" aria-hidden>
                <span className="skeleton block h-11 rounded-xl" />
                <span className="skeleton block h-11 rounded-xl" />
                <span className="skeleton block h-11 w-2/3 rounded-xl" />
              </div>
            </Center>
          )}

          {phase === "verifying" && (
            <Overlay>
              <Spinner />
              <p className="mt-6 text-[16px] font-semibold text-ink-50">{t("co.verifying")}</p>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-500">{t("co.verifyingBody")}</p>
            </Overlay>
          )}

          {phase === "paid" && (
            <Overlay>
              <span className="co-success grid h-20 w-20 place-items-center rounded-full bg-hybrid text-white">
                <Check className="h-10 w-10" strokeWidth={3} />
              </span>
              <p className="mt-6 font-display text-[22px] font-semibold text-ink-50">{t("co.paid")}</p>
              <p className="mt-2 text-[13px] text-ink-500">{t("co.redirecting")}</p>
            </Overlay>
          )}

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
        </div>

        {phase === "paying" && (
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[#262626] px-5 py-3">
            <CardLogos />
            <span className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
              <Lock className="h-3 w-3" />
              {t("co.poweredStripe")}
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
      <Loader2 className="absolute inset-0 m-auto h-16 w-16 animate-spin text-gold-400/80" strokeWidth={1} />
      <Lock className="h-5 w-5 text-gold-300" />
    </span>
  );
}
