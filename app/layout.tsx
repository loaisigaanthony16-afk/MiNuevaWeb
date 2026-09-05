import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { UIContextProvider } from "@/components/ui-context";
import { LocaleProvider } from "@/components/locale-context";
import AgeGate from "@/components/AgeGate";
import OrderStatus from "@/components/OrderStatus";
import PendingOrderBanner from "@/components/PendingOrderBanner";
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
    <html
      lang="es"
      className={`${inter.variable} ${outfit.variable}`}
      // El script previo al pintado marca data-age en <html>; React no debe
      // tratar ese atributo como una discrepancia de hidratación.
      suppressHydrationWarning
    >
      <head>
        {/* Antes del primer pintado: si ya confirmó la edad, el portal ni
            parpadea. Si no, el portal es lo primero que aparece. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('pv18s')==='1'||document.cookie.indexOf('pv18s=1')>-1){document.documentElement.dataset.age='ok'}}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-screen font-sans">
        <LocaleProvider>
          <StoreProvider>
            <UIContextProvider>
              {children}
              {/* Capas globales */}
              <CartDrawer />
              <QuickView />
              <AddressModal />
              <AgeGate />
              <OrderStatus />
              <PendingOrderBanner />
            </UIContextProvider>
          </StoreProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
