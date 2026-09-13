// =====================================================================
// Catálogo Vibe 505.
//
// Todos los equipos son de 2000 mg y cuestan lo mismo: $60 de lista con
// $5 de descuento, así que se cobran $55. Nombre, cepa y
// descriptores de sabor salen de lo impreso en cada caja; las fotos son
// recortes de la fotografía del inventario real (public/catalogo).
// =====================================================================

export type Strain = "sativa" | "indica" | "hybrid";
export type BrandId = "muha" | "packwoods";

export interface Brand {
  id: BrandId;
  name: string;
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
  weight: string;
  img: string;
}

/** Precio de lista (USD), el que aparece tachado. */
export const LIST_PRICE = 60;
/** Descuento vigente por equipo (USD). */
export const DISCOUNT_USD = 5;
/** Precio que se cobra (USD): lista menos descuento. */
export const UNIT_PRICE = LIST_PRICE - DISCOUNT_USD;

export const STRAIN_LABEL: Record<Strain, string> = {
  sativa: "Sativa",
  indica: "Indica",
  hybrid: "Híbrida",
};

/** Efecto según cepa, tal como lo describe el empaque. */
export const STRAIN_EFFECT: Record<Strain, string> = {
  sativa: "Chispa y lucidez",
  indica: "Difuso y relajado",
  hybrid: "Equilibrio eufórico",
};

export const BRANDS: Brand[] = [
  {
    id: "muha",
    name: "Muha Meds",
    kicker: "All-in-one · 2000 mg",
    description:
      "Desechable recargable, listo para usar. Cerámica y batería que duran hasta la última calada.",
  },
  {
    id: "packwoods",
    name: "Packwoods",
    kicker: "Desechable · 2000 mg",
    description:
      "Sabores intensos de postre y fruta en un equipo compacto de 2 gramos.",
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
  weight: "2000 mg",
  img: `/catalogo/${slug}.webp`,
}));

export function getProduct(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}
