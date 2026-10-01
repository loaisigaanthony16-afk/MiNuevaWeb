// =====================================================================
// Reels de la pestaña /reels.
//
// Los videos viven en public/reels (1080x1920, 6 s, con música original)
// y sus portadas en public/reels/portadas. Se generan con
// reels-revision/generador/render_reel_min.py, fuera de la web.
//
// El nombre del archivo es el mismo slug del producto, así que basta con
// anotar qué sabores tienen reel.
// =====================================================================

import { products, type Strain } from "@/lib/data";

export interface Reel {
  slug: string;
  title: string;
  /** Producto que muestra; null en el reel del catálogo completo. */
  productId: number | null;
  strain: Strain | null;
  video: string;
  poster: string;
}

/** Sabores con reel grabado. El resto no aparece en la pestaña. */
const WITH_REEL = new Set([
  "pineapple-paradise",
  "watermelon-moonshine",
  "blue-slushie",
  "bubblegum-burst",
  "dragon-berry-runtz",
  "horchata",
  "black-cherry-gelato",
  "guava-bubblegum",
  "unicorn-sherbet",
  "v2-galactic-pineapple",
  "v2-blue-slushie-habibi",
  "v2-rainbow-belts",
  "v2-jedi-purple-champagne",
  "cookies-freak-brothers",
]);

export const REELS: Reel[] = products
  .filter((p) => WITH_REEL.has(p.slug))
  .map((p) => ({
    slug: p.slug,
    title: p.name,
    productId: p.id,
    strain: p.strain,
    video: `/reels/${p.slug}.mp4`,
    poster: `/reels/portadas/${p.slug}.jpg`,
  }));

/** Preguntas de las encuestas; rotan entre reels. */
export const POLLS: [question: string, a: string, b: string][] = [
  ["¿Lo probarías?", "🔥 Sí", "Todavía no"],
  ["¿Dulce o intenso?", "🍬 Dulce", "💨 Intenso"],
  ["¿Para el día o la noche?", "☀️ Día", "🌙 Noche"],
];
