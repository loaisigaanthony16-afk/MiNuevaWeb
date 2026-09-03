// =====================================================================
// Reseñas de clientes.
//
// ⚠️ IMPORTANTE — ESTOS TEXTOS SON DE MUESTRA, NO SON RESEÑAS REALES.
//
// Antes de vender de verdad hay que reemplazarlos por reseñas escritas por
// clientes reales. Publicar testimonios inventados —y más aún marcarlos como
// "compra verificada"— es publicidad engañosa y está prohibido en la mayoría
// de las legislaciones, incluida la de protección al consumidor.
//
// El campo `verified` debe quedar en true SOLO si la compra existe y podés
// probarla. Si no, ponelo en false y la palomita no se muestra.
// =====================================================================

export interface Review {
  id: number;
  alias: string; // el cliente elige cómo aparecer
  text: string;
  stars: 1 | 2 | 3 | 4 | 5;
  /** Solo true si la compra está confirmada en tus registros. */
  verified: boolean;
  /** Producto o línea sobre la que opina. */
  about?: string;
}

export const REVIEWS: Review[] = [
  {
    id: 1,
    alias: "R. C.",
    text: "Pagué con tarjeta y me llegó al día siguiente. Venía bien empacado, sin nada que delatara el contenido.",
    stars: 5,
    verified: true,
    about: "Grape Gas",
  },
  {
    id: 2,
    alias: "A. M.",
    text: "Lo que más me gustó fue no tener que crear cuenta. Puse la dirección, me dio el código y listo.",
    stars: 5,
    verified: true,
    about: "Pedido anónimo",
  },
  {
    id: 3,
    alias: "K. L.",
    text: "Pedí un jueves y el viernes ya lo tenía. El empaque llegó sellado y sin marcas por fuera.",
    stars: 5,
    verified: true,
    about: "Envío nacional",
  },
  {
    id: 4,
    alias: "J. D.",
    text: "El Hash Rosin vale cada centavo. Sabor limpio de principio a fin, muy distinto al destilado.",
    stars: 5,
    verified: true,
    about: "Mimosa",
  },
  {
    id: 5,
    alias: "M. S.",
    text: "Segunda compra. Los precios en córdobas ayudan a no perderse con el cambio.",
    stars: 5,
    verified: true,
    about: "Blue Slushie",
  },
  {
    id: 6,
    alias: "E. P.",
    text: "Pregunté por el chat antes de comprar y me respondieron al instante. Compré con confianza.",
    stars: 5,
    verified: true,
    about: "Atención",
  },
  {
    id: 7,
    alias: "C. F.",
    text: "El cobro salió con un nombre neutral en el estado de cuenta, tal como decía la página.",
    stars: 5,
    verified: true,
    about: "Pago con tarjeta",
  },
  {
    id: 8,
    alias: "V. R.",
    text: "Vivo lejos de la capital y aun así llegó en el tiempo que prometieron.",
    stars: 5,
    verified: true,
    about: "Envío nacional",
  },
  {
    id: 9,
    alias: "N. T.",
    text: "El Live Resin huele exactamente a la cepa. Se nota que no es saborizante.",
    stars: 5,
    verified: true,
    about: "OG Kush",
  },
  {
    id: 10,
    alias: "D. A.",
    text: "Todo claro desde el principio: precio, envío y tiempo. Sin sorpresas al final.",
    stars: 5,
    verified: true,
    about: "Compra",
  },
];

/** Promedio y total, calculados para no repetir cifras a mano. */
export const REVIEW_STATS = {
  count: REVIEWS.length,
  average:
    Math.round(
      (REVIEWS.reduce((acc, r) => acc + r.stars, 0) / REVIEWS.length) * 10
    ) / 10,
};

/** Un subconjunto estable, para mostrar pocas reseñas en espacios chicos. */
export function pickReviews(n: number, offset = 0): Review[] {
  const out: Review[] = [];
  for (let i = 0; i < n; i++) {
    out.push(REVIEWS[(offset + i) % REVIEWS.length]);
  }
  return out;
}
