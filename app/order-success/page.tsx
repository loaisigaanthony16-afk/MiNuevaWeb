import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import OrderConfirmation from "@/components/OrderConfirmation";

export const metadata: Metadata = {
  title: "Tu pedido · Vibe 505",
  robots: { index: false, follow: false },
};

export default function OrderSuccess() {
  return (
    <main id="top">
      <Navbar />
      <OrderConfirmation />
    </main>
  );
}
