"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getProduct,
  type BrandId,
  type Product,
  type Strain,
} from "@/lib/data";
import { scrollToSection } from "@/lib/scroll";
import { AGE_KEY } from "@/lib/legal";
import {
  loadDelivery,
  saveDelivery,
  type DeliveryInfo,
} from "@/lib/delivery";

interface UiStore {
  // Checkout
  checkoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;

  // Carrito
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;

  // Vista rápida
  quickProduct: Product | null;
  openQuick: (id: number) => void;
  closeQuick: () => void;

  // Dirección de entrega
  addressOpen: boolean;
  openAddress: () => void;
  closeAddress: () => void;
  delivery: DeliveryInfo | null;
  /** true cuando ya se leyó la dirección guardada en el navegador. */
  deliveryLoaded: boolean;
  setDelivery: (info: DeliveryInfo) => void;

  // Búsqueda
  search: string;
  setSearch: (v: string) => void;

  // Filtros del catálogo. Viven acá para que el menú y las colecciones
  // puedan llevar al catálogo ya filtrado.
  catalogBrand: "all" | BrandId;
  setCatalogBrand: (b: "all" | BrandId) => void;
  catalogStrain: "all" | Strain;
  setCatalogStrain: (s: "all" | Strain) => void;
  /** Aplica el filtro, limpia la búsqueda y baja hasta el catálogo. */
  browse: (opts: { brand?: "all" | BrandId; strain?: "all" | Strain }) => void;

  // Edad
  ageVerified: boolean;
  passAge: () => void;
}

const Ctx = createContext<UiStore | null>(null);

export function UIContextProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [addressOpen, setAddressOpen] = useState(false);
  const [delivery, setDeliveryState] = useState<DeliveryInfo | null>(null);
  const [deliveryLoaded, setDeliveryLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [catalogBrand, setCatalogBrand] = useState<"all" | BrandId>("all");
  const [catalogStrain, setCatalogStrain] = useState<"all" | Strain>("all");
  const [ageVerified, setAgeVerified] = useState(false);

  // Rehidratación tras el montaje (nunca durante el render).
  useEffect(() => {
    setDeliveryState(loadDelivery());
    setDeliveryLoaded(true);

    // Filtros que llegan desde otra página (/?marca=muha, /?q=texto).
    const params = new URLSearchParams(window.location.search);
    const marca = params.get("marca");
    const q = params.get("q");
    if (marca === "muha" || marca === "packwoods") setCatalogBrand(marca);
    if (q) setSearch(q);
    if (marca || q) {
      params.delete("marca");
      params.delete("q");
      const rest = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (rest ? `?${rest}` : "") + window.location.hash);
    }
  }, []);

  // Bloquea el scroll de fondo mientras hay una capa abierta.
  const anyOverlay = drawerOpen || addressOpen || quickProduct !== null;
  useEffect(() => {
    if (!anyOverlay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [anyOverlay]);

  // Escape cierra la capa superior.
  useEffect(() => {
    if (!anyOverlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (checkoutOpen) return; // el modal de pago se cierra con su botón
      if (quickProduct) setQuickProduct(null);
      else if (addressOpen) setAddressOpen(false);
      else if (drawerOpen) setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anyOverlay, quickProduct, addressOpen, drawerOpen, checkoutOpen]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const openCheckout = useCallback(() => setCheckoutOpen(true), []);
  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const closeQuick = useCallback(() => setQuickProduct(null), []);
  const openQuick = useCallback((id: number) => {
    const p = getProduct(id);
    if (p) setQuickProduct(p);
  }, []);
  const openAddress = useCallback(() => setAddressOpen(true), []);
  const closeAddress = useCallback(() => setAddressOpen(false), []);

  const setDelivery = useCallback((info: DeliveryInfo) => {
    setDeliveryState(info);
    saveDelivery(info);
  }, []);

  const browse = useCallback(
    ({ brand, strain }: { brand?: "all" | BrandId; strain?: "all" | Strain }) => {
      // Fuera de la portada no hay catálogo: se va a la portada ya filtrada.
      if (!document.getElementById("catalogo")) {
        const q = brand && brand !== "all" ? `?marca=${brand}` : "";
        window.location.assign(`/${q}#catalogo`);
        return;
      }
      if (brand) setCatalogBrand(brand);
      if (strain) setCatalogStrain(strain);
      setSearch("");
      // Tras pintar el filtro, para medir la sección ya actualizada.
      window.requestAnimationFrame(() => scrollToSection("catalogo"));
    },
    []
  );

  const passAge = useCallback(() => {
    setAgeVerified(true);
    try {
      window.localStorage.setItem(AGE_KEY, "1");
      document.cookie = `${AGE_KEY}=1; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch {
      /* noop */
    }
  }, []);

  const store = useMemo<UiStore>(
    () => ({
      checkoutOpen,
      openCheckout,
      closeCheckout,
      drawerOpen,
      openDrawer,
      closeDrawer,
      quickProduct,
      openQuick,
      closeQuick,
      addressOpen,
      openAddress,
      closeAddress,
      delivery,
      deliveryLoaded,
      setDelivery,
      search,
      setSearch,
      catalogBrand,
      setCatalogBrand,
      catalogStrain,
      setCatalogStrain,
      browse,
      ageVerified,
      passAge,
    }),
    [
      checkoutOpen,
      openCheckout,
      closeCheckout,
      drawerOpen,
      openDrawer,
      closeDrawer,
      quickProduct,
      openQuick,
      closeQuick,
      addressOpen,
      openAddress,
      closeAddress,
      delivery,
      deliveryLoaded,
      setDelivery,
      search,
      catalogBrand,
      catalogStrain,
      browse,
      ageVerified,
      passAge,
    ]
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useUi(): UiStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUi debe usarse dentro de <UIContextProvider>");
  return ctx;
}
