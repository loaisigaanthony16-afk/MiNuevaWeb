"use client";

import { useSyncExternalStore } from "react";
import { Timer } from "lucide-react";
import { useT } from "@/components/locale-context";

// Ventana de la promoción. Al llegar a cero vuelve a empezar, así el
// descuento sigue disponible y el reloj nunca queda en 00:00.
const WINDOW_MS = 20 * 60 * 1000;
const START_KEY = "vibePromoStart";

// Un solo reloj para toda la página: todas las etiquetas marcan lo mismo
// y hay un único intervalo aunque haya decenas de tarjetas.
let start = 0;
let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function readStart(): number {
  try {
    const saved = Number(window.localStorage.getItem(START_KEY));
    if (saved > 0) return saved;
    const fresh = Date.now();
    window.localStorage.setItem(START_KEY, String(fresh));
    return fresh;
  } catch {
    return Date.now();
  }
}

function subscribe(listener: () => void) {
  if (!start) start = readStart();
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function remaining(): number {
  if (!start) return WINDOW_MS;
  const elapsed = Math.max(0, (now || Date.now()) - start);
  return WINDOW_MS - (elapsed % WINDOW_MS);
}

function format(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function usePromoClock(): string {
  const ms = useSyncExternalStore(
    subscribe,
    // Redondeado al segundo para que React no re-renderice de más.
    () => Math.ceil(remaining() / 1000) * 1000,
    () => WINDOW_MS
  );
  return format(ms);
}

/** Precio con descuento: final en blanco, lista tachada y "-$5" en rojo con reloj. */
export default function PriceTag({
  price,
  listPrice,
  size = "sm",
}: {
  price: number;
  listPrice: number;
  size?: "sm" | "lg";
}) {
  const t = useT();
  const clock = usePromoClock();
  const off = listPrice - price;
  const lg = size === "lg";

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span
          className={`font-display font-bold leading-none tabular-nums text-ink-50 ${
            lg ? "text-[34px]" : "text-[21px]"
          }`}
        >
          ${price}
        </span>
        <span
          className={`tabular-nums text-ink-500 line-through decoration-red-500/70 ${
            lg ? "text-[16px]" : "text-[12px]"
          }`}
        >
          ${listPrice}
        </span>
      </div>

      <span
        className={`promo-tag mt-2 inline-flex items-center whitespace-nowrap rounded-full font-semibold tabular-nums ${
          lg ? "gap-2 px-3 py-1.5 text-[12.5px]" : "gap-1.5 px-2 py-[3px] text-[10.5px]"
        }`}
        aria-label={`-$${off} · ${t("promo.label")} ${t("promo.only")} ${clock}`}
      >
        <span className="promo-off font-bold">-${off}</span>
        {lg && (
          <span className="uppercase tracking-[0.08em] text-red-200/80">
            {t("promo.label")} {t("promo.only")}
          </span>
        )}
        <span className="flex items-center gap-1 text-red-100">
          <Timer className={`promo-clock ${lg ? "h-4 w-4" : "h-3.5 w-3.5"}`} />
          <span className="font-mono">{clock}</span>
        </span>
      </span>
    </div>
  );
}
