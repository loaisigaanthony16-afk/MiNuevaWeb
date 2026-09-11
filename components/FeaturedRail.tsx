"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LINES, products } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import { useT } from "@/components/locale-context";
import { useReveal } from "@/hooks/useReveal";

// Dos de cada línea, intercaladas para que al deslizar se vean distintas.
const PICKS = [0, 1].flatMap((n) =>
  LINES.map((l) => products.filter((p) => p.photo && p.line === l.id)[n]).filter(
    Boolean
  )
);

/**
 * Carrusel de entrada: pocas opciones y bien distintas entre sí, para quien
 * no sabe por dónde empezar. En el teléfono se desliza con el dedo; en PC
 * tiene flechas. La barra inferior muestra cuánto falta por ver.
 */
export default function FeaturedRail() {
  const t = useT();
  const railRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });
  useReveal([]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const x = rail.scrollLeft;
      setProgress(max > 0 ? x / max : 1);
      setEdges({ start: x < 4, end: x > max - 4 });
    };
    update();
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      rail.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function step(dir: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir * rail.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="py-20 sm:py-24">
      <div className="container-page">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="kicker">
              <span className="h-px w-8 bg-gold-400/60" />
              {t("feat.kicker")}
            </p>
            <h2 className="display-lg mt-5 text-ink-50">{t("feat.title")}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-400">
              {t("feat.body")}
            </p>
          </div>

          <div className="hidden gap-2 sm:flex">
            <button
              onClick={() => step(-1)}
              disabled={edges.start}
              aria-label={t("feat.prev")}
              className="grid h-12 w-12 place-items-center rounded-full border border-white/14 text-ink-100 transition-all duration-300 ease-smooth hover:border-gold-400 hover:bg-gold-400 hover:text-ink-900 disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => step(1)}
              disabled={edges.end}
              aria-label={t("feat.next")}
              className="grid h-12 w-12 place-items-center rounded-full border border-white/14 text-ink-100 transition-all duration-300 ease-smooth hover:border-gold-400 hover:bg-gold-400 hover:text-ink-900 disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* El carril usa todo el ancho en móvil para que se note que sigue */}
      <div className="container-page mt-10 px-0 sm:px-8">
        <div
          ref={railRef}
          className="rail no-scrollbar flex gap-3 overflow-x-auto px-5 pb-2 sm:gap-4 sm:px-0"
        >
          {PICKS.map((p, i) => (
            <div
              key={p.id}
              className="w-[62%] shrink-0 sm:w-[38%] md:w-[30%] lg:w-[calc((100%-3rem)/4)]"
            >
              <ProductCard product={p} delay={(i % 4) * 70} />
            </div>
          ))}
        </div>
      </div>

      <div className="container-page mt-6">
        <div className="relative h-px bg-white/10">
          <span
            className="absolute inset-y-0 left-0 bg-gold-400 transition-[width] duration-300 ease-smooth"
            style={{ width: `${Math.max(12, progress * 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}
