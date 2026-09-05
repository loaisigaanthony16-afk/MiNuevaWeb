"use client";

import { useEffect, useState } from "react";
import { Check, PackageCheck, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { useT } from "@/components/locale-context";
import { shippingModeFor } from "@/lib/shipping";
import Wordmark from "@/components/Wordmark";

type Status = "success" | "canceled" | null;

/**
 * Cierre del pedido.
 *
 * Stripe devuelve a `/?success=true` o `/?canceled=true`. Sin esto la
 * persona caía en la portada sin saber si su pago pasó y con la bolsa aún
 * llena. Al confirmar, vaciamos la bolsa y limpiamos la URL.
 */
export default function OrderStatus() {
  const t = useT();
  const { clear } = useStore();
  const { delivery } = useUi();
  const [status, setStatus] = useState<Status>(null);
  const [ref, setRef] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ok = params.get("success") === "true";
    const no = params.get("canceled") === "true";
    if (!ok && !no) return;

    if (ok) {
      // El pago se completó: la bolsa ya no debe seguir llena.
      clear();
      const session = params.get("ref");
      if (session) setRef(session.slice(-8).toUpperCase());
    }
    setStatus(ok ? "success" : "canceled");

    // La URL vuelve a quedar limpia para que recargar no repita el aviso.
    window.history.replaceState({}, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!status) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [status]);

  if (!status) return null;

  const mode = delivery?.region ? shippingModeFor(delivery.region) : null;
  const ok = status === "success";

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-ink-950/95 backdrop-blur-md fade-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ok ? t("order.okTitle") : t("order.noTitle")}
    >
      <div className="modal-pop container-page max-w-lg">
        <div className="surface p-8 text-center sm:p-10">
          <div className="flex justify-center">
            <Wordmark />
          </div>

          <span
            className={`mx-auto mt-8 grid h-14 w-14 place-items-center rounded-full border ${
              ok
                ? "border-hybrid/40 bg-hybrid/10"
                : "border-white/12 bg-white/[0.03]"
            }`}
          >
            {ok ? (
              <Check className="h-6 w-6 text-hybrid" />
            ) : (
              <X className="h-6 w-6 text-ink-300" />
            )}
          </span>

          <h2 className="mt-6 font-display text-[26px] font-medium uppercase leading-tight tracking-tightest text-ink-50">
            {ok ? t("order.okTitle") : t("order.noTitle")}
          </h2>

          <p className="mx-auto mt-4 max-w-sm text-[14.5px] leading-relaxed text-ink-400">
            {ok ? t("order.okBody") : t("order.noBody")}
          </p>

          {ok && ref && (
            <div className="mt-7 rounded-card border border-white/10 bg-white/[0.03] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide3 text-ink-500">
                {t("order.ref")}
              </p>
              <p className="mt-2 font-display text-[24px] font-bold tabular-nums tracking-tight text-gold-gradient">
                {ref}
              </p>
            </div>
          )}

          {ok && (
            <ol className="mt-7 space-y-3 text-left text-[13.5px] leading-relaxed text-ink-400">
              {[
                t("order.step1"),
                mode
                  ? `${t("order.step2")} ${t(mode.nameKey)} · ${t(mode.etaKey)}.`
                  : t("order.step2Generic"),
                t("order.step3"),
              ].map((line, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-display text-[12px] font-bold tabular-nums text-gold-300">
                    0{i + 1}
                  </span>
                  {line}
                </li>
              ))}
            </ol>
          )}

          <button
            onClick={() => setStatus(null)}
            className={`${ok ? "btn-gold" : "btn-primary"} mt-8 w-full`}
          >
            {ok ? (
              <>
                <PackageCheck className="h-4 w-4" />
                {t("order.done")}
              </>
            ) : (
              t("order.retry")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
