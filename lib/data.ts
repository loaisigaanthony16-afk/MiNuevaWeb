export type Strain = "indica" | "sativa" | "hibrida";
export type Format = "cartucho" | "desechable";

export interface Product {
  id: number;
  strain: Strain;
  format: Format;
  price: number;
}

export interface ProductMeta {
  id: number;
  name: string;
  thc: number;
  effects: string;
  terpenes: string;
  unit: string;
  img: string;
}

// Nombre genérico y neutral que se expone en el flujo de pago
// (no se revelan nombres delicados hacia la pasarela).
export const DEFAULT_ITEM_LABEL = "Suministro Estándar";

// Atributos técnicos para lógica de carrito/checkout.
export const products: Product[] = [
  { id: 1, strain: "indica", format: "cartucho", price: 45.0 },
  { id: 2, strain: "sativa", format: "cartucho", price: 42.0 },
  { id: 3, strain: "hibrida", format: "cartucho", price: 48.0 },
  { id: 4, strain: "indica", format: "desechable", price: 55.0 },
  { id: 5, strain: "sativa", format: "desechable", price: 40.0 },
  { id: 6, strain: "hibrida", format: "desechable", price: 50.0 },
];

// Metadatos visuales (UI unicamente).
export const productMeta: ProductMeta[] = [
  {
    id: 1,
    name: "Nocturno",
    thc: 85,
    effects: "Relajación profunda y serenidad",
    terpenes: "Mirceno · Limoneno",
    unit: "Cartucho 510",
    img: "https://placehold.co/480x360/F3F4F6/4B5563?text=Nocturno",
  },
  {
    id: 2,
    name: "Alba",
    thc: 80,
    effects: "Energía clara y enfoque",
    terpenes: "Limoneno · Pineno",
    unit: "Cartucho 510",
    img: "https://placehold.co/480x360/F3F4F6/4B5563?text=Alba",
  },
  {
    id: 3,
    name: "Balance",
    thc: 82,
    effects: "Armonía entre cuerpo y mente",
    terpenes: "Cariofileno · Limoneno",
    unit: "Cartucho 510",
    img: "https://placehold.co/480x360/F3F4F6/4B5563?text=Balance",
  },
  {
    id: 4,
    name: "Nébula",
    thc: 88,
    effects: "Calma profunda y alivio",
    terpenes: "Mirceno · Cariofileno",
    unit: "Desechable 1g",
    img: "https://placehold.co/480x360/F3F4F6/4B5563?text=Nebula",
  },
  {
    id: 5,
    name: "Cítrico",
    thc: 78,
    effects: "Efecto eufórico y creativo",
    terpenes: "Limoneno · Terpinoleno",
    unit: "Desechable 1g",
    img: "https://placehold.co/480x360/F3F4F6/4B5563?text=Citrico",
  },
  {
    id: 6,
    name: "Gelato",
    thc: 84,
    effects: "Equilibrio dulce y sutil",
    terpenes: "Limoneno · Beta-Cariofileno",
    unit: "Desechable 1g",
    img: "https://placehold.co/480x360/F3F4F6/4B5563?text=Gelato",
  },
];

export const FAQ = [
  {
    q: "¿Cuál es la edad mínima para comprar?",
    a: "Debes ser mayor de 21 años y aceptar los términos de uso.",
  },
  {
    q: "¿Realizan envíos?",
    a: "Sí. El envío es gratuito a partir de $50 de pedido.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Usamos una pasarela de pago segura y neutral configurada para procesar tu orden.",
  },
  {
    q: "¿Los productos son legales?",
    a: "Cumplen con la regulación local. Verifica siempre la normativa de tu región.",
  },
];
