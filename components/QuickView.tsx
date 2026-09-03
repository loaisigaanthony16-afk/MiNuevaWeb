"use client";

import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { getLine, STRAIN_LABEL, getFormat } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { formatNIO, formatUSD, DELIVERY_ETA } from "@/lib/checkout-util";

const STRAIN_BG: Record<string, string> = {
  sativa: "bg-sativa text-ink-900",
  indica: "bg-indica text-white",
  hybrid: "bg-hybrid text-white",
};

const LINE_BG: Record<string, string> = {
  melted: "bg-melted text-ink-900",
  live: "bg-live text-ink-900",
  rosin: "bg-rosin text-ink-900",
  distillate: "bg-distillate text-ink-900",
};

export default function QuickView() {
  const { quickProduct: p, closeQuick } = useUi();
  const { add } = useStore();
  const [shot, setShot] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setShot(0);
    setAdded(false);
  }, [p?.id]);

  if (!p) return null;

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
        className="modal-pop relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-xl2 border border-white/10 bg-ink-850 shadow-pop sm:rounded-xl2"
      >
        <button
          onClick={closeQuick}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-ink-900/70 text-ink-300 backdrop-blur transition hover:text-ink-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid flex-1 grid-cols-1 overflow-y-auto sm:grid-cols-2">
          {/* Galería */}
          <div className="bg-ink-950 p-5">
            <div className="overflow-hidden rounded-card border border-white/8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imgs[shot] ?? p.img}
                alt={p.name}
                className="aspect-square w-full object-cover"
              />
            </div>
            {p.imgs.length > 1 && (
              <div className="mt-3 flex gap-2">
                {p.imgs.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setShot(i)}
                    aria-label={`Vista ${i + 1}`}
                    className={`h-14 w-14 overflow-hidden rounded-[9px] border-2 transition ${
                      shot === i ? "border-gold-400" : "border-white/8"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detalle */}
          <div className="flex flex-col p-6 sm:p-7">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`tag ${LINE_BG[p.line]}`}>{getLine(p.line).name}</span>
              <span className={`tag ${STRAIN_BG[p.strain]}`}>
                {STRAIN_LABEL[p.strain]}
              </span>
            </div>

            <h2 className="mt-4 font-display text-[30px] font-bold uppercase leading-[0.95] tracking-tightest text-ink-50">
              {p.name}
            </h2>

            <p className="mt-3 text-[15px] leading-relaxed text-ink-300">
              {p.effect}. Perfil de sabor: {p.flavor.toLowerCase()}.
            </p>

            {/* Ficha */}
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-white/8 bg-white/8">
              {[
                ["THC", `${p.thc}%`],
                ["Formato", getFormat(p.format).name],
                ["Línea", getLine(p.line).name],
                ["Cepa", STRAIN_LABEL[p.strain]],
              ].map(([k, v]) => (
                <div key={k} className="bg-ink-850 px-4 py-3.5">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide2 text-ink-500">
                    {k}
                  </dt>
                  <dd className="mt-1 text-[14px] font-semibold text-ink-50">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 text-[13px] leading-relaxed text-ink-400">
              {getLine(p.line).description}
            </p>

            {/* Precio y CTA */}
            <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/8 pt-5">
              <div>
                <p className="font-display text-[28px] font-bold leading-none tabular-nums text-ink-50">
                  {formatUSD(p.price)}
                </p>
                <p className="mt-1.5 text-[12px] tabular-nums text-ink-500">
                  {formatNIO(p.price)} · envío {DELIVERY_ETA}
                </p>
              </div>
              <button
                onClick={handleAdd}
                className={`btn ${added ? "bg-hybrid text-white" : "btn-gold"}`}
              >
                {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {added ? "Añadido" : "Añadir"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
