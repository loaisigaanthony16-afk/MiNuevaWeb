"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import SmokeBackdrop from "@/components/SmokeBackdrop";
import { useT } from "@/components/locale-context";
import { LIST_PRICE, products, UNIT_PRICE } from "@/lib/data";
import { scrollToSection } from "@/lib/scroll";

// Tres cajas reales, de distintas marcas, para la vitrina.
const SHOWCASE = [110, 103, 112]
  .map((id) => products.find((p) => p.id === id))
  .filter((p): p is (typeof products)[number] => Boolean(p));

// Posición, tamaño, giro y profundidad de cada pieza de la vitrina.
// `depth` define cuánto se mueve con el puntero: lo cercano se mueve más.
const SLOTS = [
  { cls: "-left-[4%] top-[30%] h-[48%] z-10", rot: "-12deg", depth: 14, float: "float-b", delay: 350 },
  { cls: "left-1/2 top-[10%] h-[66%] -translate-x-1/2 z-20", rot: "0deg", depth: 26, float: "float-a", delay: 200 },
  { cls: "-right-[4%] top-[32%] h-[46%] z-10", rot: "12deg", depth: 18, float: "float-c", delay: 500 },
];

export default function Hero() {
  const t = useT();
  const stageRef = useRef<HTMLDivElement>(null);

  // Paralaje de la vitrina: solo con mouse, en el teléfono queda la flotación.
  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType === "touch") return;
    const stage = stageRef.current;
    if (!stage) return;
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    stage.style.setProperty("--px", x.toFixed(3));
    stage.style.setProperty("--py", y.toFixed(3));
  }

  return (
    <section className="relative isolate overflow-hidden" onPointerMove={onPointerMove}>
      <div className="pointer-events-none absolute inset-0 aurora" aria-hidden />
      <SmokeBackdrop className="smoke-in" />
      {/* Funde el humo con la sección siguiente. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-32 bg-gradient-to-b from-transparent to-ink-900" aria-hidden />

      <div className="container-page relative z-10 grid items-center gap-6 pb-14 pt-14 sm:pt-20 lg:min-h-[640px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-20">
        {/* Texto */}
        <div>
          <p className="kicker animate-rise">
            <span className="h-px w-8 bg-gold-400/60" />
            {t("hero.kicker")}
          </p>

          <h1 className="display-xl mt-6">
            <span className="line-reveal block text-ink-50">{t("hero.title")}</span>
          </h1>

          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-ink-400 animate-rise [animation-delay:320ms]">
            {t("hero.lede")}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-6 animate-rise [animation-delay:400ms]">
            <button onClick={() => scrollToSection("catalogo")} className="btn-gold group w-full sm:w-auto">
              {t("hero.cta")}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-smooth group-hover:translate-x-1" />
            </button>
            <p className="flex items-baseline gap-2 max-sm:w-full max-sm:justify-center">
              <span className="font-display text-[28px] font-bold leading-none tabular-nums text-ink-50">${UNIT_PRICE}</span>
              <del className="text-[14px] tabular-nums text-ink-500 decoration-red-500/60">
                <span className="sr-only">Antes </span>${LIST_PRICE}
              </del>
            </p>
          </div>
        </div>

        {/* Vitrina */}
        <div
          ref={stageRef}
          className="relative mx-auto h-[250px] w-full max-w-[520px] sm:h-[400px] lg:h-[520px]"
          aria-hidden
        >
          <span className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/10 blur-3xl" />

          {SHOWCASE.map((p, i) => {
            const s = SLOTS[i];
            return (
              // Cada capa anima una sola cosa: posición, paralaje, entrada
              // y flotación. Así ninguna transformación pisa a otra.
              <div key={p.id} className={`absolute ${s.cls}`}>
                <div
                  className="h-full"
                  style={{
                    transform: `translate3d(calc(var(--px, 0) * ${s.depth}px), calc(var(--py, 0) * ${s.depth}px), 0)`,
                    transition: "transform 0.6s cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  <div className="pop-in h-full" style={{ animationDelay: `${s.delay}ms` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.img}
                      alt=""
                      draggable={false}
                      className={`${s.float} h-full w-auto max-w-none drop-shadow-[0_30px_40px_rgba(0,0,0,0.7)]`}
                      style={{ ["--rot" as string]: s.rot }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
