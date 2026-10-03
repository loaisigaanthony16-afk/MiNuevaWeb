import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductPage from "@/components/ProductPage";
import { getBrand, getProductBySlug, products, STRAIN_LABEL } from "@/lib/data";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) return { title: "Vibe 505" };
  const brand = getBrand(p.brand).name;
  const description = `${p.name} de ${brand}: ${p.flavor}. Perfil ${STRAIN_LABEL[p.strain]}. $${p.price} con entrega en Estelí y empaque neutro.`;
  return {
    title: `${p.name} · ${brand} · Vibe 505`,
    description,
    alternates: { canonical: `/p/${p.slug}` },
    openGraph: {
      type: "website",
      title: `${p.name} · ${brand}`,
      description,
      url: `/p/${p.slug}`,
      // JPEG opaco en vez del .webp recortado: es lo que WhatsApp y
      // Facebook saben mostrar en la vista previa del enlace.
      images: [{ url: `/og/${p.slug}.jpg`, width: 1200, height: 630, alt: p.name }],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) notFound();
  return (
    <main id="top">
      {/* Para que el resultado de Google muestre precio, disponibilidad y ruta. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([productJsonLd(p), breadcrumbJsonLd(p)]),
        }}
      />
      <Navbar />
      <ProductPage product={p} />
      <Footer />
    </main>
  );
}
