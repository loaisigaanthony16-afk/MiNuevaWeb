"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FAQ } from "@/lib/data";
import { useReveal } from "@/hooks/useReveal";

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  useReveal([]);

  return (
    <section id="faq" className="scroll-mt-[76px] border-t border-white/8 py-24">
      <div className="container-page grid gap-14 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="reveal lg:sticky lg:top-28 lg:self-start">
          <p className="kicker">Dudas</p>
          <h2 className="display-lg mt-5 text-ink-50">Preguntas</h2>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-400">
            Lo esencial sobre privacidad, envío y pago. Si te queda algo,
            preguntá al confirmar tu código.
          </p>
        </div>

        <div className="reveal border-t border-white/8">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="border-b border-white/8">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span
                    className={`font-display text-[15.5px] font-bold uppercase leading-snug tracking-[0.05em] transition-colors duration-300 ${
                      isOpen ? "text-gold-300" : "text-ink-50 group-hover:text-ink-300"
                    }`}
                  >
                    {item.q}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-500 ease-smooth ${
                      isOpen
                        ? "rotate-[135deg] border-gold-400 bg-gold-400 text-ink-900"
                        : "border-white/12 text-ink-400 group-hover:border-white/35"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-500 ease-smooth ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pb-7 pr-8 text-[14.5px] leading-relaxed text-ink-400">
                      {item.a}
                    </p>
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
