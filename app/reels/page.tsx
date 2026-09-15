import type { Metadata } from "next";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import ReelsPage from "@/components/ReelsPage";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

export const metadata: Metadata = {
  title: "Reels · Vibe 505",
  description: "Mirá cada sabor en video: 15 reels de Muha Meds y Packwoods.",
};

// Pestaña propia: todos los reels juntos, fuera de la portada.
export default function Reels() {
  return (
    <main id="top">
      <AnnouncementBar />
      <Navbar />
      <ReelsPage />
      <Footer />
      <FloatingActions />
    </main>
  );
}
