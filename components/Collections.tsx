"use client";

import { ArrowUpRight } from "lucide-react";
import {
  BRANDS,
  products,
  type Brand,
  type Product,
} from "@/lib/data";
import { useUi } from "@/components/ui-context";
import { useT } from "@/components/locale-context";
import { useReveal } from "@/hooks/useReveal";
import { useTilt } from "@/hooks/useTilt";

/**
 * "Colecciones principales": la puerta de entrada al catálogo.
 * Cada tarjeta lleva al catálogo ya filtrado por marca o por cepa.
 */
export default function Collections() {
  const t = useT();
  useReveal([]);

  return (
    <section id="colecciones" className="scroll-mt-[var(--nav-min)] py-16 sm:py-24">
      <div className="container-page">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="kicker justify-center">
            <span className="h-px w-8 bg-gold-400/60" />
            {t("col.kicker")}
            <span className="h-px w-8 bg-gold-400/60" />
          </p>
          <h2 className="mt-5 font-display text-[clamp(2.1rem,5.6vw,4rem)] font-medium uppercase leading-[0.98] tracking-tightest">
            <span className="text-ink-50">{t("col.title")}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-ink-400">
            {t("col.body")}
          </p>
        </div>

        {/* Marcas */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {BRANDS.map((brand, i) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              items={products.filter((p) => p.brand === brand.id)}
              index={i}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

function BrandCard({
  brand,
  items,
  index,
}: {
  brand: Brand;
  items: Product[];
  index: number;
}) {
  const t = useT();
  const { browse } = useUi();
  const tilt = useTilt<HTMLAnchorElement>(5);
  const fan = items.slice(0, 3);

  return (
    <div className="reveal" style={{ transitionDelay: `${index * 110}ms` }}>
      <a
        href="#catalogo"
        ref={tilt.ref}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
        onClick={(e) => {
          e.preventDefault();
          browse({ brand: brand.id, strain: "all" });
        }}
        aria-label={`${t("col.view")}: ${brand.name}`}
        className="tilt card-press group relative flex w-full flex-col overflow-hidden rounded-card border border-white/8 bg-ink-850 text-left transition-colors duration-500 hover:border-white/20"
      >
        <span
          aria-hidden
          className="absolute inset-0 opacity-60 transition-opacity duration-700 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(80% 70% at 50% 100%, rgba(201,167,88,0.18) 0%, transparent 70%)",
          }}
        />
        <span className="tilt-glare" aria-hidden />

        {/* Abanico de cajas reales */}
        <span className="fan relative mx-auto mt-6 block h-[150px] w-full sm:h-[240px]">
          {fan.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.id}
              src={p.img}
              alt=""
              loading="lazy"
              draggable={false}
              className={`absolute bottom-0 left-1/2 h-full w-auto ${i === 1 ? "z-10" : "opacity-90"}`}
              style={{ transitionDelay: `${index * 110 + 250 + i * 60}ms` }}
            />
          ))}
        </span>

        <span className="relative flex items-end justify-between gap-4 p-5 sm:p-6">
          <span className="min-w-0">
            <span className="block text-[10.5px] font-semibold uppercase tracking-wide2 text-gold-300">
              {brand.kicker}
            </span>
            <span className="mt-2 block font-display text-[24px] font-semibold uppercase leading-none tracking-[0.03em] text-ink-50 sm:text-[30px]">
              {brand.name}
            </span>
            <span className="mt-2.5 block text-[12.5px] text-ink-400">
              <span className="tabular-nums text-ink-200">{items.length}</span> {t("col.refs")}
            </span>
          </span>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 transition-all duration-500 ease-smooth group-hover:rotate-45 group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-ink-900">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </span>
      </a>
    </div>
  );
}

