import Wordmark from "@/components/Wordmark";
import { LINES } from "@/lib/data";
import { DELIVERY_ETA } from "@/lib/checkout-util";

export default function Footer() {
  return (
    <footer id="contacto" className="scroll-mt-24 border-t border-white/8">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-xs text-[13.5px] leading-relaxed text-ink-400">
              Extractos premium con entrega nacional y pedido anónimo. Para uso
              adulto responsable.
            </p>
            <span className="mt-6 inline-flex items-center rounded-full border border-white/12 px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wide2 text-ink-400">
              Solo mayores de 18
            </span>
          </div>

          <div>
            <h3 className="font-display text-[11px] font-bold uppercase tracking-wide3 text-ink-500">
              Líneas
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
              Información
            </h3>
            <ul className="mt-5 space-y-3">
              {[
                { label: "Cómo funciona el anonimato", href: "#privacidad" },
                { label: "Preguntas frecuentes", href: "#faq" },
                { label: "Envío y cobertura", href: "#faq" },
                { label: "Términos y condiciones", href: "#" },
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
            &copy; {new Date().getFullYear()} Vibe 505 · Envío nacional en {DELIVERY_ETA}
          </p>
          <p className="text-[11.5px] text-ink-600">
            Venta prohibida a menores de edad. Consumo responsable.
          </p>
        </div>
      </div>
    </footer>
  );
}
