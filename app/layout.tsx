import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { UIContextProvider } from "@/components/ui-context";
import AgeGateModal from "@/components/AgeGateModal";
import AddressModal from "@/components/AddressModal";
import QuickView from "@/components/QuickView";
import CartDrawer from "@/components/CartDrawer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Vibe 505 · Extractos premium con entrega nacional",
  description:
    "Cartuchos 510 y all-in-one en cuatro líneas de extracto. Pedido anónimo sin cuenta, empaque neutro y envío a todo Nicaragua.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen font-sans">
        <StoreProvider>
          <UIContextProvider>
            {children}
            {/* Capas globales */}
            <CartDrawer />
            <QuickView />
            <AddressModal />
            <AgeGateModal />
          </UIContextProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
