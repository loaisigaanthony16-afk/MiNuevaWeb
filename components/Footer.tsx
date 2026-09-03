"use client";

import Wordmark from "@/components/Wordmark";
import { useT } from "@/components/locale-context";
import { LINES } from "@/lib/data";
import { DELIVERY_ETA } from "@/lib/checkout-util";

export default function Footer() {
  const t = useT();
  return (
    <footer id="contacto" className="scroll-mt-24 border-t border-white/8">
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
              {t("foot.lines")}
            </h3>
            <ul className="mt-5 space-y-3">
              {LINES.map((l) => (
                <li key={l.id}>
                  <a
                    href="#catalogo"
                    className="text-[13.5px] text-ink-300 transition-colors hover:text-gold-300"
                  >
                    {l.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-[11px] font-bold uppercase tracking-wide3 text-ink-500">
              {t("foot.info")}
            </h3>
            <ul className="mt-5 space-y-3">
              {[
                { label: t("foot.anon"), href: "#privacidad" },
                { label: t("foot.faq"), href: "#faq" },
                { label: t("foot.shipping"), href: "#faq" },
                { label: t("foot.terms"), href: "#" },
              ].map((it) => (
                <li key={it.label}>
                  <a
                    href={it.href}
                    className="text-[13.5px] text-ink-300 transition-colors hover:text-gold-300"
                  >
                    {it.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/8 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11.5px] text-ink-600">
            &copy; {new Date().getFullYear()} Vibe 505 · {t("foot.rights")} {DELIVERY_ETA}
          </p>
          <p className="text-[11.5px] text-ink-600">
            {t("foot.legal")}
          </p>
        </div>
      </div>
    </footer>
  );
}
