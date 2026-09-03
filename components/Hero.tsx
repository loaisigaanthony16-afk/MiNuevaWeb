"use client";

import { ArrowDown, Lock, PackageCheck, Truck } from "lucide-react";
import SmokeBackdrop from "@/components/SmokeBackdrop";
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
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 aurora animate-drift" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid-lines" aria-hidden />

      <div className="container-page relative pb-16 pt-20 sm:pb-24 sm:pt-28">
        {/* Titular sobre el humo */}
        <div className="relative">
          <SmokeBackdrop />

          <div className="relative z-10">
            <p className="kicker animate-rise">
              <span className="h-px w-8 bg-gold-400/60" />
              Extractos premium · Nicaragua
            </p>

            <h1 className="display-xl mt-8 animate-rise [animation-delay:80ms]">
              <span className="block text-ink-50">Vapor</span>
              <span className="block text-gold-gradient">sin rastro.</span>
            </h1>

            <div className="mt-11 flex flex-wrap items-center gap-3 animate-rise [animation-delay:160ms]">
              <a href="#catalogo" className="btn-primary group">
                Ver catálogo
                <ArrowDown className="h-4 w-4 transition-transform duration-300 ease-smooth group-hover:translate-y-1" />
              </a>
              <a href="#privacidad" className="btn-ghost">
                Cómo funciona el anonimato
              </a>
            </div>
          </div>
        </div>

        {/* Índice de líneas */}
        <div className="relative z-10 mt-20 animate-rise [animation-delay:240ms]">
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
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-card border border-white/8 bg-white/8 sm:grid-cols-3 animate-rise [animation-delay:320ms]">
          {[
            {
              icon: Truck,
              title: "Envío nacional",
              text: `Todo el país, ${DELIVERY_ETA}. Gratis desde $${FREE_SHIPPING_AT}.`,
            },
            {
              icon: Lock,
              title: "Pedido anónimo",
              text: "Sin cuenta ni perfil. Tus datos viajan cifrados en tu código.",
            },
            {
              icon: PackageCheck,
              title: "Empaque neutro",
              text: "Sellado y opaco, sin marcas ni referencias al contenido.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-ink-900 px-6 py-7">
              <Icon className="h-[18px] w-[18px] text-gold-300" />
              <p className="mt-4 font-display text-[13px] font-bold uppercase tracking-[0.12em] text-ink-50">
                {title}
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-400">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Marquesina */}
      <div className="relative overflow-hidden border-y border-white/8 py-3.5">
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
    </section>
  );
}
