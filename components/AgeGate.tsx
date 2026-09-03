"use client";

import { useEffect, useState } from "react";
import SmokeBackdrop from "@/components/SmokeBackdrop";
import Wordmark from "@/components/Wordmark";

const AGE_KEY = "pv18s";

/**
 * Portal de edad: cubre el sitio hasta que la persona confirma ser mayor.
 *
 * Se resuelve tras el montaje para que el HTML del servidor y el del cliente
 * coincidan, y bloquea el scroll del fondo mientras está abierto.
 */
export default function AgeGate() {
  const [resolved, setResolved] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let ok = false;
    try {
      ok =
        window.localStorage.getItem(AGE_KEY) === "1" ||
        document.cookie.includes(`${AGE_KEY}=1`);
    } catch {
      /* noop */
    }
    setAllowed(ok);
    setResolved(true);
  }, []);

  const blocking = resolved && !allowed;

  useEffect(() => {
    if (!blocking) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [blocking]);

  if (!blocking) return null;

  function confirm() {
    try {
      window.localStorage.setItem(AGE_KEY, "1");
      document.cookie = `${AGE_KEY}=1; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch {
      /* noop */
    }
    setAllowed(true);
  }

  return (
    <div className="gate" role="dialog" aria-modal="true" aria-label="Verificación de edad">
      <SmokeBackdrop />
      <div className="pointer-events-none absolute inset-0 aurora" aria-hidden />

      <div className="gate-content container-page max-w-xl text-center">
        <div className="flex justify-center">
          <Wordmark size="lg" />
        </div>

        <div className="gate-line mx-auto mt-9 w-40" />

        <p className="mt-9 text-[11px] font-semibold uppercase tracking-wide3 text-gold-300">
          Solo para adultos
        </p>

        <h1 className="mt-5 font-display text-[clamp(1.9rem,5vw,2.9rem)] font-medium uppercase leading-[1.05] tracking-tightest text-ink-50">
          ¿Sos mayor de 18 años?
        </h1>

        <p className="mx-auto mt-5 max-w-sm text-[14.5px] leading-relaxed text-ink-400">
          Este sitio vende productos de uso adulto. Al entrar confirmás que
          tenés la edad legal en Nicaragua.
        </p>

        {denied ? (
          <div className="mx-auto mt-10 max-w-sm rounded-card border border-white/10 bg-white/[0.03] p-6">
            <p className="text-[14.5px] leading-relaxed text-ink-300">
              Gracias por tu honestidad. No podés continuar.
            </p>
            <button
              onClick={() => setDenied(false)}
              className="mt-4 text-[12px] font-semibold uppercase tracking-wide2 text-ink-500 transition hover:text-ink-200"
            >
              Volver
            </button>
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button onClick={confirm} className="btn-gold w-full sm:w-auto">
              Sí, tengo 18 o más
            </button>
            <button
              onClick={() => setDenied(true)}
              className="btn-ghost w-full sm:w-auto"
            >
              No
            </button>
          </div>
        )}

        <p className="mt-10 text-[11.5px] leading-relaxed text-ink-600">
          Consumo responsable. Prohibida la venta a menores de edad.
        </p>
      </div>
    </div>
  );
}
