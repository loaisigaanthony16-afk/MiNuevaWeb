"use client";

import { useCallback, useRef } from "react";

/**
 * Inclinación 3D que sigue al puntero.
 *
 * Solo responde a mouse o lápiz: en pantallas táctiles el dedo tapa la
 * tarjeta y la inclinación estorbaría al desplazarse, así que ahí se queda
 * quieta y el movimiento lo aportan el revelado y el abanico.
 */
export function useTilt<T extends HTMLElement>(max = 7) {
  const ref = useRef<T>(null);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      if (e.pointerType === "touch") return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.classList.add("is-tilting");
      el.style.setProperty("--ry", `${(x - 0.5) * max * 2}deg`);
      el.style.setProperty("--rx", `${(0.5 - y) * max * 2}deg`);
      el.style.setProperty("--gx", `${x * 100}%`);
      el.style.setProperty("--gy", `${y * 100}%`);
    },
    [max]
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("is-tilting");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}
