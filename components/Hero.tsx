"use client";

import { ArrowDown } from "lucide-react";
import SmokeBackdrop from "@/components/SmokeBackdrop";
import CoverageMap from "@/components/CoverageMap";
import { countByLine, LINES } from "@/lib/data";
import { DELIVERY_ETA, FREE_SHIPPING_AT } from "@/lib/checkout-util";

const MARQUEE = [
  "Envío nacional",
  "Pedido anónimo",
  "Empaque neutro",
  "Producto original",
  "Pago flexible",
];

const LINE_DOT: Record<string, string> = {
  melted: "bg-melted",
  live: "bg-live",
  rosin: "bg-rosin",
  distillate: "bg-distillate",
};

export default function Hero() {
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
            Extractos premium · Nicaragua
          </p>

          <h1 className="display-xl mt-8 animate-rise [animation-delay:80ms]">
            <span className="block text-ink-50">Vapor</span>
            <span className="block text-gold-gradient">sin rastro.</span>
          </h1>

          <div className="mt-12 flex flex-wrap items-center gap-3 animate-rise [animation-delay:160ms]">
            <a href="#catalogo" className="btn-primary group">
              Ver catálogo
              <ArrowDown className="h-4 w-4 transition-transform duration-300 ease-smooth group-hover:translate-y-1" />
            </a>
            <a href="#privacidad" className="btn-ghost">
              Cómo funciona
            </a>
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
                    {String(total).padStart(2, "0")} referencias
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
              Todo el territorio nacional
            </p>

            <dl className="mt-8 divide-y divide-white/8 border-y border-white/8">
              {[
                ["Entrega", DELIVERY_ETA],
                ["Envío gratis", `Desde $${FREE_SHIPPING_AT}`],
                ["Empaque", "Neutro y sellado"],
                ["Pago", "Tarjeta, banco o efectivo"],
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
          {[...MARQUEE, ...MARQUEE, ...MARQUEE].map((t, i) => (
            <span
              key={i}
              className="flex items-center gap-3 whitespace-nowrap text-[11.5px] font-semibold uppercase tracking-wide2 text-ink-400"
            >
              <span className="h-1 w-1 rounded-full bg-gold-400" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
