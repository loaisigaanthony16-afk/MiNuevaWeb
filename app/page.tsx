import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServiceBar from "@/components/ServiceBar";
import Collections from "@/components/Collections";
import Catalog from "@/components/Catalog";
import HowItWorks from "@/components/HowItWorks";
import Community from "@/components/Community";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

// Orden de la portada: qué es y qué garantiza, el catálogo, por dónde
// explorar (colecciones), cómo se compra sin dar tu nombre y lo que opina
// la gente que ya compró. En el teléfono el catálogo va antes que las
// colecciones para llegar al primer producto con menos scroll.
export default function HomePage() {
  return (
    <main id="top" className="flex flex-col">
      <AnnouncementBar />
      <Navbar />
      <Hero />
      <ServiceBar />
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
