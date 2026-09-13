import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServiceBar from "@/components/ServiceBar";
import Collections from "@/components/Collections";
import BrandsMarquee from "@/components/BrandsMarquee";
import Catalog from "@/components/Catalog";
import PrivacySection from "@/components/PrivacySection";
import Community from "@/components/Community";
import Footer from "@/components/Footer";

// Orden de la portada: qué es y qué garantiza, por dónde entrar
// (colecciones), el catálogo, cómo cuidamos tu privacidad y lo que opina
// la gente que ya compró.
export default function HomePage() {
  return (
    <main id="top">
      <AnnouncementBar />
      <Navbar />
      <Hero />
      <ServiceBar />
      <Collections />
      <BrandsMarquee />
      <Catalog />
      <PrivacySection />
      <Community />
      <Footer />
    </main>
  );
}
