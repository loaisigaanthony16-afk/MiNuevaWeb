// =====================================================================
// Desplazamiento a secciones, descontando la barra fija.
//
// La barra superior tiene dos filas y la de categorías se esconde al bajar.
// Por eso el descuento depende de la dirección: al bajar solo queda la fila
// principal; al subir, reaparecen las dos. La barra publica ambas alturas
// como variables CSS en <html>.
// =====================================================================

function cssPx(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function scrollToSection(id: string): void {
  if (id === "top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;

  const target = el.getBoundingClientRect().top + window.scrollY;
  const goingDown = target > window.scrollY;
  const offset = goingDown
    ? cssPx("--nav-min", 77)
    : cssPx("--nav-full", 123);

  window.scrollTo({ top: Math.max(0, target - offset + 1), behavior: "smooth" });
}
