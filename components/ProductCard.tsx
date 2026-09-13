"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { getBrand, STRAIN_LABEL, type Product } from "@/lib/data";
import { useUi } from "@/components/ui-context";
import { useStore } from "@/lib/store";
import { formatNIO } from "@/lib/checkout-util";
import { useT } from "@/components/locale-context";
import PriceTag from "@/components/PriceTag";

const STRAIN_BG: Record<Product["strain"], string> = {
  sativa: "bg-sativa text-ink-900",
  indica: "bg-indica text-white",
  hybrid: "bg-hybrid text-white",
};

export default function ProductCard({
  product,
  delay = 0,
}: {
  product: Product;
  delay?: number;
}) {
  const t = useT();
  const { openQuick } = useUi();
  const { add } = useStore();
  const [added, setAdded] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Si la imagen ya estaba en caché, onLoad puede dispararse antes de que
  // React lo enganche: confirmamos el estado tras el montaje.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1500);
    return () => clearTimeout(timer);
  }, [added]);

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    add(product.id);
    setBounceKey((k) => k + 1);
    setAdded(true);
  }

  return (
    <article
      onClick={() => openQuick(product.id)}
      onKeyDown={(e) => e.key === "Enter" && openQuick(product.id)}
      role="button"
      tabIndex={0}
      aria-label={product.name}
      style={{ transitionDelay: `${delay}ms` }}
      className="reveal card-gold card-press group flex h-full cursor-pointer flex-col
                 hover:-translate-y-1.5 hover:border-white/16 hover:shadow-lift"
    >
      {/* Imagen */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-white/[0.04] to-transparent">
        {!loaded && <span className="skeleton absolute inset-0" aria-hidden />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={product.img}
          alt={product.name}
          loading="lazy"
          draggable={false}
          onLoad={() => setLoaded(true)}
          className={`card-media relative h-full w-full object-contain p-2 transition-transform duration-[900ms] ease-smooth group-hover:scale-[1.06] ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
        <span className="sheen" aria-hidden />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide2 text-ink-500">
          {getBrand(product.brand).name} · {product.weight}
        </p>
        <h3 className="mt-1 font-display text-[14px] font-bold uppercase leading-tight tracking-[0.03em] text-ink-50 sm:text-[15px]">
          {product.name}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={`tag ${STRAIN_BG[product.strain]}`}>{STRAIN_LABEL[product.strain]}</span>
          <span className="text-[11.5px] text-ink-400">{product.flavor}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
            <div className="min-w-0">
              <PriceTag price={product.price} listPrice={product.listPrice} />
              <p className="mt-1.5 text-[11px] tabular-nums text-ink-500">
                {formatNIO(product.price)}
              </p>
            </div>

            <button
              key={bounceKey}
              onClick={handleAdd}
              aria-label={`${t("cat.add")} ${product.name}`}
              className={`add-bounce flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-smooth active:scale-90 ${
                added
                  ? "bg-hybrid text-white"
                  : "border border-white/14 text-ink-100 hover:border-gold-400 hover:bg-gold-400 hover:text-ink-900"
              }`}
            >
              {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
        </div>
      </div>
    </article>
  );
}
