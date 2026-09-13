// =====================================================================
// Reels de la pestaña /reels.
//
// Los videos viven en public/reels (720x1280 con música original) y sus
// portadas en public/reels/portadas. Se generan con el script de
// reels-revision/generador, fuera de la web.
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

const SLUGS: Record<string, string> = {
  "Pineapple Paradise": "pineapple-paradise",
  "Watermelon Moonshine": "watermelon-moonshine",
  "Blue Slushie": "blue-slushie",
  "Bubblegum Burst": "bubblegum-burst",
  "Frozen Pomegranate": "frozen-pomegranate",
  Habibi: "habibi",
  "Dragon Berry Runtz": "dragon-berry-runtz",
  "Galactic Diesel": "galactic-diesel",
  Horchata: "horchata",
  "Black Cherry Gelato": "black-cherry-gelato",
  "Guava Bubblegum": "guava-bubblegum",
  "Unicorn Sherbet": "unicorn-sherbet",
  "Banana Flambé": "banana-flambe",
  "Jelly Dulce": "jelly-dulce",
};

function files(slug: string) {
  return { video: `/reels/${slug}.mp4`, poster: `/reels/portadas/${slug}.jpg` };
}

export const REELS: Reel[] = [
  {
    slug: "todo-el-catalogo",
    title: "Todo el catálogo",
    productId: null,
    strain: null,
    ...files("todo-el-catalogo"),
  },
  ...products
    .filter((p) => SLUGS[p.name])
    .map((p) => ({
      slug: SLUGS[p.name],
      title: p.name,
      productId: p.id,
      strain: p.strain,
      ...files(SLUGS[p.name]),
    })),
];

/** Preguntas de las encuestas; rotan entre reels. */
export const POLLS: [question: string, a: string, b: string][] = [
  ["¿Lo probarías?", "🔥 Sí", "Todavía no"],
  ["¿Dulce o intenso?", "🍬 Dulce", "💨 Intenso"],
  ["¿Para el día o la noche?", "☀️ Día", "🌙 Noche"],
];
