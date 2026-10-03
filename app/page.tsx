import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Collections from "@/components/Collections";
import Catalog from "@/components/Catalog";
import HowItWorks from "@/components/HowItWorks";
import Community from "@/components/Community";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { catalogJsonLd, storeJsonLd } from "@/lib/seo";

// Orden de la portada: qué es y qué garantiza, el catálogo, por dónde
// explorar (colecciones), cómo se compra sin dar tu nombre y lo que opina
// la gente que ya compró. En el teléfono el catálogo va antes que las
// colecciones para llegar al primer producto con menos scroll.
export default function HomePage() {
  return (
    <main id="top" className="flex flex-col">
      {/* Ficha del negocio y catálogo para Google: la búsqueda local de
          "vape Estelí" necesita saber qué ciudad se cubre. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([storeJsonLd(), catalogJsonLd()]),
        }}
      />
      <AnnouncementBar />
      <Navbar />
      <Hero />
      <div className="max-md:order-2">
        <Collections />
      </div>
      <div className="max-md:order-1">
        <Catalog />
      </div>
      <div className="max-md:order-3">
        <HowItWorks />
        <Community />
        <Footer />
        <FloatingActions />
      </div>
    </main>
  );
}
