"use client";

import { useDeferredValue, useMemo, startTransition } from "react";
import { SearchX } from "lucide-react";
import {
  BRANDS,
  STRAIN_LABEL,
  products,
  type Product,
  type Strain,
} from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import { useUi } from "@/components/ui-context";
import { useReveal } from "@/hooks/useReveal";
import { useT } from "@/components/locale-context";

const STRAINS: ("all" | Strain)[] = ["all", "indica", "sativa", "hybrid"];

export default function Catalog() {
  const t = useT();
  const {
    search,
    setSearch,
    catalogBrand: brand,
    setCatalogBrand: setBrand,
    catalogStrain: strain,
    setCatalogStrain: setStrain,
  } = useUi();

  const q = useDeferredValue(search.trim().toLowerCase());
  const searching = q.length > 0;

  const matches = useMemo(() => {
    const test = (p: Product) => {
      if (brand !== "all" && p.brand !== brand) return false;
      if (strain !== "all" && p.strain !== strain) return false;
      if (q) {
        const brandName = BRANDS.find((b) => b.id === p.brand)?.name ?? "";
        const hay = `${p.name} ${p.flavor} ${brandName} ${STRAIN_LABEL[p.strain]}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    };
    return products.filter(test);
  }, [q, brand, strain]);

  const byBrand = useMemo(
    () =>
      BRANDS.map((b) => ({
        brand: b,
        items: matches.filter((p) => p.brand === b.id),
      })).filter((g) => g.items.length > 0),
    [matches]
  );

  useReveal([matches.length, brand, strain, q]);

  return (
    <section id="catalogo" className="scroll-mt-[var(--nav-min)] pb-24">
      <div className="container-page pt-20">
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">{t("cat.kicker")}</p>
            <h2 className="display-lg mt-5 text-ink-50">
              <span role="status" aria-live="polite">
                {searching
                  ? `${matches.length} ${matches.length === 1 ? t("cat.results") : t("cat.resultsPlural")}`
                  : t("cat.title")}
              </span>
            </h2>
            {!searching && (
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-400">
                {t("cat.body")}
              </p>
            )}
          </div>
          {searching && (
            <button
              onClick={() => setSearch("")}
              className="text-[12.5px] font-semibold uppercase tracking-wide2 text-gold-300 hover:text-gold-200"
            >
              {t("cat.clear")}
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="sticky top-[var(--nav-h)] z-30 mt-10 border-y border-white/8 glass transition-[top] duration-500 ease-smooth">
        <div className="container-page flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
          <div className="flex shrink-0 gap-1 rounded-full border border-white/10 p-1">
            {[{ id: "all" as const, name: t("cat.brandAll") }, ...BRANDS].map((b) => (
              <button
                key={b.id}
                onClick={() => setBrand(b.id)}
                aria-pressed={brand === b.id}
                className={`h-8 whitespace-nowrap rounded-full px-4 text-[12px] font-bold uppercase tracking-[0.1em] transition-all duration-300 ease-smooth ${
                  brand === b.id ? "bg-ink-50 text-ink-900" : "text-ink-400 hover:text-ink-50"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>

          <span className="mx-1 h-6 w-px shrink-0 bg-white/10" />

          {STRAINS.map((s) => (
            <button
              key={s}
              onClick={() => setStrain(s)}
              aria-pressed={strain === s}
              className={`filter-pill shrink-0 ${strain === s ? "filter-pill-active" : ""}`}
            >
              {s === "all" ? t("cat.strainAll") : STRAIN_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="container-page">
        {matches.length === 0 ? (
          <div className="flex min-h-[46vh] flex-col items-center justify-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10">
              <SearchX className="h-7 w-7 text-ink-500" />
            </span>
            <h3 className="mt-7 font-display text-[20px] font-bold uppercase tracking-[0.06em] text-ink-50">
              {t("cat.emptyTitle")}
            </h3>
            <p className="mt-3 max-w-sm text-[14.5px] text-ink-400">{t("cat.emptyBody")}</p>
            <button
              onClick={() => {
                startTransition(() => {
                  setSearch("");
                  setStrain("all");
                  setBrand("all");
                });
              }}
              className="btn-ghost mt-8"
            >
              {t("cat.reset")}
            </button>
          </div>
        ) : (
          byBrand.map(({ brand: b, items }) => (
            <div key={b.id} className="pt-14">
              <div className="reveal flex flex-wrap items-end justify-between gap-4 border-b border-white/8 pb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide3 text-gold-300">
                    {b.kicker}
                  </p>
                  <h3 className="mt-3 font-display text-[clamp(1.6rem,4vw,2.4rem)] font-bold uppercase leading-none tracking-tightest text-ink-50">
                    {b.name}
                  </h3>
                </div>
                <span className="font-display text-[13px] font-bold uppercase tabular-nums tracking-[0.14em] text-ink-500">
                  {String(items.length).padStart(2, "0")}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5">
                {items.map((p, i) => (
                  <div key={p.id} className="animate-rise">
                    <ProductCard product={p} delay={(i % 5) * 60} />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
