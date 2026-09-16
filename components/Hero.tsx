"use client";

import { useEffect, useRef, useState } from "react";
import { deliversToday } from "@/lib/delivery-window";
import { ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";
import EmberBackdrop from "@/components/EmberBackdrop";
import PriceTag from "@/components/PriceTag";
import { useT } from "@/components/locale-context";
import { LIST_PRICE, products, UNIT_PRICE } from "@/lib/data";
import { scrollToSection } from "@/lib/scroll";

// Tres cajas reales, de ambas marcas, para la vitrina.
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

/** "Te llega hoy" según la hora de Nicaragua; se calcula tras montar. */
function DeliveryToday() {
  const t = useT();
  const [today, setToday] = useState<boolean | null>(null);
  useEffect(() => setToday(deliversToday()), []);
  if (today === null) return null;
  return <span className="block text-hybrid">{today ? t("cart.today") : t("cart.tomorrow")}</span>;
}

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
    <section
      className="relative isolate overflow-hidden"
      onPointerMove={onPointerMove}
    >
      <EmberBackdrop />
      <div className="pointer-events-none absolute inset-0 z-[1] aurora" aria-hidden />

      <div className="container-page relative z-10 grid items-center gap-4 pb-10 pt-12 sm:pt-20 lg:min-h-[620px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-20">
        {/* Texto */}
        <div>
          <p className="kicker animate-rise">
            <span className="h-px w-8 bg-gold-400/60" />
            {t("hero.kicker")}
          </p>

          <h1 className="display-xl mt-7">
            <span className="line-reveal block text-ink-50">{t("hero.title")}</span>
          </h1>

          <p className="lede-mono mt-7 animate-rise [animation-delay:320ms]">
            <ShieldCheck className="mr-2 inline-block h-[15px] w-[15px] -translate-y-px text-gold-300" />
            {t("hero.lede")}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3 animate-rise [animation-delay:400ms]">
            <button
              onClick={() => scrollToSection("catalogo")}
              className="btn-gold group w-full sm:w-auto"
            >
              <ShoppingBag className="h-4 w-4" />
              {t("hero.cta")}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-smooth group-hover:translate-x-1" />
            </button>
            <button onClick={() => scrollToSection("como-funciona")} className="btn-ghost w-full sm:w-auto">
              {t("hero.how")}
            </button>
          </div>

          <div className="mt-9 flex flex-wrap items-end gap-x-5 gap-y-2 animate-rise [animation-delay:480ms]">
            <PriceTag price={UNIT_PRICE} listPrice={LIST_PRICE} />
            <span className="pb-1 text-[12.5px] text-ink-400">
              {t("ann.delivery")}
              <DeliveryToday />
            </span>
          </div>
        </div>

        {/* Vitrina */}
        <div
          ref={stageRef}
          className="relative mx-auto h-[250px] w-full max-w-[520px] sm:h-[400px] lg:h-[520px]"
          aria-hidden
        >
          {/* Anillos que giran detrás */}
          <span className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-400/15" />
          <span className="absolute left-1/2 top-1/2 h-[96%] w-[96%] -translate-x-1/2 -translate-y-1/2 animate-[spin_40s_linear_infinite] rounded-full border border-dashed border-white/[0.07]" />
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

          {/* Etiqueta de precio flotante */}
          <div className="absolute bottom-[6%] left-1/2 z-30 -translate-x-1/2">
            <span className="pop-in block" style={{ animationDelay: "750ms" }}>
              <span className="glass flex items-center gap-2.5 whitespace-nowrap rounded-full border border-white/12 px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-ink-200 shadow-pop">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-hybrid/70" />
                  <span className="relative h-2 w-2 rounded-full bg-hybrid" />
                </span>
                {t("hero.allAt")}{" "}
                <span className="font-bold text-gold-200">${UNIT_PRICE}</span>
              </span>
            </span>
          </div>
        </div>
      </div>

    </section>
  );
}
