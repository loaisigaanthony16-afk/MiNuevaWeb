import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServiceBar from "@/components/ServiceBar";
import Collections from "@/components/Collections";
import LinesMarquee from "@/components/LinesMarquee";
import FeaturedRail from "@/components/FeaturedRail";
import Catalog from "@/components/Catalog";
import ShippingSection from "@/components/ShippingSection";
import Reviews from "@/components/Reviews";
import PrivacySection from "@/components/PrivacySection";
import Assistant from "@/components/Assistant";
import Footer from "@/components/Footer";

// Orden de la portada: primero qué es y qué garantiza, luego por dónde
// entrar (colecciones), y recién después el catálogo completo y los detalles.
export default function HomePage() {
  return (
    <main id="top">
      <AnnouncementBar />
      <Navbar />
      <Hero />
      <ServiceBar />
      <Collections />
      <LinesMarquee />
      <FeaturedRail />
      <Catalog />
      <ShippingSection />
      <Reviews />
      <PrivacySection />
      <Assistant />
      <Footer />
    </main>
  );
}
