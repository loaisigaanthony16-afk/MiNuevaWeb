"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getProduct } from "@/lib/data";
import { FREE_SHIPPING_AT, shippingFor } from "@/lib/checkout-util";

export interface CartItem {
  id: number;
  qty: number;
  price: number;
}

interface Store {
  /** true cuando ya se leyó la bolsa guardada en el navegador. */
  hydrated: boolean;
  count: number;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  /** Cuánto falta para envío gratis (0 si ya aplica). */
  missingForFree: number;
  freeProgress: number; // 0..1
  add: (id: number) => void;
  changeQty: (id: number, delta: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}

const STORAGE_KEY = "shopCart";

function loadCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // El primer render debe coincidir con el del servidor: arrancamos vacío
  // y rehidratamos desde localStorage una vez montados.
  const [items, setItems] = useState<CartItem[]>([]);
  const hydrated = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = loadCart();
    if (stored.length) setItems(stored);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* noop */
    }
  }, [items]);

  const store = useMemo<Store>(() => {
    function add(id: number) {
      const product = getProduct(id);
      if (!product) return;
      setItems((prev) => {
        const found = prev.find((it) => it.id === product.id);
        if (found) {
          return prev.map((it) =>
            it.id === product.id ? { ...it, qty: Math.min(it.qty + 1, 99) } : it
          );
        }
        return [...prev, { id: product.id, qty: 1, price: product.price }];
      });
    }

    function changeQty(id: number, delta: number) {
      setItems((prev) =>
        prev
          .map((it) =>
            it.id === id
              ? { ...it, qty: Math.min(Math.max(0, it.qty + delta), 99) }
              : it
          )
          .filter((it) => it.qty > 0)
      );
    }

    function setQty(id: number, qty: number) {
      setItems((prev) =>
        prev
          .map((it) => (it.id === id ? { ...it, qty: Math.min(Math.max(0, qty), 99) } : it))
          .filter((it) => it.qty > 0)
      );
    }

    const subtotal = items.reduce((acc, it) => acc + it.price * it.qty, 0);
    const shipping = shippingFor(subtotal);
    const count = items.reduce((acc, it) => acc + it.qty, 0);
    const missingForFree = Math.max(0, FREE_SHIPPING_AT - subtotal);

    return {
      hydrated: isHydrated,
      count,
      items,
      subtotal,
      shipping,
      total: subtotal + shipping,
      missingForFree,
      freeProgress: Math.min(1, subtotal / FREE_SHIPPING_AT),
      add,
      changeQty,
      setQty,
      remove: (id: number) => setItems((prev) => prev.filter((it) => it.id !== id)),
      clear: () => setItems([]),
    };
  }, [items, isHydrated]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}
