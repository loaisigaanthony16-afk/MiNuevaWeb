"use client";

import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { getBrand, STRAIN_EFFECT, STRAIN_LABEL } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { formatNIO } from "@/lib/checkout-util";
import { useT } from "@/components/locale-context";
import PriceTag from "@/components/PriceTag";

const STRAIN_BG: Record<string, string> = {
  sativa: "bg-sativa text-ink-900",
  indica: "bg-indica text-white",
  hybrid: "bg-hybrid text-white",
};

export default function QuickView() {
  const t = useT();
  const { quickProduct: p, closeQuick } = useUi();
  const { add } = useStore();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setAdded(false);
  }, [p?.id]);

  if (!p) return null;
  const brand = getBrand(p.brand);

  function handleAdd() {
    if (!p) return;
    add(p.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center bg-black/75 backdrop-blur-sm fade-overlay sm:items-center sm:p-6"
      onClick={closeQuick}
      role="dialog"
      aria-modal="true"
      aria-label={p.name}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-pop relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-xl2 border border-white/10 bg-ink-850 shadow-pop sm:rounded-xl2"
      >
        <button
          onClick={closeQuick}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-ink-900/70 text-ink-300 backdrop-blur transition hover:text-ink-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid flex-1 grid-cols-1 overflow-y-auto sm:grid-cols-2">
          {/* Foto */}
          <div className="grid place-items-center bg-ink-950 p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.img}
              alt={p.name}
              className="aspect-square w-full max-w-[360px] object-contain"
            />
          </div>

          {/* Detalle */}
          <div className="flex flex-col p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-wide2 text-gold-300">
              {brand.name} · {brand.kicker}
            </p>

            <h2 className="mt-3 font-display text-[30px] font-bold uppercase leading-[0.95] tracking-tightest text-ink-50">
              {p.name}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`tag ${STRAIN_BG[p.strain]}`}>{STRAIN_LABEL[p.strain]}</span>
              <span className="text-[13px] text-ink-400">{STRAIN_EFFECT[p.strain]}</span>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-white/8 bg-white/8">
              {[
                [t("quick.flavor"), p.flavor],
                [t("quick.weight"), p.weight],
              ].map(([k, v]) => (
                <div key={k} className="bg-ink-850 px-4 py-3.5">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide2 text-ink-500">{k}</dt>
                  <dd className="mt-1 text-[14px] font-semibold text-ink-50">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 text-[13.5px] leading-relaxed text-ink-400">{brand.description}</p>

            {/* Precio y CTA */}
            <div className="mt-auto border-t border-white/8 pt-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <PriceTag price={p.price} listPrice={p.listPrice} size="lg" />
                  <p className="mt-2 text-[12px] tabular-nums text-ink-500">
                    {formatNIO(p.price)} · {t("quick.delivery")}
                  </p>
                </div>
                <button
                  onClick={handleAdd}
                  className={`btn w-full sm:w-auto ${added ? "bg-hybrid text-white" : "btn-gold"}`}
                >
                  {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {added ? t("quick.added") : t("cat.add")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
