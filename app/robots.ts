import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // El panel, la API y las páginas atadas a un pedido concreto no se
      // indexan: no sirven de resultado y algunas llevan datos del cliente.
      disallow: ["/admin", "/api/", "/pedido", "/seguir", "/order-success"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
