"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import {
  FORMATS,
  LINES,
  STRAIN_LABEL,
  products,
  type FormatId,
  type LineId,
  type Product,
  type Strain,
} from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import { useUi } from "@/components/ui-context";
import { useReveal } from "@/hooks/useReveal";

type StrainFilter = "all" | Strain;

const STRAINS: { key: StrainFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "sativa", label: "Sativa" },
  { key: "indica", label: "Indica" },
  { key: "hybrid", label: "Híbrida" },
];

const LINE_ACCENT: Record<LineId, string> = {
  melted: "text-melted",
  live: "text-live",
  rosin: "text-rosin",
  distillate: "text-distillate",
};

export default function Catalog() {
  const { search, setSearch } = useUi();
  const [format, setFormat] = useState<FormatId>("aio");
  const [strain, setStrain] = useState<StrainFilter>("all");
  const [line, setLine] = useState<"all" | LineId>("all");

  const q = useDeferredValue(search.trim().toLowerCase());
  const searching = q.length > 0;

  const matches = useMemo(() => {
    const test = (p: Product) => {
      if (strain !== "all" && p.strain !== strain) return false;
      if (line !== "all" && p.line !== line) return false;
      if (q) {
        const hay = `${p.name} ${p.flavor} ${p.effect} ${p.line} ${STRAIN_LABEL[p.strain]}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    };
    // Al buscar, ignoramos la pestaña de formato: el buscador recorre todo.
    return products.filter((p) => test(p) && (searching || p.format === format));
  }, [q, searching, format, strain, line]);

  const byLine = useMemo(
    () =>
      LINES.map((l) => ({
        line: l,
        items: matches.filter((p) => p.line === l.id),
      })).filter((g) => g.items.length > 0),
    [matches]
  );

  useReveal([matches.length, format, strain, line, q]);

  const activeFormat = FORMATS.find((f) => f.id === format) ?? FORMATS[0];

  return (
    <section id="catalogo" className="scroll-mt-[76px] pb-24">
      {/* Cabecera del formato */}
      {!searching && (
        <div className="container-page pt-20">
          <div className="reveal">
            <p className="kicker">{activeFormat.kicker}</p>
            <h2 className="display-lg mt-5 text-ink-50">{activeFormat.name}.</h2>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-300">
              {activeFormat.description}
            </p>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="sticky top-[76px] z-30 mt-10 border-y border-white/8 glass">
        <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-3 py-3.5">
          {/* Formato */}
          {!searching && (
            <div className="flex gap-1.5 rounded-full border border-white/10 p-1">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`h-8 rounded-full px-4 text-[12px] font-bold uppercase tracking-[0.1em] transition-all duration-300 ease-smooth ${
                    format === f.id
                      ? "bg-ink-50 text-ink-900"
                      : "text-ink-400 hover:text-ink-50"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}

          {/* Línea */}
          <div className="flex flex-1 gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setLine("all")}
              className={`filter-pill ${line === "all" ? "filter-pill-active" : ""}`}
            >
              Todas las líneas
            </button>
            {LINES.map((l) => (
              <button
                key={l.id}
                onClick={() => setLine(l.id)}
                className={`filter-pill ${line === l.id ? "filter-pill-active" : ""}`}
              >
                {l.name}
              </button>
            ))}
          </div>

          {/* Cepa */}
          <div className="flex gap-2">
            {STRAINS.map((s) => (
              <button
                key={s.key}
                onClick={() => setStrain(s.key)}
                className={`filter-pill ${strain === s.key ? "filter-pill-active" : ""}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-page">
        {searching && (
          <div className="reveal flex flex-wrap items-baseline justify-between gap-3 pt-12">
            <h2 className="display-lg text-ink-50">
              {matches.length} resultado{matches.length === 1 ? "" : "s"}
            </h2>
            <button
              onClick={() => setSearch("")}
              className="text-[12.5px] font-semibold uppercase tracking-wide2 text-gold-300 hover:text-gold-200"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {matches.length === 0 ? (
          <Empty
            reset={() => {
              setSearch("");
              setStrain("all");
              setLine("all");
            }}
          />
        ) : (
          byLine.map(({ line: l, items }) => (
            <div key={l.id} className="pt-16">
              {/* Cabecera de línea */}
              <div className="reveal flex flex-wrap items-end justify-between gap-6 border-b border-white/8 pb-6">
                <div className="max-w-2xl">
                  <p className={`text-[11px] font-semibold uppercase tracking-wide3 ${LINE_ACCENT[l.id]}`}>
                    {l.tagline}
                  </p>
                  <h3 className="display-lg mt-4 text-ink-50">{l.name}</h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink-400">
                    {l.description}
                  </p>
                </div>
                <span className="font-display text-[13px] font-bold uppercase tabular-nums tracking-[0.14em] text-ink-500">
                  {String(items.length).padStart(2, "0")}
                </span>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
                {items.map((p, i) => (
                  <ProductCard key={p.id} product={p} delay={(i % 5) * 60} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Empty({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[46vh] flex-col items-center justify-center text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10">
        <SearchX className="h-7 w-7 text-ink-500" />
      </span>
      <h3 className="mt-7 font-display text-[20px] font-bold uppercase tracking-[0.06em] text-ink-50">
        Sin coincidencias
      </h3>
      <p className="mt-3 max-w-sm text-[14.5px] text-ink-400">
        Probá con otra cepa, otro sabor o quitá los filtros para ver todo el
        catálogo.
      </p>
      <button onClick={reset} className="btn-ghost mt-8">
        Reiniciar filtros
      </button>
    </div>
  );
}
