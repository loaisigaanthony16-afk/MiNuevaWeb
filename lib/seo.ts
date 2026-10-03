// =====================================================================
// Datos del sitio para buscadores: URL canónica y datos estructurados
// (JSON-LD). Es lo que hace que Google muestre precio, disponibilidad y
// la ficha del negocio en vez de un resultado pelado.
//
// Ojo: lib/site.ts es otra cosa (utilidades de checkout).
// =====================================================================

import { getBrand, products, STRAIN_LABEL, type Product } from "@/lib/data";

/** URL pública sin barra final. El dominio con www es el canónico. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.vibe505.com"
).replace(/\/$/, "");

export const SITE_NAME = "Vibe 505";
export const CITY = "Estelí";

export function absolute(path: string) {
  return path.startsWith("http") ? path : `${SITE_URL}${path}`;
}

/**
 * El negocio. Sin dirección de calle a propósito: no hay local al
 * público, se entrega a domicilio, así que lo que importa es la ciudad
 * que se cubre.
 */
export function storeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${SITE_URL}/#tienda`,
    name: SITE_NAME,
    url: SITE_URL,
    image: absolute("/icon-512.png"),
    description:
      "Vapes Muha Meds, Packwoods y Cookies con entrega en Estelí. Pedido sin cuenta y empaque neutro.",
    address: {
      "@type": "PostalAddress",
      addressLocality: CITY,
      addressRegion: "Estelí",
      addressCountry: "NI",
    },
    areaServed: { "@type": "City", name: CITY },
    currenciesAccepted: "USD, NIO",
    paymentAccepted: "Tarjeta de crédito, tarjeta de débito",
  };
}

/** Ficha de producto: precio, moneda y disponibilidad para el resultado rico. */
export function productJsonLd(p: Product) {
  const brand = getBrand(p.brand).name;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    // El JPEG de 1200x630 va primero: es el formato que Google acepta sin
    // reparos para el resultado rico. Las demás son las fotos del catálogo.
    image: [absolute(`/og/${p.slug}.jpg`), ...p.shots.map((s) => absolute(s))],
    description: `${p.name} de ${brand}: ${p.flavor}. Perfil ${STRAIN_LABEL[p.strain]}.`,
    brand: { "@type": "Brand", name: brand },
    category: "Vaporizadores",
    sku: p.slug,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/p/${p.slug}`,
      price: String(p.price),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      seller: { "@id": `${SITE_URL}/#tienda` },
    },
  };
}

/** Migas de pan, para que el resultado muestre la ruta en vez de la URL. */
export function breadcrumbJsonLd(p: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Catálogo", item: `${SITE_URL}/#catalogo` },
      { "@type": "ListItem", position: 3, name: p.name },
    ],
  };
}

/** El catálogo como lista, para la portada. */
export function catalogJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Catálogo ${SITE_NAME}`,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${SITE_URL}/p/${p.slug}`,
    })),
  };
}
