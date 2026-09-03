"use client";

import { useMemo, useState } from "react";
import { products, productMeta } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import { useStore } from "@/lib/store";

type Filter = "all" | "sativa" | "indica" | "hibrida" | "desechable";

const FILTER_OPTIONS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "sativa", label: "Sativa" },
  { key: "indica", label: "Indica" },
  { key: "hibrida", label: "Híbrida" },
  { key: "desechable", label: "Desechables" },
];

function getMetaById(id: number) {
  return productMeta.find((m) => m.id === id);
}

export default function Catalog() {
  const [filter, setFilter] = useState<Filter>("all");
  const { add } = useStore();

  const visible = useMemo(() => {
    if (filter === "all") return products;
    if (filter === "desechable")
      return products.filter((p) => p.format === "desechable");
    return products.filter((p) => p.strain === filter);
  }, [filter]);

  return (
    <section id="catalogo" className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              Colección Curada
            </span>
            <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Nuestro Catálogo
            </h2>
            <p className="mt-3 max-w-lg text-gray-500">
              Filtra por cepa o por formato para encontrar el vape ideal para ti.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFilter(opt.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === opt.key
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => {
            const meta = getMetaById(product.id);
            if (!meta) return null;
            return (
              <ProductCard
                key={product.id}
                product={product}
                meta={meta}
                onAdd={add}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
