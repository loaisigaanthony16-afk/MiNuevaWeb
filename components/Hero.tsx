"use client";

import { ArrowDown } from "lucide-react";
import SmokeBackdrop from "@/components/SmokeBackdrop";
import CoverageMap from "@/components/CoverageMap";
import { ReviewSummary } from "@/components/Reviews";
import { useT } from "@/components/locale-context";
import { countByLine, LINES } from "@/lib/data";
import {
  DELIVERY_ETA,
  FREE_SHIPPING_AT,
  NATIONAL_SHIPPING_NIO,
} from "@/lib/checkout-util";

const MARQUEE = [
  "tick.shipping",
  "tick.anon",
  "tick.packaging",
  "tick.original",
  "tick.card",
] as const;

const LINE_DOT: Record<string, string> = {
  melted: "bg-melted",
  live: "bg-live",
  rosin: "bg-rosin",
  distillate: "bg-distillate",
};

export default function Hero() {
  const t = useT();
  const aio = countByLine("aio");
  const cart = countByLine("cart");
  const totals = LINES.map((line) => {
    const a = aio.find((x) => x.line.id === line.id)?.total ?? 0;
    const c = cart.find((x) => x.line.id === line.id)?.total ?? 0;
    return { line, total: a + c };
  });

  return (
    <>
      {/* --- Titular, con el humo cubriendo toda la sección --- */}
      <section className="relative isolate overflow-hidden">
        <SmokeBackdrop />
        <div className="pointer-events-none absolute inset-0 z-[1] aurora" aria-hidden />
        <div className="pointer-events-none absolute inset-0 z-[1] grid-lines" aria-hidden />

        <div className="container-page relative z-10 pb-24 pt-24 sm:pb-32 sm:pt-32">
          <p className="kicker animate-rise">
            <span className="h-px w-8 bg-gold-400/60" />
            {t("hero.kicker")}
          </p>

          <h1 className="display-xl mt-8">
            <span className="line-reveal block text-ink-50">{t("hero.line1")}</span>
            <span className="line-reveal block text-gold-gradient [animation-delay:180ms]">
              {t("hero.line2")}
            </span>
          </h1>

          <p className="lede mt-8 animate-rise [animation-delay:320ms]">
            {t("hero.lede")}
          </p>

          <div className="mt-11 flex flex-wrap items-center gap-3 animate-rise [animation-delay:400ms]">
            <a href="#catalogo" className="btn-primary group">
              {t("hero.cta")}
              <ArrowDown className="h-4 w-4 transition-transform duration-300 ease-smooth group-hover:translate-y-1" />
            </a>
            <a href="#privacidad" className="btn-ghost">
              {t("hero.how")}
            </a>
          </div>

          <div className="mt-10 animate-rise [animation-delay:480ms]">
            <ReviewSummary />
          </div>
        </div>
      </section>

      {/* --- Índice de líneas --- */}
      <section className="container-page relative z-10 pb-16">
        <div className="rule mb-6" />
        <ul className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
          {totals.map(({ line, total }) => (
            <li key={line.id}>
              <a href="#catalogo" className="group flex items-start gap-2.5">
                <span
                  className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${LINE_DOT[line.id]}`}
                />
                <span>
                  <span className="block font-display text-[12.5px] font-semibold uppercase leading-tight tracking-[0.1em] text-ink-100 transition-colors group-hover:text-gold-300">
                    {line.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] tabular-nums text-ink-500">
                    {String(total).padStart(2, "0")} {t("hero.refs")}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* --- Cobertura: mapa animado y tres datos, sin párrafos --- */}
      <section className="border-y border-white/8">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex justify-center lg:justify-start">
            <CoverageMap className="h-[190px] w-auto sm:h-[230px]" />
          </div>

          <div>
            <p className="kicker">
              <span className="h-px w-8 bg-gold-400/60" />
              {t("cover.kicker")}
            </p>

            <dl className="mt-8 divide-y divide-white/8 border-y border-white/8">
              {[
                [t("cover.delivery"), DELIVERY_ETA],
                [
                  t("cover.shipping"),
                  `C$${NATIONAL_SHIPPING_NIO} · ${t("cart.freeFrom")} $${FREE_SHIPPING_AT}`,
                ],
                [t("cover.packaging"), t("cover.packagingValue")],
                [t("cover.payment"), t("cover.paymentValue")],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-6 py-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide2 text-ink-500">
                    {k}
                  </dt>
                  <dd className="font-display text-[14.5px] font-semibold uppercase tracking-[0.06em] text-ink-50">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* --- Marquesina --- */}
      <div className="relative overflow-hidden border-b border-white/8 py-3.5">
        <div className="flex w-max animate-marquee gap-12 pr-12">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE].map((key, i) => (
            <span
              key={i}
              className="flex items-center gap-3 whitespace-nowrap text-[11.5px] font-semibold uppercase tracking-wide2 text-ink-400"
            >
              <span className="h-1 w-1 rounded-full bg-gold-400" />
              {t(key)}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
