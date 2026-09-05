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

/**
 * Cartucho 510.
 *
 * Boquilla de cerámica, cuerpo de vidrio con el aceite visible, base de
 * acero y rosca. Se dibuja a la misma escala y encuadre que las fotos de
 * producto, para que ambos convivan sin que se note el salto.
 */
function cartridgeShape(p: Palette): string {
  return `
  <g transform="translate(300 44)">
    <!-- Boquilla -->
    <path d="M-17 0 h34 a7 7 0 0 1 7 7 v34 a7 7 0 0 1 -7 7 h-34 a7 7 0 0 1 -7 -7 v-34 a7 7 0 0 1 7 -7 z" fill="${p.body}"/>
    <rect x="-24" y="34" width="48" height="9" rx="4" fill="${p.metal}"/>

    <!-- Cuerpo de vidrio -->
    <rect x="-38" y="43" width="76" height="300" rx="10" fill="${p.bodyDark}" opacity="0.5"/>
    <rect x="-35" y="46" width="70" height="294" rx="8" fill="${p.body}" opacity="0.28"/>

    <!-- Aceite -->
    <rect x="-25" y="60" width="50" height="268" rx="6" fill="${p.oil}" opacity="0.95"/>
    <rect x="-25" y="60" width="15" height="268" rx="6" fill="#FFFFFF" opacity="0.18"/>
    <rect x="12" y="60" width="8" height="268" rx="4" fill="#000000" opacity="0.12"/>

    <!-- Núcleo de cerámica -->
    <rect x="-6" y="300" width="12" height="40" rx="4" fill="${p.metal}" opacity="0.7"/>

    <!-- Base de acero -->
    <path d="M-34 343 h68 v34 a10 10 0 0 1 -10 10 h-48 a10 10 0 0 1 -10 -10 z" fill="${p.metal}"/>
    <g opacity="0.35" fill="${p.bodyDark}">
      <rect x="-34" y="352" width="68" height="3"/>
      <rect x="-34" y="361" width="68" height="3"/>
      <rect x="-34" y="370" width="68" height="3"/>
    </g>

    <!-- Rosca 510 -->
    <rect x="-15" y="387" width="30" height="16" rx="3" fill="${p.bodyDark}" opacity="0.85"/>
    <rect x="-9" y="403" width="18" height="6" rx="3" fill="${p.metal}" opacity="0.6"/>
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
