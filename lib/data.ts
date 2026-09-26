// =====================================================================
// Catálogo Vibe 505.
//
// Todos los equipos son de 2000 mg y cuestan lo mismo: $55 de lista con
// $10 de descuento, así que se cobran $45. Nombre, cepa y
// descriptores de sabor salen de lo impreso en cada caja; las fotos son
// recortes de la fotografía del inventario real (public/catalogo).
// =====================================================================

export type Strain = "sativa" | "indica" | "hybrid";
export type BrandId = "muha" | "muhav2" | "packwoods";

export interface Brand {
  id: BrandId;
  name: string;
  /** Nombre corto para el filtro en el teléfono. */
  short: string;
  kicker: string;
  description: string;
}

export interface Product {
  id: number;
  name: string;
  brand: BrandId;
  strain: Strain;
  /** Precio que se cobra, ya con el descuento. */
  price: number;
  /** Precio de lista, para mostrar tachado. */
  listPrice: number;
  flavor: string;
  img: string;
  /** Identificador en la URL de la ficha (/p/slug). */
  slug: string;
}

/** Precio de lista (USD), el que aparece tachado. */
export const LIST_PRICE = 55;
/** Descuento vigente por equipo (USD). */
export const DISCOUNT_USD = 10;
/** Precio que se cobra (USD): lista menos descuento. */
export const UNIT_PRICE = LIST_PRICE - DISCOUNT_USD;

export const STRAIN_LABEL: Record<Strain, string> = {
  sativa: "Energía",
  indica: "Relax",
  hybrid: "Balance",
};

/** Sensación de cada perfil. */
export const STRAIN_EFFECT: Record<Strain, string> = {
  sativa: "Chispa y lucidez",
  indica: "Difuso y relajado",
  hybrid: "Equilibrio eufórico",
};

export const BRANDS: Brand[] = [
  {
    id: "muha",
    name: "Muha Meds",
    short: "Muha",
    kicker: "All-in-one",
    description:
      "Desechable recargable, listo para usar. Cerámica y batería que duran hasta el final.",
  },
  {
    id: "muhav2",
    name: "Muha Meds V2",
    short: "V2",
    kicker: "Dos sabores",
    description: "Edición V2 de 2000 mg con dos sabores en la misma caja.",
  },
  {
    id: "packwoods",
    name: "Packwoods",
    short: "Packwoods",
    kicker: "Desechable",
    description:
      "Sabores intensos de postre y fruta en un equipo compacto.",
  },
];

export function getBrand(id: BrandId): Brand {
  return BRANDS.find((b) => b.id === id) ?? BRANDS[0];
}

// [nombre, archivo de la foto, marca, cepa, sabor]
type Row = [name: string, slug: string, brand: BrandId, strain: Strain, flavor: string];

const ROWS: Row[] = [
  // Muha Meds All-in-one · 2000 mg
  ["Pineapple Paradise", "pineapple-paradise", "muha", "hybrid", "Maduro y cítrico"],
  ["Watermelon Moonshine", "watermelon-moonshine", "muha", "hybrid", "Fresco y jugoso"],
  ["Blue Slushie", "blue-slushie", "muha", "hybrid", "Frutal y helado"],
  ["Bubblegum Burst", "bubblegum-burst", "muha", "sativa", "Frutal y jugoso"],
  ["Frozen Pomegranate", "frozen-pomegranate", "muha", "sativa", "Ácido y helado"],
  ["Habibi", "habibi", "muha", "sativa", "Dulce y floral"],
  ["Dragon Berry Runtz", "dragon-berry-runtz", "muha", "indica", "Maduro y dulce"],
  ["Galactic Diesel", "galactic-diesel", "muha", "indica", "Punzante e intenso"],
  ["Horchata", "horchata", "muha", "indica", "Dulce y cremoso"],

  // Packwoods · 2000 mg
  ["Black Cherry Gelato", "black-cherry-gelato", "packwoods", "hybrid", "Cereza y helado"],
  ["Guava Bubblegum", "guava-bubblegum", "packwoods", "hybrid", "Guayaba y chicle"],
  ["Unicorn Sherbet", "unicorn-sherbet", "packwoods", "indica", "Fresa y kiwi"],
  ["Banana Flambé", "banana-flambe", "packwoods", "indica", "Banano caramelizado"],
  ["Jelly Dulce", "jelly-dulce", "packwoods", "indica", "Uva y jalea"],

  // Muha Meds V2 · 2000 mg, dos sabores por caja. Los sabores salen de
  // los logos impresos; Aqua y Holo no traen logo legible en la foto y van
  // por el color de la caja hasta confirmarlos.
  ["Galactic Diesel + Pineapple Paradise", "v2-galactic-pineapple", "muhav2", "sativa", "Intenso y tropical"],
  ["Runtz + Horchata", "v2-runtz-horchata", "muhav2", "hybrid", "Dulce y cremoso"],
  ["Blue Slushie + Habibi", "v2-blue-slushie-habibi", "muhav2", "indica", "Helado y floral"],
  ["Watermelon Moonshine + Frozen Pomegranate", "v2-watermelon-pomegranate", "muhav2", "hybrid", "Sandía y granada"],
  ["Rainbow Belts Dúo", "v2-rainbow-belts", "muhav2", "hybrid", "Ácido y dulce"],
  ["Dúo V2 Aqua", "v2-aqua", "muhav2", "sativa", "Dos sabores en una caja"],
  ["Dúo V2 Holo", "v2-holo", "muhav2", "hybrid", "Dos sabores en una caja"],
  ["Pineapple Paradise + Bubblegum Burst", "v2-pineapple-bubblegum", "muhav2", "hybrid", "Tropical y chicle"],
];

// Los ids arrancan en 101 para no chocar con bolsas guardadas del
// catálogo anterior.
export const products: Product[] = ROWS.map(([name, slug, brand, strain, flavor], i) => ({
  id: 101 + i,
  name,
  brand,
  strain,
  price: UNIT_PRICE,
  listPrice: LIST_PRICE,
  flavor,
  img: `/catalogo/${slug}.webp`,
  slug,
}));

export function getProduct(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

