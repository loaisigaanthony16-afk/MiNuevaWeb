"use client";

import Wordmark from "@/components/Wordmark";
import { useT } from "@/components/locale-context";
import { useUi } from "@/components/ui-context";
import { BRANDS } from "@/lib/data";
import { scrollToSection } from "@/lib/scroll";

export default function Footer() {
  const t = useT();
  const { browse } = useUi();

  const link =
    "text-[13.5px] text-ink-300 transition-colors hover:text-gold-300";

  return (
    <footer id="contacto" className="border-t border-white/8 pb-20 md:pb-0">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-xs text-[13.5px] leading-relaxed text-ink-400">
              {t("foot.tagline")}
            </p>
            <span className="mt-6 inline-flex items-center rounded-full border border-white/12 px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wide2 text-ink-400">
              {t("foot.adults")}
            </span>
          </div>

          <div>
            <h3 className="font-display text-[11px] font-bold uppercase tracking-wide3 text-ink-500">
              {t("foot.brands")}
            </h3>
            <ul className="mt-5 space-y-3">
              {BRANDS.map((b) => (
                <li key={b.id}>
                  <button onClick={() => browse({ brand: b.id, strain: "all" })} className={link}>
                    {b.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-[11px] font-bold uppercase tracking-wide3 text-ink-500">
              {t("foot.info")}
            </h3>
            <ul className="mt-5 space-y-3">
              <li>
                <button onClick={() => scrollToSection("como-funciona")} className={link}>
                  {t("foot.anon")}
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection("opiniones")} className={link}>
                  {t("foot.opinions")}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/8 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11.5px] text-ink-600">
            &copy; {new Date().getFullYear()} Vibe 505 · {t("foot.rights")}
          </p>
          <p className="text-[11.5px] text-ink-600">{t("foot.legal")}</p>
        </div>
      </div>
    </footer>
  );
}
