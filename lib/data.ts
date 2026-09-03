// =====================================================================
// Catálogo Vibe 505.
// Dos formatos (cartucho 510 y all-in-one) por cuatro líneas de extracto.
// Envío nacional en Nicaragua, pedido anónimo.
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
  thc: number;
  price: number;
  flavor: string;
  effect: string;
  img: string;
  imgs: string[];
}

// Etiqueta neutral que ve la pasarela de pago.
export const DEFAULT_ITEM_LABEL = "Suministro Estándar";

export const STRAIN_LABEL: Record<Strain, string> = {
  sativa: "Sativa",
  indica: "Indica",
  hybrid: "Híbrida",
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

// --- Definición compacta del catálogo -------------------------------
type Row = [
  name: string,
  line: LineId,
  format: FormatId,
  strain: Strain,
  thc: number,
  price: number,
  flavor: string,
  effect: string
];

const ROWS: Row[] = [
  // ---- ALL-IN-ONE · Melted Diamonds ----
  ["Durban Delight", "melted", "aio", "sativa", 88, 42, "Cítrico y anís", "Energía limpia y sostenida"],
  ["Grape Gas", "melted", "aio", "indica", 90, 42, "Uva morada y combustible", "Relajación densa de noche"],
  ["Lemon Cherry Gelato", "melted", "aio", "sativa", 87, 42, "Limón, cereza y crema", "Ánimo arriba y sociable"],
  ["Mango Madness", "melted", "aio", "hybrid", 86, 42, "Mango maduro", "Equilibrio alegre"],
  ["Orange Tangie", "melted", "aio", "hybrid", 85, 42, "Naranja tangerina", "Claridad con cuerpo suelto"],

  // ---- ALL-IN-ONE · Live Resin ----
  ["Golden Papaya", "live", "aio", "hybrid", 84, 38, "Papaya y miel", "Calma luminosa"],
  ["Grape Dosi", "live", "aio", "hybrid", 85, 38, "Uva y galleta", "Cuerpo pesado, mente clara"],
  ["Juice Man", "live", "aio", "sativa", 83, 38, "Jugo tropical", "Chispa creativa"],
  ["Lemon Kush Mintz", "live", "aio", "indica", 86, 38, "Limón y menta", "Descanso profundo"],
  ["OG Kush", "live", "aio", "indica", 87, 38, "Pino y tierra", "El clásico de siempre"],

  // ---- ALL-IN-ONE · Hash Rosin ----
  ["Donnie Burger", "rosin", "aio", "hybrid", 82, 48, "Especias y gas", "Potente y envolvente"],
  ["Fatso", "rosin", "aio", "indica", 84, 48, "Nuez tostada", "Sedante de fin de día"],
  ["Garlic Jelly", "rosin", "aio", "indica", 83, 48, "Salado y dulce", "Cuerpo pesado, mente en paz"],
  ["Mimosa", "rosin", "aio", "sativa", 81, 48, "Cítrico burbujeante", "Arranque brillante"],
  ["Tropicana Cherry", "rosin", "aio", "sativa", 82, 48, "Cereza y naranja", "Euforia luminosa"],

  // ---- ALL-IN-ONE · Distillate ----
  ["Blue Slushie", "distillate", "aio", "hybrid", 92, 32, "Frutos azules helados", "Equilibrio refrescante"],
  ["Blueberry Cookies", "distillate", "aio", "indica", 93, 32, "Arándano y galleta", "Relajación dulce"],
  ["Bubblegum Burst", "distillate", "aio", "indica", 92, 32, "Chicle de fresa", "Calma juguetona"],
  ["Frozen Pomegranate", "distillate", "aio", "sativa", 91, 32, "Granada helada", "Energía nítida"],
  ["Galactic Diesel", "distillate", "aio", "indica", 94, 32, "Diesel y pino", "Aterrizaje profundo"],

  // ---- CARTUCHOS 510 · Melted Diamonds ----
  ["Lemonade Rose", "melted", "cart", "sativa", 88, 35, "Limonada floral", "Ligereza y foco"],
  ["Moroccan Peach Rings", "melted", "cart", "hybrid", 87, 35, "Durazno en almíbar", "Dulce y equilibrada"],
  ["Purple Breath", "melted", "cart", "indica", 89, 35, "Uva y lavanda", "Respiro profundo"],
  ["Toro Milk Runtz", "melted", "cart", "indica", 90, 35, "Leche y caramelo", "Manta pesada"],
  ["White Raspberry", "melted", "cart", "hybrid", 86, 35, "Frambuesa y crema", "Suave de principio a fin"],

  // ---- CARTUCHOS 510 · Distillate ----
  ["Bahama Berry", "distillate", "cart", "sativa", 91, 26, "Bayas tropicales", "Chispa de mediodía"],
  ["Banana Cream Cake", "distillate", "cart", "indica", 92, 26, "Banano y bizcocho", "Postre de noche"],
  ["Cherry Grapefruit", "distillate", "cart", "sativa", 90, 26, "Cereza y toronja", "Ácida y despierta"],
  ["God Father OG", "distillate", "cart", "indica", 94, 28, "Uva y tierra húmeda", "La más contundente"],
  ["Green Crack", "distillate", "cart", "sativa", 91, 26, "Mango verde", "Motor de la mañana"],
  ["Pineapple Paradise", "distillate", "cart", "hybrid", 90, 26, "Piña asada", "Vacaciones portátiles"],
  ["Purple Passion Punch", "distillate", "cart", "indica", 92, 26, "Frutos morados", "Descenso suave"],
  ["Strawberry Kiwi Krush", "distillate", "cart", "hybrid", 90, 26, "Fresa y kiwi", "Fresca y pareja"],
];

export const products: Product[] = ROWS.map((r, i) => {
  const [name, line, format, strain, thc, price, flavor, effect] = r;
  return {
    id: i + 1,
    name,
    line,
    format,
    strain,
    thc,
    price,
    flavor,
    effect,
    img: productArt(line, format, 0),
    imgs: [productArt(line, format, 0), productArt(line, format, 1)],
  };
});

export function getProduct(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}

/** Cuenta de productos por línea dentro de un formato (para el índice). */
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
