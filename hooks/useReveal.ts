"use client";

import { useEffect } from "react";

/**
 * Revelado al hacer scroll.
 *
 * Marca con `.is-in` todo elemento `.reveal` que entra en pantalla. Usa un
 * comprobador propio ligado al scroll (con rAF) en lugar de
 * IntersectionObserver: son pocos nodos, el coste es mínimo y así el
 * revelado nunca depende de que el observador se dispare.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function revealAll() {
      document
        .querySelectorAll<HTMLElement>(".reveal:not(.is-in)")
        .forEach((n) => n.classList.add("is-in"));
    }

    if (reduced) {
      revealAll();
      return;
    }

    // A partir de aquí el JS controla el revelado, así que ya podemos
    // permitir el estado oculto inicial.
    document.documentElement.classList.add("reveal-ready");

    let frame = 0;

    function check() {
      frame = 0;
      const nodes = document.querySelectorAll<HTMLElement>(".reveal:not(.is-in)");
      if (!nodes.length) return;
      const limit = window.innerHeight * 0.94;
      nodes.forEach((n) => {
        // Basta con haber alcanzado el elemento: lo que ya quedó por encima
        // del viewport también se revela, así nada permanece invisible.
        if (n.getBoundingClientRect().top < limit) n.classList.add("is-in");
      });
    }

    // Comprobación directa: son pocos nodos y así no dependemos de que
    // requestAnimationFrame llegue a ejecutarse.
    function schedule() {
      check();
      if (frame) return;
      frame = window.requestAnimationFrame(check);
    }

    check();
    // Segunda pasada tras el primer pintado (restauración de scroll, fuentes).
    const settle = window.setTimeout(check, 400);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.clearTimeout(settle);
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
