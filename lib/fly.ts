// =====================================================================
// Animación "vuela a la bolsa": una copia de la foto del producto viaja
// desde la tarjeta hasta el ícono de la bolsa. Solo es un efecto visual;
// el producto ya se añadió antes de que empiece.
// =====================================================================

export function flyToCart(from: HTMLElement | null): void {
  if (!from || typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  // Hay dos destinos posibles: la bolsa de la barra y la barra inferior del
  // teléfono. Se usa el que esté visible.
  const target = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")].find(
    (el) => el.offsetParent !== null
  );
  if (!target) return;

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = Math.min(a.width, a.height, 140);

  const ghost = from.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${a.left + (a.width - size) / 2}px`,
    top: `${a.top + (a.height - size) / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    margin: "0",
    objectFit: "contain",
    zIndex: "150",
    pointerEvents: "none",
  });
  document.body.appendChild(ghost);

  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);

  const anim = ghost.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 60}px) scale(0.6)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.4 },
    ],
    { duration: 750, easing: "cubic-bezier(0.5, 0, 0.3, 1)" }
  );
  anim.onfinish = () => {
    ghost.remove();
    target.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }],
      { duration: 380, easing: "ease-out" }
    );
  };
}
