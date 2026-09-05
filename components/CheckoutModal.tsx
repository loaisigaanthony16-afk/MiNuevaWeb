"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { useT } from "@/components/locale-context";
import { formatNIO, formatUSD } from "@/lib/checkout-util";
import { isDeliveryComplete } from "@/lib/delivery";

/**
 * Checkout con Stripe Elements, dentro del sitio.
 *
 * La clave publicable es pública por diseño (va en el navegador), por eso
 * lleva el prefijo NEXT_PUBLIC_. La clave secreta jamás toca el cliente.
 */
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;

// Se carga una sola vez por sesión, no en cada render.
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!publishableKey) return null;
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

interface Quote {
  clientSecret: string;
  pedidoId: string;
  subtotalUsd: number;
  shippingUsd: number;
  totalUsd: number;
}

export default function CheckoutModal() {
  const t = useT();
  const { checkoutOpen, closeCheckout, delivery } = useUi();
  const { items } = useStore();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ready = isDeliveryComplete(delivery);

  // Al abrir, el servidor cotiza el pedido y devuelve el clientSecret.
  useEffect(() => {
    if (!checkoutOpen || !ready || !delivery || items.length === 0) return;
    let cancelled = false;

    setQuote(null);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Solo id y cantidad: el precio lo pone el servidor.
            items: items.map((it) => ({ id: it.id, qty: it.qty })),
            delivery,
          }),
        });
        const data = (await res.json()) as Partial<Quote> & { error?: string };
        if (cancelled) return;
        if (!res.ok || !data.clientSecret) {
          setError(data.error ?? t("pay.errorStart"));
          return;
        }
        setQuote(data as Quote);
      } catch {
        if (!cancelled) setError(t("pay.errorNetwork"));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [checkoutOpen, ready, delivery, items, t]);

  useEffect(() => {
    if (!checkoutOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [checkoutOpen]);

  const options = useMemo(
    () =>
      quote
        ? {
            clientSecret: quote.clientSecret,
            appearance: {
              theme: "night" as const,
              variables: {
                colorPrimary: "#c9a758",
                colorBackground: "#0e0e10",
                colorText: "#e6e6ea",
                colorDanger: "#f87171",
                borderRadius: "10px",
                fontFamily: "system-ui, sans-serif",
              },
            },
          }
        : undefined,
    [quote]
  );

  if (!checkoutOpen) return null;

  const stripe = getStripe();

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 backdrop-blur-sm fade-overlay sm:items-center sm:p-6"
      onClick={closeCheckout}
      role="dialog"
      aria-modal="true"
      aria-label={t("pay.title")}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-pop flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-xl2 border border-white/10 bg-ink-850 shadow-pop sm:rounded-xl2"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/8 p-6">
          <div>
            <p className="kicker">{t("pay.kicker")}</p>
            <h2 className="mt-3 font-display text-[22px] font-bold uppercase leading-tight tracking-tightest text-ink-50">
              {t("pay.title")}
            </h2>
          </div>
          <button
            onClick={closeCheckout}
            aria-label={t("pay.close")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-ink-400 transition hover:bg-white/5 hover:text-ink-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!publishableKey ? (
            <Notice>{t("pay.notConfigured")}</Notice>
          ) : !ready ? (
            <Notice>{t("cart.needAddress")}</Notice>
          ) : error ? (
            <Notice tone="error">{error}</Notice>
          ) : !quote || !stripe ? (
            <div className="flex items-center justify-center gap-3 py-14 text-ink-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-[13.5px]">{t("pay.preparing")}</span>
            </div>
          ) : (
            <>
              {/* El desglose que muestra el servidor, no el navegador. */}
              <dl className="mb-6 space-y-2 rounded-[10px] border border-white/8 bg-white/[0.02] p-4 text-[13px]">
                <Row label={t("cart.subtotal")} value={formatUSD(quote.subtotalUsd)} />
                <Row
                  label={t("cart.shipping")}
                  value={
                    quote.shippingUsd === 0
                      ? t("cart.freeWord")
                      : formatNIO(quote.shippingUsd)
                  }
                />
                <div className="flex items-baseline justify-between border-t border-white/8 pt-2">
                  <dt className="font-display text-[12px] font-bold uppercase tracking-wide2 text-ink-50">
                    {t("cart.total")}
                  </dt>
                  <dd className="font-display text-[18px] font-bold tabular-nums text-ink-50">
                    {formatUSD(quote.totalUsd)}
                  </dd>
                </div>
              </dl>

              <Elements stripe={stripe} options={options}>
                <PaymentForm total={quote.totalUsd} pedidoId={quote.pedidoId} />
              </Elements>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentForm({
  total,
  pedidoId,
}: {
  total: number;
  pedidoId: string;
}) {
  const t = useT();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements || submitting) return;

      setSubmitting(true);
      setMessage(null);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/?success=true&ref=${pedidoId}`,
        },
      });

      // Solo se llega acá si algo falló: si sale bien, Stripe redirige.
      if (error) {
        setMessage(error.message ?? t("pay.errorCard"));
      }
      setSubmitting(false);
    },
    [stripe, elements, submitting, pedidoId, t]
  );

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: "tabs" }} />

      {message && (
        <p className="mt-4 rounded-[10px] border border-red-500/30 bg-red-500/10 p-3 text-[12.5px] leading-relaxed text-red-300">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="btn-primary mt-6 w-full disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        {submitting ? t("pay.processing") : `${t("pay.pay")} ${formatUSD(total)}`}
      </button>

      <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-500">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-300" />
        {t("pay.secure")}
      </p>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-400">{label}</dt>
      <dd className="tabular-nums text-ink-100">{value}</dd>
    </div>
  );
}

function Notice({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "error";
}) {
  return (
    <p
      className={`rounded-[10px] border p-4 text-[13px] leading-relaxed ${
        tone === "error"
          ? "border-red-500/30 bg-red-500/10 text-red-300"
          : "border-white/10 bg-white/[0.02] text-ink-300"
      }`}
    >
      {children}
    </p>
  );
}
