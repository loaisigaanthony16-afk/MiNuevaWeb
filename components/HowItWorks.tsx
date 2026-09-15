"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, Lock, MapPin, MessageCircle, ShoppingBag, UserX } from "lucide-react";
import { useT } from "@/components/locale-context";
import { useReveal } from "@/hooks/useReveal";
import CardLogos from "@/components/CardLogos";
import type { Key } from "@/lib/i18n";

const STEPS: { icon: typeof ShoppingBag; title: Key; body: Key }[] = [
  { icon: ShoppingBag, title: "how.s1t", body: "how.s1b" },
  { icon: CreditCard, title: "how.s2t", body: "how.s2b" },
  { icon: MessageCircle, title: "how.s3t", body: "how.s3b" },
  { icon: MapPin, title: "how.s4t", body: "how.s4b" },
];

/**
 * Cómo comprar, en cuatro pasos, con la privacidad explicada en el mismo
 * lugar donde surge la duda. La línea que une los pasos se dibuja a medida
 * que la sección entra en pantalla.
 */
export default function HowItWorks() {
  const t = useT();
  const ref = useRef<HTMLOListElement>(null);
  useReveal([]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 cuando la lista asoma abajo, 1 cuando llega a la mitad de pantalla.
      const p = (vh - r.top) / (vh * 0.5 + r.height * 0.5);
      const progress = Math.min(1, Math.max(0, p));
      
      el.style.setProperty('--scroll-progress', progress.toString());
      const active = Math.min(STEPS.length, Math.floor(progress * STEPS.length + 0.35));
      el.dataset.activeStep = active.toString();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="como-funciona" className="scroll-mt-[var(--nav-min)] border-t border-white/8 py-24">
      <style>{`
        ol[data-active-step="1"] > li:nth-child(-n+1) .step-icon,
        ol[data-active-step="2"] > li:nth-child(-n+2) .step-icon,
        ol[data-active-step="3"] > li:nth-child(-n+3) .step-icon,
        ol[data-active-step="4"] > li:nth-child(-n+4) .step-icon {
          transform: scale(1);
          border-color: #facc15;
          background-color: #facc15;
          color: #0f0f0f;
          box-shadow: 0 0 20px rgba(250, 204, 21, 0.4);
        }
        ol[data-active-step="1"] > li:nth-child(-n+1) .step-content,
        ol[data-active-step="2"] > li:nth-child(-n+2) .step-content,
        ol[data-active-step="3"] > li:nth-child(-n+3) .step-content,
        ol[data-active-step="4"] > li:nth-child(-n+4) .step-content {
          opacity: 1;
        }
      `}</style>
      <div className="container-page">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="kicker justify-center">
            <span className="h-px w-8 bg-gold-400/60" />
            {t("how.kicker")}
            <span className="h-px w-8 bg-gold-400/60" />
          </p>
          <h2 className="display-lg mt-5 text-ink-50">{t("how.title")}</h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-ink-400">
            {t("how.body")}
          </p>
        </div>

        <ol ref={ref} data-active-step="0" className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
          {/* Línea que se dibuja: horizontal en PC, vertical en el teléfono */}
          <span className="absolute left-[27px] top-2 hidden h-[calc(100%-1rem)] w-px bg-white/8 max-md:block" aria-hidden>
            <span className="block w-full bg-gold-400 transition-[height] duration-300" style={{ height: 'calc(var(--scroll-progress, 0) * 100%)' }} />
          </span>
          <span className="absolute left-[12.5%] right-[12.5%] top-[27px] hidden h-px bg-white/8 md:block" aria-hidden>
            <span className="block h-full bg-gold-400 transition-[width] duration-300" style={{ width: 'calc(var(--scroll-progress, 0) * 100%)' }} />
          </span>

          {STEPS.map(({ icon: Icon, title, body }, i) => {
            return (
              <li key={title} className="relative flex gap-5 md:flex-col md:items-center md:text-center">
                <span className="step-icon relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/12 bg-ink-900 text-ink-500 scale-90 transition-all duration-700 ease-smooth">
                  <Icon className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-ink-900 text-[10px] font-bold tabular-nums text-gold-300 ring-1 ring-white/10">
                    {i + 1}
                  </span>
                </span>
                <div className="step-content opacity-50 transition-all duration-700 ease-smooth">
                  <p className="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-ink-50 md:mt-5">
                    {t(title)}
                  </p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-ink-400">{t(body)}</p>
                  {i === 1 && <CardLogos className="mt-3 md:justify-center" />}
                </div>
              </li>
            );
          })}
        </ol>

        {/* Privacidad, en tres datos */}
        <div id="privacidad" className="reveal mt-20 grid gap-px overflow-hidden rounded-card border border-white/8 bg-white/8 sm:grid-cols-3">
          {[
            { icon: UserX, title: "how.p1t", body: "how.p1b" },
            { icon: Lock, title: "how.p2t", body: "how.p2b" },
            { icon: MessageCircle, title: "how.p3t", body: "how.p3b" },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="group bg-ink-900 p-6 transition-colors duration-500 hover:bg-ink-850">
              <Icon className="h-[18px] w-[18px] text-gold-300 transition-transform duration-500 group-hover:-translate-y-0.5" />
              <p className="mt-4 font-display text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-50">
                {t(title as Key)}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-400">{t(body as Key)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
