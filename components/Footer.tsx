"use client";

import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { useT } from "@/components/locale-context";
import { useUi } from "@/components/ui-context";
import { scrollToSection } from "@/lib/scroll";

export default function Footer() {
  const t = useT();
  const { browse } = useUi();

  const link =
    "text-[13.5px] text-ink-300 transition-colors hover:text-gold-300";

  return (
    <footer id="contacto" className="border-t border-white/8 pb-20 md:pb-0">
      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
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
              {t("foot.shop")}
            </h3>
            <ul className="mt-5 space-y-3">
              <li>
                <a href="#catalogo" onClick={(e) => { e.preventDefault(); browse({ brand: "all", strain: "all" }); }} className={link}>
                  {t("menu.catalog")}
                </a>
              </li>
              <li>
                <Link href="/reels" className={link}>{t("menu.reels")}</Link>
              </li>
              <li>
                <a href="#como-funciona" onClick={(e) => { e.preventDefault(); scrollToSection("como-funciona"); }} className={link}>
                  {t("foot.anon")}
                </a>
              </li>
              <li>
                <a href="#opiniones" onClick={(e) => { e.preventDefault(); scrollToSection("opiniones"); }} className={link}>
                  {t("foot.opinions")}
                </a>
              </li>
              <li>
                <Link href="/seguir" className={link}>{t("foot.track")}</Link>
              </li>
              <li>
                <Link href="/nosotros" className={link}>{t("foot.about")}</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-[11px] font-bold uppercase tracking-wide3 text-ink-500">
              {t("foot.legalTitle")}
            </h3>
            <ul className="mt-5 space-y-3">
              {[
                { href: "/terms", label: t("foot.terms") },
                { href: "/privacy", label: t("foot.privacy") },
                { href: "/shipping", label: t("foot.shipping") },
                { href: "/refunds", label: t("foot.refunds") },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/8 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11.5px] text-ink-600" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} Vibe 505 · {t("foot.rights")}
          </p>
          <p className="text-[11.5px] text-ink-600">{t("foot.legal")}</p>
        </div>
      </div>
    </footer>
  );
}
