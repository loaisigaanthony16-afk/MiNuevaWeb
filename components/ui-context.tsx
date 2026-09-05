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
  const [delivery, setDeliveryState] = useState<DeliveryInfo | null>(null);
  const [deliveryLoaded, setDeliveryLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [ageVerified, setAgeVerified] = useState(false);

  // Rehidratación tras el montaje (nunca durante el render).
  useEffect(() => {
    setDeliveryState(loadDelivery());
    setDeliveryLoaded(true);
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
      if (quickProduct) setQuickProduct(null);
      else if (addressOpen) setAddressOpen(false);
      else if (drawerOpen) setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anyOverlay, quickProduct, addressOpen, drawerOpen]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
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
      addressOpen,
      openAddress,
      closeAddress,
      delivery,
      deliveryLoaded,
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
      addressOpen,
      openAddress,
      closeAddress,
      delivery,
      deliveryLoaded,
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
