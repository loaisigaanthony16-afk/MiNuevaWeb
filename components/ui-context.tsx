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
import { getProduct, type Product } from "@/lib/data";
import {
  loadDelivery,
  saveDelivery,
  type DeliveryInfo,
} from "@/lib/delivery";

interface UiStore {
  // Carrito
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;

  // Vista rápida
  quickProduct: Product | null;
  openQuick: (id: number) => void;
  closeQuick: () => void;

  // Checkout
  checkoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;

  // Dirección de entrega
  addressOpen: boolean;
  openAddress: () => void;
  closeAddress: () => void;
  delivery: DeliveryInfo | null;
  setDelivery: (info: DeliveryInfo) => void;

  // Búsqueda
  search: string;
  setSearch: (v: string) => void;

  // Edad
  ageVerified: boolean;
  passAge: () => void;
}

const Ctx = createContext<UiStore | null>(null);
const AGE_KEY = "pv18s";

export function UIContextProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [addressOpen, setAddressOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [delivery, setDeliveryState] = useState<DeliveryInfo | null>(null);
  const [search, setSearch] = useState("");
  const [ageVerified, setAgeVerified] = useState(false);

  // Rehidratación tras el montaje (nunca durante el render).
  useEffect(() => {
    setDeliveryState(loadDelivery());
  }, []);

  // Bloquea el scroll de fondo mientras hay una capa abierta.
  const anyOverlay =
    drawerOpen || addressOpen || checkoutOpen || quickProduct !== null;
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
      if (quickProduct) setQuickProduct(null);
      else if (checkoutOpen) setCheckoutOpen(false);
      else if (addressOpen) setAddressOpen(false);
      else if (drawerOpen) setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anyOverlay, quickProduct, checkoutOpen, addressOpen, drawerOpen]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const closeQuick = useCallback(() => setQuickProduct(null), []);
  const openQuick = useCallback((id: number) => {
    const p = getProduct(id);
    if (p) setQuickProduct(p);
  }, []);
  const openAddress = useCallback(() => setAddressOpen(true), []);
  const openCheckout = useCallback(() => {
    setDrawerOpen(false);
    setCheckoutOpen(true);
  }, []);
  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);
  const closeAddress = useCallback(() => setAddressOpen(false), []);

  const setDelivery = useCallback((info: DeliveryInfo) => {
    setDeliveryState(info);
    saveDelivery(info);
  }, []);

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
      drawerOpen,
      openDrawer,
      closeDrawer,
      quickProduct,
      openQuick,
      closeQuick,
      checkoutOpen,
      openCheckout,
      closeCheckout,
      addressOpen,
      openAddress,
      closeAddress,
      delivery,
      setDelivery,
      search,
      setSearch,
      ageVerified,
      passAge,
    }),
    [
      drawerOpen,
      openDrawer,
      closeDrawer,
      quickProduct,
      openQuick,
      closeQuick,
      checkoutOpen,
      openCheckout,
      closeCheckout,
      addressOpen,
      openAddress,
      closeAddress,
      delivery,
      setDelivery,
      search,
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
