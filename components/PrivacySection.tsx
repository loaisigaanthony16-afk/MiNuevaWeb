"use client";

import { useReveal } from "@/hooks/useReveal";

const STEPS = [
  ["Ponés tu dirección", "Un apodo basta. No verificamos identidad."],
  ["No se crea cuenta", "Sin registro, sin correo, sin contraseña."],
  ["Se cifra en tu código", "Pedido y dirección quedan dentro de él."],
  ["Se abre para despachar", "Nada queda guardado después."],
];

export default function PrivacySection() {
  useReveal([]);

  return (
    <section id="privacidad" className="scroll-mt-[76px] border-t border-white/8 py-24">
      <div className="container-page">
        <div className="reveal max-w-2xl">
          <p className="kicker">
            <span className="h-px w-8 bg-gold-400/60" />
            Privacidad
          </p>
          <h2 className="display-lg mt-5 text-ink-50">
            Anónimo, <span className="text-gold-gradient">pero entregable.</span>
          </h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-ink-400">
            Necesitamos una dirección para llegar, no tu identidad para
            guardarla.
          </p>
        </div>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-card border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, text], i) => (
            <li
              key={title}
              style={{ transitionDelay: `${i * 90}ms` }}
              className="reveal group relative bg-ink-900 p-7 transition-colors duration-500 hover:bg-ink-850"
            >
              <span className="font-display text-[11px] font-bold tabular-nums tracking-[0.2em] text-gold-400/70">
                0{i + 1}
              </span>
              <p className="mt-5 font-display text-[13.5px] font-semibold uppercase leading-tight tracking-[0.1em] text-ink-50">
                {title}
              </p>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-400">
                {text}
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
