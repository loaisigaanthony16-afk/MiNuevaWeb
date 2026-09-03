"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import type { Product, ProductMeta, Strain } from "@/lib/data";

const STRAIN_VISUAL: Record<
  Strain,
  { label: string; pill: string; dot: string }
> = {
  sativa: {
    label: "Sativa",
    pill: "bg-amber-100 text-amber-800",
    dot: "bg-amber-400",
  },
  indica: {
    label: "Indica",
    pill: "bg-violet-100 text-violet-800",
    dot: "bg-violet-400",
  },
  hibrida: {
    label: "Híbrida",
    pill: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-400",
  },
};

export default function ProductCard({
  product,
  meta,
  onAdd,
}: {
  product: Product;
  meta: ProductMeta;
  onAdd: (id: number) => void;
}) {
  const [added, setAdded] = useState(false);
  const visual = STRAIN_VISUAL[product.strain];
  const badge = product.format === "desechable" ? "Desechable 1g" : "Cartucho 510";

  function handleAdd() {
    onAdd(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1300);
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <span
          className={`absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${visual.pill}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${visual.dot}`} />
          {visual.label}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={meta.img}
          alt={meta.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute bottom-3 right-3 z-10 inline-flex rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 shadow-sm">
          {badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {meta.effects}
          </span>
        </div>

        <h3 className="font-semibold leading-snug text-gray-900">
          {meta.name}
        </h3>
        <p className="mt-1 text-xs text-gray-500">{meta.terpenes}</p>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              {meta.thc}% THC
            </span>
          </div>

          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-500 active:scale-95"
          >
            {added ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{added ? "¡Añadido!" : "Agregar"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
