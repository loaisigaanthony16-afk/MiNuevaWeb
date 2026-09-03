"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { getLine, STRAIN_LABEL, type Product } from "@/lib/data";
import { useUi } from "@/components/ui-context";
import { useStore } from "@/lib/store";
import { formatNIO } from "@/lib/checkout-util";
import { useT } from "@/components/locale-context";

const STRAIN_BG: Record<Product["strain"], string> = {
  sativa: "bg-sativa text-ink-900",
  indica: "bg-indica text-white",
  hybrid: "bg-hybrid text-white",
};

// Halo detrás del producto, del color de su línea.
const LINE_GLOW: Record<Product["line"], string> = {
  melted: "from-melted/16",
  live: "from-live/12",
  rosin: "from-rosin/16",
  distillate: "from-distillate/16",
};

const LINE_BG: Record<Product["line"], string> = {
  melted: "bg-melted text-ink-900",
  live: "bg-live text-ink-900",
  rosin: "bg-rosin text-ink-900",
  distillate: "bg-distillate text-ink-900",
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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Las imágenes son data-URI: suelen estar completas antes de que React
  // enganche onLoad, así que confirmamos el estado tras el montaje.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  useEffect(() => {
    if (!added) return;
    timer.current = setTimeout(() => setAdded(false), 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [added]);

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    add(product.id);
    setBounceKey((k) => k + 1);
    setAdded(true);
  }

  const line = getLine(product.line);

  return (
    <article
      onClick={() => openQuick(product.id)}
      onKeyDown={(e) => e.key === "Enter" && openQuick(product.id)}
      role="button"
      tabIndex={0}
      aria-label={`Ver ${product.name}`}
      style={{ transitionDelay: `${delay}ms` }}
      className="reveal card-gold card-press group flex h-full cursor-pointer flex-col
                 hover:-translate-y-1.5 hover:border-white/16 hover:shadow-lift"
    >
      {/* Imagen */}
      <div className="relative aspect-[5/5.2] overflow-hidden">
        <span
          className={`absolute inset-0 bg-gradient-to-b ${LINE_GLOW[product.line]} via-transparent to-transparent`}
          aria-hidden
        />
        {!loaded && <span className="skeleton absolute inset-0" aria-hidden />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={product.img}
          alt={product.name}
          loading="lazy"
          draggable={false}
          onLoad={() => setLoaded(true)}
          className={`card-media relative h-full w-full object-contain p-4 transition-transform duration-[900ms] ease-smooth group-hover:scale-[1.06] ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
        <span className="sheen" aria-hidden />

        {/* Gramaje impreso en el empaque */}
        {product.weight && (
          <span className="absolute right-3 top-3 rounded-full border border-white/12 bg-ink-900/70 px-2.5 py-1 text-[10.5px] font-bold tabular-nums tracking-[0.06em] text-ink-100 backdrop-blur">
            {product.weight}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-[14.5px] font-bold uppercase leading-tight tracking-[0.04em] text-ink-50">
          {product.name}
        </h3>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className={`tag ${LINE_BG[product.line]}`}>{line.name}</span>
          <span className={`tag ${STRAIN_BG[product.strain]}`}>
            {STRAIN_LABEL[product.strain]}
          </span>
        </div>

        <p className="mt-3 text-[12.5px] leading-snug text-ink-400">
          {product.flavor}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="min-w-0">
            <p className="font-display text-[19px] font-bold leading-none tabular-nums text-ink-50">
              ${product.price}
            </p>
            <p className="mt-1 text-[11px] tabular-nums text-ink-500">
              {formatNIO(product.price)}
            </p>
          </div>

          <button
            key={bounceKey}
            onClick={handleAdd}
            aria-label={`${t("cat.add")} ${product.name}`}
            className={`add-bounce flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                        transition-all duration-300 ease-smooth active:scale-90 ${
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
