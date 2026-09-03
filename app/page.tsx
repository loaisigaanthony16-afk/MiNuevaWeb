import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Catalog from "@/components/Catalog";
import Reviews from "@/components/Reviews";
import PrivacySection from "@/components/PrivacySection";
import Assistant from "@/components/Assistant";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main id="top">
      <Navbar />
      <Hero />
      <Catalog />
      <Reviews />
      <PrivacySection />
      <Assistant />
      <Footer />
    </main>
  );
}
