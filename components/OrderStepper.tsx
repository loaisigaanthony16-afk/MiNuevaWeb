"use client";

import { Check } from "lucide-react";
import { FULFILLMENT_LABEL, FULFILLMENT_STEPS, stepIndex, type Fulfillment } from "@/lib/fulfillment";

/** Recibido → Preparando → En camino → Entregado, con el paso actual resaltado. */
export default function OrderStepper({ current, compact = false }: { current: Fulfillment; compact?: boolean }) {
  const idx = stepIndex(current);
  return (
    <ol className={`flex items-start ${compact ? "gap-1" : "gap-2"}`} aria-label="Estado del pedido">
      {FULFILLMENT_STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <li key={s} className="flex min-w-0 flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={`h-px flex-1 transition-colors duration-700 ${i === 0 ? "opacity-0" : done || active ? "bg-gold-400" : "bg-white/10"}`} />
              <span
                className={`grid shrink-0 place-items-center rounded-full border transition-all duration-500 ${
                  compact ? "h-5 w-5" : "h-7 w-7"
                } ${
                  done
                    ? "border-gold-400 bg-gold-400 text-ink-900"
                    : active
                      ? "step-active border-gold-400 bg-ink-900 text-gold-300"
                      : "border-white/15 bg-ink-900 text-ink-600"
                }`}
              >
                {done ? <Check className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={3} /> : <span className={`rounded-full bg-current ${compact ? "h-1.5 w-1.5" : "h-2 w-2"}`} />}
              </span>
              <span className={`h-px flex-1 transition-colors duration-700 ${i === FULFILLMENT_STEPS.length - 1 ? "opacity-0" : done ? "bg-gold-400" : "bg-white/10"}`} />
            </div>
            <span
              className={`mt-1.5 truncate ${compact ? "text-[9.5px]" : "text-[10.5px]"} font-semibold uppercase tracking-[0.08em] ${
                active ? "text-gold-300" : done ? "text-ink-200" : "text-ink-600"
              }`}
            >
              {FULFILLMENT_LABEL[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
