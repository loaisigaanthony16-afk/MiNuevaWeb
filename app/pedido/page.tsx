import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import OrderChatPage from "@/components/OrderChatPage";

export const metadata: Metadata = {
  title: "Tu pedido · Vibe 505",
  robots: { index: false, follow: false },
};

export default function Pedido() {
  return (
    <main id="top">
      <Navbar />
      <OrderChatPage />
    </main>
  );
}
