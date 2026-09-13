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

// Orden de la portada: qué es y qué garantiza, por dónde entrar
// (colecciones), el catálogo, cómo se compra sin dar tu nombre y lo que
// opina la gente que ya compró.
export default function HomePage() {
  return (
    <main id="top">
      <AnnouncementBar />
      <Navbar />
      <Hero />
      <ServiceBar />
      <Collections />
      <Catalog />
      <HowItWorks />
      <Community />
      <Footer />
      <FloatingActions />
    </main>
  );
}
