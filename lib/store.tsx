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
import { products, type Product } from "@/lib/data";

export interface CartItem {
  id: number;
  qty: number;
  price: number;
}

interface Store {
  count: number;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  add: (id: number) => void;
  changeQty: (id: number, delta: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}

const FREE_SHIPPING_AT = 50;
const FLAT_SHIPPING = 5;

const STORAGE_KEY = "shopCart";

function loadInitial(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadInitial);
  const initialized = useRef(false);

  // Hidratar desde localStorage al montar el cliente.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* noop */
    }
  }, []);

  // Persistir cada cambio.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* noop */
    }
  }, [items]);

  function add(id: number) {
    const product: Product | undefined = products.find((p) => p.id === id);
    if (!product) return;
    setItems((prev) => {
      const found = prev.find((it) => it.id === product.id);
      if (found) {
        return prev.map((it) =>
          it.id === product.id ? { ...it, qty: it.qty + 1 } : it
        );
      }
      return [
        ...prev,
        { id: product.id, qty: 1, price: product.price },
      ];
    });
  }

  function changeQty(id: number, delta: number) {
    setItems((prev) =>
      prev
        .map((it) =>
          it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it
        )
        .filter((it) => it.qty > 0)
    );
  }

  function remove(id: number) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function clear() {
    setItems([]);
  }

  const store = useMemo<Store>(() => {
    const subtotal = items.reduce((acc, it) => acc + it.price * it.qty, 0);
    const shipping =
      subtotal === 0 || subtotal >= FREE_SHIPPING_AT ? 0 : FLAT_SHIPPING;
    const count = items.reduce((acc, it) => acc + it.qty, 0);
    return {
      count,
      items,
      subtotal,
      shipping,
      total: subtotal + shipping,
      add,
      changeQty,
      remove,
      clear,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}
