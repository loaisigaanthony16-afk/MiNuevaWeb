"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, BellRing, Check, Plus, ShoppingBag } from "lucide-react";
import { getBrand, products, STRAIN_EFFECT, STRAIN_LABEL, PACK_TIERS, type Product } from "@/lib/data";
import { REELS } from "@/lib/reels";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { useT } from "@/components/locale-context";
import { formatNIO } from "@/lib/checkout-util";
import { isSoldOut, useShopInfo } from "@/hooks/useShopInfo";
import { enableRestockPush, pushSupported } from "@/lib/push-client";
import { haptic } from "@/lib/haptic";
import { flyToCart } from "@/lib/fly";
import PriceTag from "@/components/PriceTag";
import ProductCard from "@/components/ProductCard";

const STRAIN_BG: Record<string, string> = {
  sativa: "bg-sativa text-ink-900",
  indica: "bg-indica text-white",
  hybrid: "bg-hybrid text-white",
};

/** Ficha completa de un sabor: foto, reel, precio, packs y compra a un toque. */
export default function ProductPage({ product: p }: { product: Product }) {
  const t = useT();
  const { add } = useStore();
  const { openDrawer } = useUi();
  const info = useShopInfo();
  const [added, setAdded] = useState(false);
  const [notify, setNotify] = useState<"idle" | "on" | "fail">("idle");
  const imgRef = useRef<HTMLImageElement>(null);
  const brand = getBrand(p.brand);
  const reel = REELS.find((r) => r.productId === p.id);
  const soldOut = isSoldOut(info, p.id);
  const left = info.stock[p.id];
  const week = info.week[p.id] ?? 0;
  const related = products.filter((x) => x.id !== p.id && (x.strain === p.strain || x.brand === p.brand)).slice(0, 4);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [p.id]);

  function handleAdd() {
    add(p.id);
    haptic();
    flyToCart(imgRef.current);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function buyNow() {
    add(p.id);
    haptic();
    openDrawer();
  }

  async function askNotify() {
    const ok = await enableRestockPush(p.id);
    setNotify(ok ? "on" : "fail");
  }

  return (
    <article className="container-page pb-28 pt-6 sm:pt-10 md:pb-16">
      <Link href="/#catalogo" className="rise inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wide2 text-ink-400 transition hover:text-gold-300">
        <ArrowLeft className="h-4 w-4" /> {t("cat.backCatalog")}
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[1.05fr_1fr] md:gap-12 lg:gap-16">
        {/* Foto + reel */}
        <div className="rise" style={{ "--i": 1 } as React.CSSProperties}>
          <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} src={p.img} alt={p.name} className="mx-auto aspect-[4/5] w-full max-w-[520px] object-contain p-6" />
            {soldOut && (
              <span className="absolute left-4 top-4 rounded-full bg-ink-900/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-200 ring-1 ring-white/15">
                {t("cat.soldOut")}
              </span>
            )}
            {!soldOut && left !== undefined && left <= 3 && (
              <span className="absolute left-4 top-4 rounded-full bg-red-500/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                {t("cat.lastUnits")}
              </span>
            )}
          </div>
          {reel && (
            <div className="mt-4 flex items-center gap-4">
              <video
                src={reel.video}
                poster={reel.poster}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                className="h-[150px] w-[85px] shrink-0 rounded-2xl border border-white/8 object-cover"
              />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide2 text-ink-500">{t("menu.reels")}</p>
                <Link href={`/reels#${reel.slug}`} className="mt-1 block text-[13.5px] text-gold-300 underline-offset-4 hover:underline">
                  {t("reels.watch")} →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Detalle */}
        <div className="flex flex-col">
          <p className="rise text-[11px] font-semibold uppercase tracking-wide2 text-gold-300" style={{ "--i": 2 } as React.CSSProperties}>
            {brand.name} · {brand.kicker}
          </p>
          <h1 className="rise mt-3 font-display text-[clamp(2rem,6vw,3.4rem)] font-bold uppercase leading-[0.95] tracking-tightest text-ink-50" style={{ "--i": 3 } as React.CSSProperties}>
            {p.name}
          </h1>
          <div className="rise mt-4 flex flex-wrap items-center gap-2" style={{ "--i": 4 } as React.CSSProperties}>
            <span className={`tag ${STRAIN_BG[p.strain]}`}>{STRAIN_LABEL[p.strain]}</span>
            <span className="text-[13.5px] text-ink-400">{STRAIN_EFFECT[p.strain]}</span>
          </div>
          <p className="rise mt-5 text-[15px] leading-relaxed text-ink-300" style={{ "--i": 5 } as React.CSSProperties}>
            <span className="text-ink-500">{t("quick.flavor")}: </span>
            {p.flavor}. {brand.description}
          </p>
          {week > 0 && (
            <p className="rise mt-4 flex items-center gap-2 text-[12.5px] text-gold-300" style={{ "--i": 6 } as React.CSSProperties}>
              <span className="co-live h-1.5 w-1.5 rounded-full bg-gold-400" />
              {week} {t("cat.week")} · Estelí
            </p>
          )}

          {/* Packs */}
          <div className="rise mt-6 rounded-2xl border border-[#262626] bg-white/[0.02] p-4" style={{ "--i": 7 } as React.CSSProperties}>
            <p className="text-[10.5px] font-semibold uppercase tracking-wide3 text-ink-500">{t("cat.packTitle")}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PACK_TIERS.map((tier, i) => (
                <div key={tier.units} className={`rounded-xl border px-3 py-2.5 text-center ${i === PACK_TIERS.length - 1 ? "border-gold-400/40 bg-gold-400/[0.06]" : "border-white/8"}`}>
                  <p className="font-display text-[18px] font-bold leading-none text-ink-50">${tier.unitPrice}</p>
                  <p className="mt-1 text-[10.5px] uppercase tracking-wide2 text-ink-500">
                    {tier.units === 1 ? "1 unidad" : tier.units === 2 ? "2 unidades" : "3 o más"}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-ink-500">{t("cat.packBody")}</p>
          </div>

          {/* Precio + CTA (escritorio) */}
          <div className="rise mt-6 hidden items-end justify-between gap-4 border-t border-white/8 pt-5 md:flex" style={{ "--i": 8 } as React.CSSProperties}>
            <div>
              <PriceTag price={p.price} listPrice={p.listPrice} size="lg" />
              <p className="mt-2 text-[12px] tabular-nums text-ink-500">
                {formatNIO(p.price)} · {t("quick.delivery")}
              </p>
            </div>
            <Actions />
          </div>
        </div>
      </div>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="mt-16">
          <p className="kicker">{t("cat.related")}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
            {related.map((r, i) => (
              <div key={r.id} className="row-in" style={{ "--i": i } as React.CSSProperties}>
                <ProductCard product={r} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Barra fija de compra (teléfono) */}
      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/8 bg-ink-900/95 p-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] text-ink-400">{p.name}</p>
            <p className="font-display text-[20px] font-bold leading-none text-ink-50">
              ${p.price} <del className="text-[12px] font-normal text-ink-500">${p.listPrice}</del>
            </p>
          </div>
          <Actions compact />
        </div>
      </div>
    </article>
  );

  function Actions({ compact = false }: { compact?: boolean }) {
    if (soldOut) {
      if (!pushSupported()) return <span className="btn border border-white/10 text-ink-500">{t("cat.soldOut")}</span>;
      return notify === "on" ? (
        <span className="btn border border-hybrid/40 text-hybrid"><BellRing className="h-4 w-4" /> {t("cat.notifyOn")}</span>
      ) : (
        <button onClick={() => void askNotify()} className="btn-ghost"><Bell className="h-4 w-4" /> {t("cat.notify")}</button>
      );
    }
    return (
      <div className={`flex gap-2 ${compact ? "" : "flex-col sm:flex-row"}`}>
        <button onClick={handleAdd} aria-label={t("cat.add")} className={`btn ${compact ? "h-12 min-h-0 w-12 px-0" : ""} ${added ? "bg-hybrid text-white" : "btn-ghost"}`}>
          {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {!compact && (added ? t("quick.added") : t("cat.add"))}
        </button>
        <button onClick={buyNow} className={`btn-gold ${compact ? "h-12 min-h-0 px-5" : ""}`}>
          <ShoppingBag className="h-4 w-4" />
          {t("cat.buyNow")}
        </button>
      </div>
    );
  }
}
