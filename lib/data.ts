// =====================================================================
// Catálogo Vibe 505.
//
// Los all-in-one usan fotografía real de producto y sus datos salen del
// empaque: línea, cepa, gramaje y los dos descriptores de sabor impresos.
// Los cartuchos 510 aún no tienen fotografía y usan arte generado.
// =====================================================================

import { productArt, type FormatId, type LineId } from "@/lib/catalog-art";

export type Strain = "sativa" | "indica" | "hybrid";
export type { FormatId, LineId };

export interface ProductLine {
  id: LineId;
  name: string;
  tagline: string;
  description: string;
}

export interface CatalogFormat {
  id: FormatId;
  name: string;
  kicker: string;
  description: string;
}

export interface Product {
  id: number;
  name: string;
  line: LineId;
  format: FormatId;
  strain: Strain;
  price: number;
  flavor: string;
  /** Gramaje impreso en el empaque. Solo donde lo conocemos. */
  weight?: string;
  img: string;
  imgs: string[];
  /** true cuando la imagen es fotografía real de producto. */
  photo: boolean;
}

// Etiqueta neutral que ve la pasarela de pago.
export const DEFAULT_ITEM_LABEL = "Suministro Estándar";

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

export const FORMATS: CatalogFormat[] = [
  {
    id: "aio",
    name: "All-in-one",
    kicker: "Desechable, bien hecho",
    description:
      "Cerámica sin poste, batería recargable y aceite premium. Todo lo que necesitás y nada de lo que no. Listo para usar y construido para durar hasta la última calada.",
  },
  {
    id: "cart",
    name: "Cartuchos 510",
    kicker: "Rosca universal",
    description:
      "Compatibles con cualquier batería de rosca 510. Vidrio y cerámica en toda la ruta de vapor, sin plástico ni metales de relleno.",
  },
];

export const LINES: ProductLine[] = [
  {
    id: "melted",
    name: "Melted Diamonds",
    tagline: "Espectro completo",
    description:
      "Elaborado con equipo de última generación a partir de flor congelada en fresco, preservando el espectro completo de cannabinoides y terpenos para una calada suave y con mucho sabor.",
  },
  {
    id: "live",
    name: "Live Resin",
    tagline: "Terpenos vivos",
    description:
      "Extracción en fresco que captura el perfil aromático de la planta viva. Aceite denso, sabor fiel a la cepa y efecto redondo.",
  },
  {
    id: "rosin",
    name: "Hash Rosin",
    tagline: "Sin solventes",
    description:
      "Prensado solo con calor y presión, sin solventes de ningún tipo. Nuestra línea más limpia y la más buscada por paladares exigentes.",
  },
  {
    id: "distillate",
    name: "Distillate",
    tagline: "Potencia depurada",
    description:
      "Destilado premium formulado para una experiencia elevada y consistente. Los terpenos derivados de cannabis redondean el aroma y el sabor.",
  },
];

export function getLine(id: LineId): ProductLine {
  return LINES.find((l) => l.id === id) ?? LINES[0];
}

export function getFormat(id: FormatId): CatalogFormat {
  return FORMATS.find((f) => f.id === id) ?? FORMATS[0];
}

// --- All-in-one: producto real ---------------------------------------
// [nombre, slug de la foto, línea, cepa, gramaje, sabor del empaque]
type PhotoRow = [
  name: string,
  slug: string,
  line: LineId,
  strain: Strain,
  weight: string,
  flavor: string
];

const AIO_ROWS: PhotoRow[] = [
  // Melted Diamonds · 1000 mg
  ["Grape Gas", "grape-gas", "melted", "indica", "1000 mg", "Jugoso y terroso"],
  ["Lemon Cherry Gelato", "lemon-cherry-gelato", "melted", "sativa", "1000 mg", "Dulce y cítrico"],
  ["Mango Madness", "mango-madness", "melted", "hybrid", "1000 mg", "Frutal y jugoso"],
  ["Orange Tangie", "orange-tangie", "melted", "hybrid", "1000 mg", "Dulce y ácido"],

  // Live Resin · 1000 mg
  ["Golden Papaya", "golden-papaya", "live", "hybrid", "1000 mg", "Suave y cremoso"],
  ["Grape Dosi", "grape-dosi", "live", "hybrid", "1000 mg", "Frutal y dulce"],
  ["Juice Man", "juice-man", "live", "sativa", "1000 mg", "Jugoso y frutal"],
  ["Lemon Kush Mintz", "lemon-kush-mintz", "live", "indica", "1000 mg", "Cítrico y helado"],
  ["OG Kush", "og-kush", "live", "indica", "1000 mg", "Terroso y profundo"],

  // Hash Rosin · 500 mg
  ["Donnie Burger", "donnie-burger", "rosin", "hybrid", "500 mg", "Terroso y salado"],
  ["Fatso", "fatso", "rosin", "indica", "500 mg", "Suave y terroso"],
  ["Garlic Jelly", "garlic-jelly", "rosin", "indica", "500 mg", "Punzante y dulce"],
  ["Mimosa", "mimosa", "rosin", "sativa", "500 mg", "Refrescante y cítrico"],
  ["Tropicana Cherry", "tropicana-cherry", "rosin", "sativa", "500 mg", "Frutal y ácido"],

  // Distillate · 1000 mg
  ["Blue Slushie", "blue-slushie", "distillate", "hybrid", "1000 mg", "Frutal y helado"],
  ["Blueberry Cookies", "blueberry-cookies", "distillate", "indica", "1000 mg", "Jugoso y tostado"],
  ["Bubblegum Burst", "bubblegum-burst", "distillate", "indica", "1000 mg", "Frutal y jugoso"],
  ["Frozen Pomegranate", "frozen-pomegranate", "distillate", "sativa", "1000 mg", "Ácido y helado"],
  ["Galactic Diesel", "galactic-diesel", "distillate", "indica", "1000 mg", "Punzante e intenso"],
  ["Magic Melon Og", "magic-melon-og", "distillate", "hybrid", "1000 mg", "Floral y dulce"],
  ["Pineapple Express", "pineapple-express", "distillate", "sativa", "1000 mg", "Maduro y cítrico"],
];

// Precio por línea (USD).
const LINE_PRICE: Record<LineId, number> = {
  melted: 42,
  live: 38,
  rosin: 48,
  distillate: 32,
};

// --- Cartuchos 510: aún sin fotografía --------------------------------
type CartRow = [name: string, line: LineId, strain: Strain, flavor: string];

const CART_ROWS: CartRow[] = [
  ["Lemonade Rose", "melted", "sativa", "Limonada floral"],
  ["Moroccan Peach Rings", "melted", "hybrid", "Durazno en almíbar"],
  ["Purple Breath", "melted", "indica", "Uva y lavanda"],
  ["Toro Milk Runtz", "melted", "indica", "Leche y caramelo"],
  ["White Raspberry", "melted", "hybrid", "Frambuesa y crema"],
  ["Bahama Berry", "distillate", "sativa", "Bayas tropicales"],
  ["Banana Cream Cake", "distillate", "indica", "Banano y bizcocho"],
  ["Cherry Grapefruit", "distillate", "sativa", "Cereza y toronja"],
  ["God Father OG", "distillate", "indica", "Uva y tierra húmeda"],
  ["Green Crack", "distillate", "sativa", "Mango verde"],
  ["Pineapple Paradise", "distillate", "hybrid", "Piña asada"],
  ["Purple Passion Punch", "distillate", "indica", "Frutos morados"],
  ["Strawberry Kiwi Krush", "distillate", "hybrid", "Fresa y kiwi"],
];

const CART_PRICE: Record<LineId, number> = {
  melted: 35,
  live: 32,
  rosin: 40,
  distillate: 26,
};

let nextId = 1;

const aioProducts: Product[] = AIO_ROWS.map(
  ([name, slug, line, strain, weight, flavor]) => ({
    id: nextId++,
    name,
    line,
    format: "aio" as FormatId,
    strain,
    price: LINE_PRICE[line],
    flavor,
    weight,
    img: `/productos/${slug}.webp`,
    imgs: [`/productos/${slug}.webp`],
    photo: true,
  })
);

const cartProducts: Product[] = CART_ROWS.map(([name, line, strain, flavor]) => ({
  id: nextId++,
  name,
  line,
  format: "cart" as FormatId,
  strain,
  price: CART_PRICE[line],
  flavor,
  img: productArt(line, "cart", 0),
  imgs: [productArt(line, "cart", 0), productArt(line, "cart", 1)],
  photo: false,
}));

export const products: Product[] = [...aioProducts, ...cartProducts];

export function getProduct(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}

/** Cuenta de productos por línea dentro de un formato. */
export function countByLine(format: FormatId): { line: ProductLine; total: number }[] {
  return LINES.map((line) => ({
    line,
    total: products.filter((p) => p.format === format && p.line === line.id).length,
  })).filter((entry) => entry.total > 0);
}

export const FAQ = [
  {
    q: "¿Cómo funciona el pedido anónimo?",
    a: "No creás cuenta ni dejás tu nombre real. Tus datos de entrega se guardan solo en tu dispositivo y se convierten en un código de pedido cifrado. Ese código es lo único que compartís con nosotros para despachar.",
  },
  {
    q: "Si es anónimo, ¿cómo saben a dónde enviar?",
    a: "Tu código lleva adentro la dirección y el contacto que vos elegiste dar, cifrados. Al confirmarlo lo leemos únicamente para coordinar esa entrega y no queda asociado a ningún perfil ni historial.",
  },
  {
    q: "¿Hacen envíos a todo el país?",
    a: "Sí, cubrimos todo el territorio nacional de Nicaragua con una sola tarifa. El envío es gratis a partir de $60.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Tarjeta por pasarela segura, transferencia bancaria o efectivo contra entrega. En el estado de cuenta aparece un nombre neutral.",
  },
  {
    q: "¿El empaque es discreto?",
    a: "Siempre. Empaque neutro, opaco y sellado, sin marcas ni referencias al contenido por fuera.",
  },
  {
    q: "¿Cuál es la edad mínima?",
    a: "Debés ser mayor de 18 años. No vendemos a menores de edad bajo ninguna circunstancia.",
  },
];
