"use client";

import { KeyRound, MapPin, PackageCheck, ShieldOff } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const STEPS = [
  {
    icon: MapPin,
    title: "Vos ponés la dirección",
    text: "Escribís a dónde enviar y con qué nombre recibís. Puede ser un apodo: no verificamos identidad.",
  },
  {
    icon: ShieldOff,
    title: "No se crea ninguna cuenta",
    text: "Sin registro, sin correo, sin contraseña. Los datos quedan guardados solo en tu navegador.",
  },
  {
    icon: KeyRound,
    title: "Todo viaja en tu código",
    text: "Al confirmar, tu pedido y tu dirección se cifran dentro de un código. Ese código es tuyo.",
  },
  {
    icon: PackageCheck,
    title: "Leemos solo para despachar",
    text: "Cuando nos compartís el código lo abrimos para preparar ese envío. No queda historial ni perfil.",
  },
];

export default function PrivacySection() {
  useReveal([]);

  return (
    <section id="privacidad" className="scroll-mt-[76px] border-t border-white/8 py-24">
      <div className="container-page">
        <div className="reveal max-w-3xl">
          <p className="kicker">Privacidad</p>
          <h2 className="display-lg mt-5 text-ink-50">
            Anónimo, <span className="text-gold-gradient">pero entregable.</span>
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-ink-300">
            Comprar sin dejar rastro y recibir en tu puerta no son cosas
            opuestas. Necesitamos una dirección para llegar, no tu identidad
            para archivarla. Así funciona.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-card border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div
              key={title}
              style={{ transitionDelay: `${i * 80}ms` }}
              className="reveal group bg-ink-900 p-7 transition-colors duration-500 hover:bg-ink-850"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-[18px] w-[18px] text-gold-300" />
                <span className="font-display text-[11px] font-bold tabular-nums tracking-[0.14em] text-ink-600">
                  0{i + 1}
                </span>
              </div>
              <p className="mt-5 font-display text-[13.5px] font-bold uppercase leading-tight tracking-[0.1em] text-ink-50">
                {title}
              </p>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-400">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
