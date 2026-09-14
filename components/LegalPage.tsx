import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LEGAL } from "@/lib/legal";

export interface LegalSection {
  title: string;
  /** Párrafos; cada elemento es un párrafo o una lista. */
  body: (string | string[])[];
}

const LINKS = [
  { href: "/terms", label: "Términos" },
  { href: "/privacy", label: "Privacidad" },
  { href: "/shipping", label: "Entregas" },
  { href: "/refunds", label: "Reembolsos" },
];

/** Plantilla común de las páginas legales: lectura cómoda en modo oscuro. */
export default function LegalPage({
  path,
  kicker,
  title,
  intro,
  sections,
}: {
  path: string;
  kicker: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main id="top">
      <Navbar />
      <article className="container-page max-w-3xl pb-24 pt-14 sm:pt-20">
        <p className="kicker">
          <span className="h-px w-8 bg-gold-400/60" />
          {kicker}
        </p>
        <h1 className="display-lg mt-5 text-ink-50">{title}</h1>
        <p className="mt-5 text-[15.5px] leading-relaxed text-ink-300">{intro}</p>
        <p className="mt-3 text-[12.5px] text-ink-500">Última actualización: {LEGAL.updated}</p>

        <nav aria-label="Documentos legales" className="mt-8 flex flex-wrap gap-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={l.href === path ? "page" : undefined}
              className={`filter-pill ${l.href === path ? "filter-pill-active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mt-12 space-y-10">
          {sections.map((s, i) => (
            <section key={s.title} className="border-t border-[#262626] pt-8">
              <h2 className="font-display text-[18px] font-semibold uppercase tracking-[0.06em] text-ink-50">
                <span className="mr-3 font-mono text-[13px] text-gold-300">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <div className="mt-4 space-y-3 text-[14.5px] leading-relaxed text-ink-300">
                {s.body.map((p, k) =>
                  Array.isArray(p) ? (
                    <ul key={k} className="list-disc space-y-1.5 pl-5 marker:text-gold-400">
                      {p.map((li) => (
                        <li key={li}>{li}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={k}>{p}</p>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-[#262626] bg-white/[0.02] p-6">
          <p className="font-display text-[14px] font-semibold uppercase tracking-[0.08em] text-ink-50">¿Dudas sobre este documento?</p>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-400">
            Escribinos por WhatsApp al{" "}
            <a href={LEGAL.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-gold-300 underline-offset-4 hover:underline">
              {LEGAL.whatsappDisplay}
            </a>
            .
          </p>
        </div>
      </article>
      <Footer />
    </main>
  );
}
