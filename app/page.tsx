import ShopExperience from "@/components/ShopExperience";
import Hero from "@/components/Hero";
import Catalog from "@/components/Catalog";
import FaqSection from "@/components/FaqSection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main id="top">
      <ShopExperience>
        <Hero />
        <Catalog />
        <FaqSection />
        <Footer />
      </ShopExperience>
    </main>
  );
}
