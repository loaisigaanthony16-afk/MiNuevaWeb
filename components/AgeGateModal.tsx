"use client";

import { useEffect, useState } from "react";
import { useUi } from "@/components/ui-context";

const AGE_KEY = "pv18s";

export default function AgeGateModal() {
  const { passAge } = useUi();
  const [resolved, setResolved] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let ok = false;
    try {
      ok =
        window.localStorage.getItem(AGE_KEY) === "1" ||
        document.cookie.includes(`${AGE_KEY}=1`);
    } catch {
      /* noop */
    }
    setAccepted(ok);
    setResolved(true);
  }, []);

  if (!resolved || accepted) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-md sm:inset-x-auto sm:right-6">
      <div className="modal-pop flex items-center gap-4 rounded-card border border-white/12 bg-ink-850/95 p-4 shadow-pop backdrop-blur">
        <p className="flex-1 text-[12.5px] leading-relaxed text-ink-300">
          Solo para mayores de 18 años. Al continuar confirmás que sos mayor de
          edad.
        </p>
        <button
          onClick={() => {
            passAge();
            setAccepted(true);
          }}
          className="shrink-0 rounded-full bg-gold-400 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide2 text-ink-900 transition hover:bg-gold-300 active:scale-95"
        >
          Confirmo 18+
        </button>
      </div>
    </div>
  );
}
