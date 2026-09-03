"use client";

import { useReveal } from "@/hooks/useReveal";
import { useT } from "@/components/locale-context";

const STEPS = [
  ["priv.s1t", "priv.s1b"],
  ["priv.s2t", "priv.s2b"],
  ["priv.s3t", "priv.s3b"],
  ["priv.s4t", "priv.s4b"],
] as const;

export default function PrivacySection() {
  const t = useT();
  useReveal([]);

  return (
    <section id="privacidad" className="scroll-mt-[76px] border-t border-white/8 py-24">
      <div className="container-page">
        <div className="reveal max-w-2xl">
          <p className="kicker">
            <span className="h-px w-8 bg-gold-400/60" />
            {t("priv.kicker")}
          </p>
          <h2 className="display-lg mt-5 text-ink-50">
            {t("priv.title1")}{" "}
            <span className="text-gold-gradient">{t("priv.title2")}</span>
          </h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-ink-400">
{t("priv.body")}
          </p>
        </div>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-card border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([titleKey, textKey], i) => (
            <li
              key={titleKey}
              style={{ transitionDelay: `${i * 90}ms` }}
              className="reveal group relative bg-ink-900 p-7 transition-colors duration-500 hover:bg-ink-850"
            >
              <span className="font-display text-[11px] font-bold tabular-nums tracking-[0.2em] text-gold-400/70">
                0{i + 1}
              </span>
              <p className="mt-5 font-display text-[13.5px] font-semibold uppercase leading-tight tracking-[0.1em] text-ink-50">
                {t(titleKey)}
              </p>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-400">
                {t(textKey)}
              </p>
              {/* Trazo que avanza al pasar el cursor */}
              <span className="absolute inset-x-7 bottom-0 h-px origin-left scale-x-0 bg-gold-400/50 transition-transform duration-500 ease-smooth group-hover:scale-x-100" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
