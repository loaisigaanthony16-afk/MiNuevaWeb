"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useT } from "@/components/locale-context";
import Wordmark from "@/components/Wordmark";

/**
 * Retornos de la pasarela a la portada.
 *
 * - `/?canceled=true`: aviso de pago cancelado; la bolsa sigue intacta.
 * - `/?success=true&ref=…` (facturas creadas antes de /order-success):
 *   se redirige a la página de confirmación, que verifica el pago.
 */
export default function OrderStatus() {
  const t = useT();
  const [canceled, setCanceled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      const ref = params.get("ref") ?? "";
      window.location.replace(`/order-success?order_id=${encodeURIComponent(ref)}`);
      return;
    }
    if (params.get("canceled") !== "true") return;
    // Si volvió dentro del iframe del modal, el aviso se muestra afuera.
    if (window.top && window.top !== window.self) {
      try {
        window.top.location.href = window.location.href;
        return;
      } catch {
        /* se sigue acá */
      }
    }
    setCanceled(true);
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  if (!canceled) return null;

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/80 px-5 backdrop-blur-md fade-overlay" role="dialog" aria-modal="true" aria-label={t("order.noTitle")}>
      <div className="modal-pop w-full max-w-md rounded-[24px] border border-[#262626] bg-[#0A0A0A] p-8 text-center">
        <div className="flex justify-center">
          <Wordmark />
        </div>
        <span className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-full border border-white/12 bg-white/[0.03]">
          <X className="h-6 w-6 text-ink-300" />
        </span>
        <h2 className="mt-6 font-display text-[24px] font-semibold uppercase tracking-tightest text-ink-50">{t("order.noTitle")}</h2>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink-400">{t("order.noBody")}</p>
        <button onClick={() => setCanceled(false)} className="btn-primary mt-8 w-full">
          {t("order.retry")}
        </button>
      </div>
    </div>
  );
}
