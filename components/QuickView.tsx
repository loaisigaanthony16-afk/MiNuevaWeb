"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Plus, X } from "lucide-react";
import { haptic } from "@/lib/haptic";
import { getBrand, STRAIN_EFFECT, STRAIN_LABEL } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { formatNIO } from "@/lib/checkout-util";
import { useT } from "@/components/locale-context";
import PriceTag from "@/components/PriceTag";
import { flyToCart } from "@/lib/fly";
import { isSoldOut, useShopInfo } from "@/hooks/useShopInfo";

const STRAIN_BG: Record<string, string> = {
  sativa: "bg-sativa text-ink-900",
  indica: "bg-indica text-white",
  hybrid: "bg-hybrid text-white",
};

export default function QuickView() {
  const t = useT();
  const { quickProduct: p, closeQuick, openDrawer } = useUi();
  const { add } = useStore();
  const [added, setAdded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const info = useShopInfo();

  useEffect(() => {
    setAdded(false);
  }, [p?.id]);

  if (!p) return null;
  const brand = getBrand(p.brand);
  const soldOut = isSoldOut(info, p.id);
  const week = info.week[p.id] ?? 0;

  function handleAdd() {
    if (!p) return;
    add(p.id);
    haptic();
    flyToCart(imgRef.current);
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
              ref={imgRef}
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
              ].map(([k, v]) => (
                <div key={k} className="bg-ink-850 px-4 py-3.5">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide2 text-ink-500">{k}</dt>
                  <dd className="mt-1 text-[14px] font-semibold text-ink-50">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 text-[13.5px] leading-relaxed text-ink-400">{brand.description}</p>
            <Link href={`/p/${p.slug}`} onClick={closeQuick} className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-wide2 text-gold-300 hover:text-gold-200">
              {t("cat.viewFull")} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            {week > 0 && (
              <p className="mt-3 flex items-center gap-2 text-[12.5px] text-gold-300">
                <span className="co-live h-1.5 w-1.5 rounded-full bg-gold-400" />
                {week} {t("cat.week")} · Estelí
              </p>
            )}

            {/* Precio y CTA */}
            <div className="mt-auto border-t border-white/8 pt-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <PriceTag price={p.price} listPrice={p.listPrice} size="lg" />
                  <p className="mt-2 text-[12px] tabular-nums text-ink-500">
                    {formatNIO(p.price)} · {t("quick.delivery")}
                  </p>
                </div>
                {soldOut ? (
                  <span className="btn w-full cursor-not-allowed border border-white/10 text-ink-500 sm:w-auto">{t("cat.soldOut")}</span>
                ) : (
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <button
                      onClick={handleAdd}
                      className={`btn w-full sm:w-auto ${added ? "bg-hybrid text-white" : "btn-ghost"}`}
                    >
                      {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {added ? t("quick.added") : t("cat.add")}
                    </button>
                    <button
                      onClick={() => {
                        if (!p) return;
                        add(p.id);
                        closeQuick();
                        openDrawer();
                      }}
                      className="btn-gold w-full sm:w-auto"
                    >
                      {t("cat.buyNow")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
