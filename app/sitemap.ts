import type { MetadataRoute } from "next";
import { products } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

/** Páginas públicas. Las de pedido y seguimiento quedan fuera: son
 *  privadas de cada compra y no tienen por qué salir en Google. */
const STATIC = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/reels", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/nosotros", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/shipping", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/refunds", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...STATIC.map(({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/p/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
