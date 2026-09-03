// =====================================================================
// Arte de producto generado por código.
// Cada línea (Melted Diamonds, Live Resin, Hash Rosin, Distillate) tiene
// su propia paleta, y cada formato (cartucho 510 / all-in-one) su propia
// silueta. Así cada producto tiene imagen propia y coherente por categoría
// hasta que existan fotografías reales.
// =====================================================================

export type LineId = "melted" | "live" | "rosin" | "distillate";
export type FormatId = "cart" | "aio";

interface Palette {
  glow: string; // halo de fondo
  body: string; // cuerpo del dispositivo
  bodyDark: string; // sombra del cuerpo
  oil: string; // aceite / ventana
  metal: string; // herrajes
}

export const LINE_PALETTE: Record<LineId, Palette> = {
  melted: {
    glow: "#F2A8CB",
    body: "#F6D9E7",
    bodyDark: "#B3728F",
    oil: "#E48CB4",
    metal: "#EADCE3",
  },
  live: {
    glow: "#C9C2B4",
    body: "#E9ECEF",
    bodyDark: "#6E7780",
    oil: "#B4671F",
    metal: "#DDE2E7",
  },
  rosin: {
    glow: "#6FC8BE",
    body: "#D8F0EC",
    bodyDark: "#4C8880",
    oil: "#7FBFA2",
    metal: "#CFE5E1",
  },
  distillate: {
    glow: "#E4CE97",
    body: "#F6EEDA",
    bodyDark: "#9E8859",
    oil: "#EBCF8B",
    metal: "#EFE6CE",
  },
};

/** Cartucho 510: cuerpo esbelto, ventana de aceite y rosca inferior. */
function cartridgeShape(p: Palette): string {
  return `
  <g transform="translate(300 60)">
    <rect x="-26" y="18" width="52" height="26" rx="9" fill="${p.metal}"/>
    <rect x="-20" y="0" width="40" height="26" rx="12" fill="${p.body}"/>
    <rect x="-44" y="44" width="88" height="330" rx="16" fill="${p.bodyDark}"/>
    <rect x="-40" y="48" width="80" height="322" rx="13" fill="${p.body}"/>
    <rect x="-27" y="66" width="54" height="286" rx="9" fill="${p.oil}" opacity="0.92"/>
    <rect x="-27" y="66" width="18" height="286" rx="9" fill="#FFFFFF" opacity="0.16"/>
    <rect x="-34" y="374" width="68" height="46" rx="8" fill="${p.metal}"/>
    <g opacity="0.55" fill="${p.bodyDark}">
      <rect x="-34" y="384" width="68" height="4"/>
      <rect x="-34" y="394" width="68" height="4"/>
      <rect x="-34" y="404" width="68" height="4"/>
    </g>
    <rect x="-18" y="420" width="36" height="14" rx="4" fill="${p.bodyDark}"/>
  </g>`;
}

/** All-in-one: cuerpo ancho de cerámica con ventana y puerto de carga. */
function aioShape(p: Palette): string {
  return `
  <g transform="translate(300 70)">
    <rect x="-22" y="0" width="44" height="34" rx="15" fill="${p.body}"/>
    <rect x="-78" y="28" width="156" height="386" rx="42" fill="${p.bodyDark}"/>
    <rect x="-73" y="33" width="146" height="376" rx="38" fill="${p.body}"/>
    <rect x="-46" y="74" width="92" height="250" rx="24" fill="${p.oil}" opacity="0.9"/>
    <rect x="-46" y="74" width="30" height="250" rx="20" fill="#FFFFFF" opacity="0.15"/>
    <circle cx="0" cy="356" r="15" fill="${p.metal}" opacity="0.85"/>
    <rect x="-16" y="392" width="32" height="9" rx="4.5" fill="${p.bodyDark}" opacity="0.8"/>
  </g>`;
}

/**
 * Devuelve un data-URI SVG con el dispositivo sobre fondo oscuro.
 * `variant` desplaza el halo para que la galería tenga tomas distintas.
 */
export function productArt(
  line: LineId,
  format: FormatId,
  variant = 0
): string {
  const p = LINE_PALETTE[line];
  const cx = variant === 0 ? 50 : 32;
  const cy = variant === 0 ? 34 : 58;
  const shape = format === "cart" ? cartridgeShape(p) : aioShape(p);

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="560" viewBox="0 0 600 560">`,
    `<defs>`,
    `<radialGradient id="halo" cx="${cx}%" cy="${cy}%" r="62%">`,
    `<stop offset="0%" stop-color="${p.glow}" stop-opacity="0.30"/>`,
    `<stop offset="55%" stop-color="${p.glow}" stop-opacity="0.07"/>`,
    `<stop offset="100%" stop-color="${p.glow}" stop-opacity="0"/>`,
    `</radialGradient>`,
    `<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">`,
    `<stop offset="0%" stop-color="${p.glow}" stop-opacity="0.16"/>`,
    `<stop offset="100%" stop-color="${p.glow}" stop-opacity="0"/>`,
    `</linearGradient>`,
    `</defs>`,
    `<ellipse cx="300" cy="516" rx="132" ry="16" fill="url(#floor)"/>`,
    shape,
    `</svg>`,
  ].join("");

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
