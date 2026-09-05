import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Catalog from "@/components/Catalog";
import TrustStrip from "@/components/TrustStrip";
import ShippingSection from "@/components/ShippingSection";
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
      <TrustStrip />
      <ShippingSection />
      <Reviews />
      <PrivacySection />
      <Assistant />
      <Footer />
    </main>
  );
}
