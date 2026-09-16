import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrackPage from "@/components/TrackPage";

export const metadata: Metadata = {
  title: "Seguir un pedido · Vibe 505",
  description: "Consultá el estado de entrega de tu pedido con la referencia.",
  robots: { index: false, follow: false },
};

export default function Seguir() {
  return (
    <main id="top">
      <Navbar />
      <TrackPage />
      <Footer />
    </main>
  );
}
