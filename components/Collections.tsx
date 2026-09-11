"use client";

import { ArrowUpRight } from "lucide-react";
import {
  FORMATS,
  LINES,
  products,
  type FormatId,
  type LineId,
  type Product,
} from "@/lib/data";
import { useUi } from "@/components/ui-context";
import { useT } from "@/components/locale-context";
import { useReveal } from "@/hooks/useReveal";
import { useTilt } from "@/hooks/useTilt";

// Color de cada línea, para su halo y su punto.
const LINE_HEX: Record<LineId, string> = {
  melted: "#F2A8CB",
  live: "#D9DEE4",
  rosin: "#6FC8BE",
  distillate: "#D9B978",
};

function minPrice(list: Product[]): number {
  return Math.min(...list.map((p) => p.price));
}

/**
 * "Colecciones principales": la puerta de entrada al catálogo.
 *
 * Cada tarjeta lleva al catálogo ya filtrado. Así la persona elige por lo
 * que conoce (la línea o el formato) en vez de recorrer 34 productos.
 */
export default function Collections() {
  const t = useT();
  useReveal([]);

  const lines = LINES.map((line) => {
    const all = products.filter((p) => p.line === line.id);
    const photos = all.filter((p) => p.photo).slice(0, 3);
    return { line, total: all.length, from: minPrice(all), photos };
  });

  const formats = FORMATS.map((f) => {
    const all = products.filter((p) => p.format === f.id);
    return { format: f, total: all.length, from: minPrice(all), sample: all[0] };
  });

  return (
    <section id="colecciones" className="scroll-mt-[var(--nav-min)] py-20 sm:py-24">
      <div className="container-page">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="kicker justify-center">
            <span className="h-px w-8 bg-gold-400/60" />
            {t("col.kicker")}
            <span className="h-px w-8 bg-gold-400/60" />
          </p>
          <h2 className="mt-5 font-display text-[clamp(2.1rem,5.6vw,4rem)] font-medium uppercase leading-[0.98] tracking-tightest">
            <span className="text-shine">{t("col.title")}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-ink-400">
            {t("col.body")}
          </p>
        </div>

        {/* Líneas */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {lines.map((entry, i) => (
            <LineCard key={entry.line.id} {...entry} index={i} />
          ))}
        </div>

        {/* Formatos */}
        <p className="reveal mt-14 text-center text-[11px] font-semibold uppercase tracking-wide3 text-ink-500">
          {t("col.formats")}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {formats.map((entry, i) => (
            <FormatCard key={entry.format.id} {...entry} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LineCard({
  line,
  total,
  from,
  photos,
  index,
}: {
  line: (typeof LINES)[number];
  total: number;
  from: number;
  photos: Product[];
  index: number;
}) {
  const t = useT();
  const { browse } = useUi();
  const tilt = useTilt<HTMLButtonElement>(6);
  const hex = LINE_HEX[line.id];

  return (
    <div className="reveal" style={{ transitionDelay: `${index * 90}ms` }}>
      <button
        ref={tilt.ref}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
        onClick={() => browse({ format: "aio", line: line.id })}
        aria-label={`${t("col.view")}: ${line.name}`}
        className="tilt card-press group relative flex h-full w-full flex-col overflow-hidden rounded-card border border-white/8 bg-ink-850 text-left transition-colors duration-500 hover:border-white/20"
      >
        {/* Halo del color de la línea, que crece al pasar el cursor */}
        <span
          aria-hidden
          className="absolute inset-0 opacity-60 transition-opacity duration-700 group-hover:opacity-100"
          style={{
            background: `radial-gradient(90% 70% at 50% 100%, ${hex}2e 0%, transparent 70%)`,
          }}
        />
        <span className="tilt-glare" aria-hidden />

        {/* Abanico de productos reales */}
        <span className="fan relative mx-auto mt-6 block h-[130px] w-full sm:h-[180px]">
          {photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.id}
              src={p.img}
              alt=""
              loading="lazy"
              draggable={false}
              className={`absolute bottom-0 left-1/2 h-full w-auto drop-shadow-[0_18px_24px_rgba(0,0,0,0.6)] ${
                i === 1 ? "z-10" : "opacity-90"
              }`}
              style={{ transitionDelay: `${index * 90 + 250 + i * 60}ms` }}
            />
          ))}
        </span>

        <span className="relative mt-auto block p-4 pt-6 sm:p-5 sm:pt-7">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: hex }} />
            <span className="text-[10px] font-semibold uppercase tracking-wide2 text-ink-400">
              {line.tagline}
            </span>
          </span>
          <span className="mt-2 block font-display text-[16px] font-semibold uppercase leading-tight tracking-[0.06em] text-ink-50 sm:text-[19px]">
            {line.name}
          </span>
          <span className="mt-3 flex items-end justify-between gap-2">
            <span className="text-[11.5px] leading-snug text-ink-400">
              <span className="tabular-nums text-ink-200">{total}</span> {t("col.refs")}
              <span className="block">
                {t("col.from")}{" "}
                <span className="font-semibold tabular-nums text-gold-200">${from}</span>
              </span>
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 transition-all duration-500 ease-smooth group-hover:rotate-45 group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-ink-900">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}

function FormatCard({
  format,
  total,
  from,
  sample,
  index,
}: {
  format: (typeof FORMATS)[number];
  total: number;
  from: number;
  sample: Product;
  index: number;
}) {
  const t = useT();
  const { browse } = useUi();
  const tilt = useTilt<HTMLButtonElement>(4);
  const note: Record<FormatId, string> = {
    aio: t("col.aioNote"),
    cart: t("col.cartNote"),
  };

  return (
    <div className="reveal" style={{ transitionDelay: `${index * 110}ms` }}>
      <button
        ref={tilt.ref}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
        onClick={() => browse({ format: format.id, line: "all" })}
        aria-label={`${t("col.view")}: ${format.name}`}
        className="tilt card-gold card-press group flex w-full items-center gap-4 p-4 text-left hover:border-white/20 sm:gap-6 sm:p-6"
      >
        <span className="tilt-glare" aria-hidden />
        <span className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[12px] bg-gradient-to-b from-gold-400/10 to-transparent sm:h-32 sm:w-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sample.img}
            alt=""
            loading="lazy"
            draggable={false}
            className="h-[88%] w-auto object-contain transition-transform duration-700 ease-smooth group-hover:-translate-y-1 group-hover:scale-110 group-hover:rotate-[-4deg]"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10.5px] font-semibold uppercase tracking-wide2 text-gold-300">
            {format.kicker}
          </span>
          <span className="mt-1.5 block font-display text-[20px] font-semibold uppercase leading-tight tracking-[0.04em] text-ink-50 sm:text-[26px]">
            {format.name}
          </span>
          <span className="mt-1.5 block text-[12.5px] text-ink-400">{note[format.id]}</span>
          <span className="mt-3 block text-[12px] text-ink-400">
            <span className="tabular-nums text-ink-200">{total}</span> {t("col.refs")} ·{" "}
            {t("col.from")}{" "}
            <span className="font-semibold tabular-nums text-gold-200">${from}</span>
          </span>
        </span>
        <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 transition-all duration-500 ease-smooth group-hover:rotate-45 group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-ink-900 sm:grid">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}
