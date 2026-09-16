import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductPage from "@/components/ProductPage";
import { getBrand, getProductBySlug, products, STRAIN_LABEL } from "@/lib/data";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) return { title: "Vibe 505" };
  const brand = getBrand(p.brand).name;
  return {
    title: `${p.name} · ${brand} · Vibe 505`,
    description: `${p.name} de ${brand}: ${p.flavor}. Perfil ${STRAIN_LABEL[p.strain]}. $${p.price} con entrega en Estelí y empaque neutro.`,
    openGraph: { title: `${p.name} · ${brand}`, description: p.flavor, images: [{ url: p.img }] },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) notFound();
  return (
    <main id="top">
      <Navbar />
      <ProductPage product={p} />
      <Footer />
    </main>
  );
}
