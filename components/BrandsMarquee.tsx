"use client";

import { BRANDS, STRAIN_LABEL, type Strain } from "@/lib/data";
import { useUi } from "@/components/ui-context";
import { useT } from "@/components/locale-context";

const STRAINS: Strain[] = ["indica", "sativa", "hybrid"];

/**
 * Cinta de marcas y cepas, al estilo de "nuestras marcas".
 * Dos filas en sentidos opuestos; cada nombre lleva a su parte del catálogo.
 */
export default function BrandsMarquee() {
  const t = useT();
  const { browse } = useUi();

  const brandItems = [...BRANDS, ...BRANDS].map((b) => ({
    label: b.name,
    go: () => browse({ brand: b.id, strain: "all" }),
  }));
  const strainItems = STRAINS.map((s) => ({
    label: STRAIN_LABEL[s],
    go: () => browse({ brand: "all", strain: s }),
  }));

  const row = (
    items: { label: string; go: () => void }[],
    reverse: boolean,
    outline: boolean
  ) => {
    // Cuatro copias: la animación recorre la mitad y empalma sin salto,
    // y la cinta nunca queda corta en pantallas anchas.
    const loop = [...items, ...items, ...items, ...items];
    return (
      <div className="edge-fade marquee-hover overflow-hidden">
        <div
          className={`flex w-max items-center gap-10 pr-10 sm:gap-16 sm:pr-16 ${
            reverse ? "animate-marqueeBack" : "animate-marquee"
          }`}
        >
          {loop.map((it, i) => (
            <button
              key={i}
              onClick={it.go}
              tabIndex={i < items.length ? 0 : -1}
              aria-hidden={i >= items.length || undefined}
              className={`group flex items-center gap-10 whitespace-nowrap font-display text-[28px] font-semibold uppercase tracking-[0.02em] transition-colors duration-500 sm:gap-16 sm:text-[44px] ${
                outline
                  ? "text-transparent [-webkit-text-stroke:1px_rgba(220,193,131,0.55)] hover:text-gold-300 hover:[-webkit-text-stroke:1px_transparent]"
                  : "text-ink-400 hover:text-ink-50"
              }`}
            >
              {it.label}
              <span className="text-[18px] text-gold-400/70 transition-transform duration-700 group-hover:rotate-180 sm:text-[24px]">
                ✦
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section aria-label={t("col.brands")} className="overflow-hidden border-y border-white/8 py-10 sm:py-14">
      <p className="mb-7 text-center text-[11px] font-semibold uppercase tracking-wide3 text-ink-500">
        {t("col.brands")}
      </p>
      <div className="space-y-4 sm:space-y-6">
        {row(brandItems, false, false)}
        {row(strainItems, true, true)}
      </div>
    </section>
  );
}
