// =====================================================================
// Textos de la interfaz en español e inglés.
//
// El español es el idioma por defecto: si falta una clave en inglés se
// devuelve la española, así nunca aparece una clave cruda en pantalla.
// Los nombres de producto y de línea no se traducen: son marcas.
// =====================================================================

export type Locale = "es" | "en";

export const LOCALES: Locale[] = ["es", "en"];

const es = {
  // --- Barra superior ---
  "nav.search": "Buscar cepa, sabor o línea…",
  "nav.searchLabel": "Buscar productos",
  "nav.clear": "Limpiar búsqueda",
  "nav.shipTo": "Enviar a",
  "nav.chooseAddress": "Elegir dirección",
  "nav.address": "Dirección de entrega",
  "nav.bag": "Abrir bolsa",
  "nav.lang": "Cambiar idioma",

  // --- Portal de edad ---
  "gate.kicker": "Solo para adultos",
  "gate.title": "¿Sos mayor de 18 años?",
  "gate.body":
    "Este sitio vende productos de uso adulto. Al entrar confirmás que tenés la edad legal en Nicaragua.",
  "gate.yes": "Sí, tengo 18 o más",
  "gate.no": "No",
  "gate.denied": "Gracias por tu honestidad. No podés continuar.",
  "gate.back": "Volver",
  "gate.legal": "Consumo responsable. Prohibida la venta a menores de edad.",

  // --- Hero ---
  "hero.kicker": "Extractos premium · Nicaragua",
  "hero.line1": "Pedí sin nombre.",
  "hero.line2": "Recibí sin marcas.",
  "hero.lede": "Sin cuenta, sin perfil y en empaque neutro. Pago con tarjeta.",
  "hero.cta": "Ver catálogo",
  "hero.how": "Cómo funciona",
  "hero.refs": "referencias",

  // --- Cobertura ---
  "cover.kicker": "Todo el territorio nacional",
  "cover.delivery": "Entrega",
  "cover.shipping": "Envío",
  "cover.packaging": "Empaque",
  "cover.packagingValue": "Neutro y sellado",
  "cover.payment": "Pago",
  "cover.paymentValue": "Tarjeta",
  "cover.mapLabel":
    "Cobertura de entrega en todo el territorio nacional de Nicaragua",

  // --- Marquesina ---
  "tick.shipping": "Envío nacional",
  "tick.anon": "Pedido anónimo",
  "tick.packaging": "Empaque neutro",
  "tick.original": "Producto original",
  "tick.card": "Pago con tarjeta",

  // --- Catálogo ---
  "cat.filterLines": "Todas las líneas",
  "cat.strainAll": "Todas",
  "cat.results": "resultado",
  "cat.resultsPlural": "resultados",
  "cat.clear": "Limpiar búsqueda",
  "cat.emptyTitle": "Sin coincidencias",
  "cat.emptyBody":
    "Probá con otra cepa, otro sabor o quitá los filtros para ver todo el catálogo.",
  "cat.reset": "Reiniciar filtros",
  "cat.add": "Añadir",

  // --- Vista rápida ---
  "quick.weight": "Gramaje",
  "quick.format": "Formato",
  "quick.line": "Línea",
  "quick.strain": "Cepa",
  "quick.flavor": "Perfil de sabor",
  "quick.added": "Añadido",
  "quick.shippingIn": "envío",

  // --- Carrito ---
  "cart.title": "Tu bolsa",
  "cart.empty": "Tu bolsa está vacía",
  "cart.emptyBody": "Explorá las cuatro líneas del catálogo.",
  "cart.browse": "Ver catálogo",
  "cart.clear": "Vaciar",
  "cart.free": "Envío gratis",
  "cart.applied": "Aplicado",
  "cart.missing": "Faltan",
  "cart.subtotal": "Subtotal",
  "cart.shipping": "Envío nacional",
  "cart.freeWord": "Gratis",
  "cart.total": "Total",
  "cart.cardOnly": "Pago con tarjeta, en pasarela segura.",
  "cart.pay": "Pagar con tarjeta",
  "cart.needAddress": "Agregar dirección",
  "cart.deliveryIn": "Entrega en",
  "cart.freeFrom": "Gratis desde",

  // --- Dirección ---
  "addr.kicker": "Entrega",
  "addr.title": "¿A dónde lo enviamos?",
  "addr.privacy":
    "Esto no crea una cuenta. Lo que escribas queda solo en este dispositivo y viaja cifrado al momento de pagar. Lo leemos únicamente para despachar ese envío.",
  "addr.noAccount": "no crea una cuenta",
  "addr.alias": "Nombre para recibir",
  "addr.aliasHint": "Puede ser un apodo",
  "addr.phone": "Teléfono de contacto",
  "addr.region": "Departamento o región",
  "addr.regionHint": "Elegí una opción",
  "addr.address": "Dirección exacta",
  "addr.addressHint": "Barrio, calle, número de casa y color del portón",
  "addr.notes": "Referencias u horario",
  "addr.optional": "(opcional)",
  "addr.notesHint": "Frente al parque, entregar después de las 5pm",
  "addr.coverage": "Cobertura nacional · Entrega en",
  "addr.save": "Guardar dirección",
  "addr.saved": "Guardado",
  "addr.delete": "Borrar mis datos",

  // --- Privacidad ---
  "priv.kicker": "Privacidad",
  "priv.title1": "Anónimo,",
  "priv.title2": "pero entregable.",
  "priv.body":
    "Necesitamos una dirección para llegar, no tu identidad para guardarla.",
  "priv.s1t": "Ponés tu dirección",
  "priv.s1b": "Un apodo basta. No verificamos identidad.",
  "priv.s2t": "No se crea cuenta",
  "priv.s2b": "Sin registro, sin correo, sin contraseña.",
  "priv.s3t": "Viaja cifrada",
  "priv.s3b": "Solo al pagar, junto a tu pedido.",
  "priv.s4t": "Se abre para despachar",
  "priv.s4b": "Nada queda guardado después.",

  // --- Reseñas ---
  "rev.kicker": "Clientes",
  "rev.title": "Lo que dicen.",
  "rev.count": "reseñas",
  "rev.verified": "Compra verificada",

  // --- Asistente ---
  "chat.kicker": "Consultas",
  "chat.title": "Preguntá.",
  "chat.body": "Respuestas al instante sobre privacidad, envío y pago.",
  "chat.name": "Asistente Vibe",
  "chat.online": "En línea",
  "chat.greeting": "Hola. Preguntá lo que necesites saber antes de comprar.",
  "chat.placeholder": "Escribí tu consulta…",
  "chat.send": "Enviar",
  "chat.fallback":
    "Esa no la tengo escrita. Dejala anotada y te la respondemos al confirmar tu pedido.",


  // --- Envío ---
  "ship.kicker": "Envío",
  "ship.title": "Cómo llega tu pedido.",
  "ship.body":
    "Misma tarifa en todo el país. Lo que cambia es quién lo lleva, según tu departamento.",
  "ship.rate": "Tarifa única",
  "ship.rateNote": "a cualquier departamento",
  "ship.freeTitle": "Envío gratis",
  "ship.freeNote": "en pedidos desde",
  "ship.packTitle": "Empaque",
  "ship.packNote": "neutro, opaco y sellado",

  "ship.directName": "Entrega directa",
  "ship.directEta": "24 horas",
  "ship.directCarrier": "Mensajero propio",
  "ship.directAnon":
    "Nuestro mensajero solo lleva tu código. No pide documento ni registra tu nombre.",
  "ship.parcelName": "Encomienda",
  "ship.parcelEta": "48 a 72 horas",
  "ship.parcelCarrier": "Paquetería nacional",
  "ship.parcelAnon":
    "La guía va a nombre del apodo que elegiste y no declara el contenido. Se entrega en tu dirección.",
  "ship.idWarning":
    "Algunas paqueterías piden un documento al recibir. Si te pasa, avisanos y coordinamos otra forma.",

  "ship.step1": "Elegís y pagás con tarjeta",
  "ship.step2": "Preparamos en empaque neutro",
  "ship.step3": "Sale con tu código, sin tu nombre",
  "ship.step4": "Recibís en tu dirección",

  "ship.modeFor": "Para",
  "ship.yourMode": "Tu entrega",
  "ship.carrier": "Lleva",
  "ship.eta": "Llega en",
  "ship.cost": "Costo",
  "ship.regionsDirect": "Departamentos con entrega directa",
  "ship.regionsRest": "Resto del país",
  "ship.chooseRegion": "Elegí tu departamento para ver el tiempo de entrega.",

  // --- Confianza ---
  "trust.ssl": "Pago cifrado",
  "trust.sslNote": "Pasarela segura, no vemos tu tarjeta",
  "trust.noData": "Sin cuenta",
  "trust.noDataNote": "No guardamos perfiles ni historial",
  "trust.neutral": "Empaque neutro",
  "trust.neutralNote": "Sin marcas ni referencias afuera",
  "trust.support": "Respuesta rápida",
  "trust.supportNote": "Consultá antes de comprar",

  // --- Pie ---
  "foot.lines": "Líneas",
  "foot.info": "Información",
  "foot.anon": "Cómo funciona el anonimato",
  "foot.faq": "Preguntas frecuentes",
  "foot.shipping": "Envío y cobertura",
  "foot.terms": "Términos y condiciones",
  "foot.tagline":
    "Extractos premium con entrega nacional y pedido anónimo. Para uso adulto responsable.",
  "foot.adults": "Solo mayores de 18",
  "foot.rights": "Envío nacional en",
  "foot.legal": "Venta prohibida a menores de edad. Consumo responsable.",
} as const;

export type Key = keyof typeof es;

const en: Partial<Record<Key, string>> = {
  "nav.search": "Search strain, flavor or line…",
  "nav.searchLabel": "Search products",
  "nav.clear": "Clear search",
  "nav.shipTo": "Ship to",
  "nav.chooseAddress": "Set address",
  "nav.address": "Delivery address",
  "nav.bag": "Open bag",
  "nav.lang": "Change language",

  "gate.kicker": "Adults only",
  "gate.title": "Are you 18 or older?",
  "gate.body":
    "This site sells adult-use products. By entering you confirm you are of legal age in Nicaragua.",
  "gate.yes": "Yes, I'm 18 or older",
  "gate.no": "No",
  "gate.denied": "Thanks for your honesty. You can't continue.",
  "gate.back": "Go back",
  "gate.legal": "Consume responsibly. Sale to minors is prohibited.",

  "hero.kicker": "Premium extracts · Nicaragua",
  "hero.line1": "Order with no name.",
  "hero.line2": "Get it with no labels.",
  "hero.lede": "No account, no profile, plain packaging. Card payment.",
  "hero.cta": "View catalog",
  "hero.how": "How it works",
  "hero.refs": "products",

  "cover.kicker": "Nationwide coverage",
  "cover.delivery": "Delivery",
  "cover.shipping": "Shipping",
  "cover.packaging": "Packaging",
  "cover.packagingValue": "Plain and sealed",
  "cover.payment": "Payment",
  "cover.paymentValue": "Card",
  "cover.mapLabel": "Delivery coverage across Nicaragua",

  "tick.shipping": "Nationwide shipping",
  "tick.anon": "Anonymous order",
  "tick.packaging": "Plain packaging",
  "tick.original": "Genuine product",
  "tick.card": "Card payment",

  "cat.filterLines": "All lines",
  "cat.strainAll": "All",
  "cat.results": "result",
  "cat.resultsPlural": "results",
  "cat.clear": "Clear search",
  "cat.emptyTitle": "No matches",
  "cat.emptyBody":
    "Try another strain or flavor, or clear the filters to see everything.",
  "cat.reset": "Reset filters",
  "cat.add": "Add",

  "quick.weight": "Size",
  "quick.format": "Format",
  "quick.line": "Line",
  "quick.strain": "Strain",
  "quick.flavor": "Flavor profile",
  "quick.added": "Added",
  "quick.shippingIn": "ships in",

  "cart.title": "Your bag",
  "cart.empty": "Your bag is empty",
  "cart.emptyBody": "Browse the four lines in the catalog.",
  "cart.browse": "View catalog",
  "cart.clear": "Clear",
  "cart.free": "Free shipping",
  "cart.applied": "Applied",
  "cart.missing": "Add",
  "cart.subtotal": "Subtotal",
  "cart.shipping": "Nationwide shipping",
  "cart.freeWord": "Free",
  "cart.total": "Total",
  "cart.cardOnly": "Card payment, secure checkout.",
  "cart.pay": "Pay by card",
  "cart.needAddress": "Add address",
  "cart.deliveryIn": "Delivery in",
  "cart.freeFrom": "Free over",

  "addr.kicker": "Delivery",
  "addr.title": "Where should we send it?",
  "addr.privacy":
    "This does not create an account. What you type stays on this device and travels encrypted only at payment. We read it solely to dispatch that order.",
  "addr.noAccount": "does not create an account",
  "addr.alias": "Name for delivery",
  "addr.aliasHint": "A nickname works",
  "addr.phone": "Contact phone",
  "addr.region": "Department or region",
  "addr.regionHint": "Choose one",
  "addr.address": "Exact address",
  "addr.addressHint": "Neighborhood, street, house number and gate color",
  "addr.notes": "Landmarks or preferred time",
  "addr.optional": "(optional)",
  "addr.notesHint": "Across from the park, deliver after 5pm",
  "addr.coverage": "Nationwide coverage · Delivery in",
  "addr.save": "Save address",
  "addr.saved": "Saved",
  "addr.delete": "Delete my data",

  "priv.kicker": "Privacy",
  "priv.title1": "Anonymous,",
  "priv.title2": "still deliverable.",
  "priv.body": "We need an address to reach you, not your identity to keep.",
  "priv.s1t": "You set the address",
  "priv.s1b": "A nickname is enough. We don't verify identity.",
  "priv.s2t": "No account is created",
  "priv.s2b": "No sign-up, no email, no password.",
  "priv.s3t": "It travels encrypted",
  "priv.s3b": "Only at payment, with your order.",
  "priv.s4t": "Opened to dispatch",
  "priv.s4b": "Nothing is stored afterwards.",

  "rev.kicker": "Customers",
  "rev.title": "What they say.",
  "rev.count": "reviews",
  "rev.verified": "Verified purchase",

  "chat.kicker": "Questions",
  "chat.title": "Just ask.",
  "chat.body": "Instant answers about privacy, shipping and payment.",
  "chat.name": "Vibe Assistant",
  "chat.online": "Online",
  "chat.greeting": "Hi. Ask anything you need to know before buying.",
  "chat.placeholder": "Type your question…",
  "chat.send": "Send",
  "chat.fallback":
    "I don't have that one written down. Leave it here and we'll answer when you confirm your order.",


  "ship.kicker": "Shipping",
  "ship.title": "How your order arrives.",
  "ship.body":
    "One rate nationwide. What changes is who carries it, based on your department.",
  "ship.rate": "Flat rate",
  "ship.rateNote": "to any department",
  "ship.freeTitle": "Free shipping",
  "ship.freeNote": "on orders over",
  "ship.packTitle": "Packaging",
  "ship.packNote": "plain, opaque and sealed",

  "ship.directName": "Direct delivery",
  "ship.directEta": "24 hours",
  "ship.directCarrier": "Our own courier",
  "ship.directAnon":
    "Our courier carries only your code. No ID is asked and no name is recorded.",
  "ship.parcelName": "Parcel service",
  "ship.parcelEta": "48 to 72 hours",
  "ship.parcelCarrier": "National carrier",
  "ship.parcelAnon":
    "The waybill uses the nickname you chose and never declares the contents. Delivered to your address.",
  "ship.idWarning":
    "Some carriers ask for ID on delivery. If that happens, tell us and we'll arrange another way.",

  "ship.step1": "You choose and pay by card",
  "ship.step2": "We pack it plain",
  "ship.step3": "It ships with your code, not your name",
  "ship.step4": "It arrives at your address",

  "ship.modeFor": "For",
  "ship.yourMode": "Your delivery",
  "ship.carrier": "Carried by",
  "ship.eta": "Arrives in",
  "ship.cost": "Cost",
  "ship.regionsDirect": "Departments with direct delivery",
  "ship.regionsRest": "Rest of the country",
  "ship.chooseRegion": "Pick your department to see the delivery time.",

  "trust.ssl": "Encrypted payment",
  "trust.sslNote": "Secure gateway, we never see your card",
  "trust.noData": "No account",
  "trust.noDataNote": "We keep no profiles or history",
  "trust.neutral": "Plain packaging",
  "trust.neutralNote": "No branding or hints outside",
  "trust.support": "Fast answers",
  "trust.supportNote": "Ask before you buy",

  "foot.lines": "Lines",
  "foot.info": "Information",
  "foot.anon": "How anonymity works",
  "foot.faq": "FAQ",
  "foot.shipping": "Shipping and coverage",
  "foot.terms": "Terms and conditions",
  "foot.tagline":
    "Premium extracts with nationwide delivery and anonymous ordering. For responsible adult use.",
  "foot.adults": "18+ only",
  "foot.rights": "Nationwide delivery in",
  "foot.legal": "Sale to minors prohibited. Consume responsibly.",
};

const DICT: Record<Locale, Partial<Record<Key, string>>> = { es, en };

export function translate(locale: Locale, key: Key): string {
  return DICT[locale][key] ?? es[key];
}
