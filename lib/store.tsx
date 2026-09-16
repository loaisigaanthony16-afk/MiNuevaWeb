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
import { getProduct, unitPriceFor } from "@/lib/data";
import { deliveryFor } from "@/lib/checkout-util";

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
  /** Precio por unidad vigente según el total de unidades (packs). */
  unitPrice: number;
  shipping: number;
  total: number;
  add: (id: number) => void;
  changeQty: (id: number, delta: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}

// Clave nueva con el catálogo de 2000 mg: las bolsas del catálogo anterior
// traían productos que ya no existen.
const STORAGE_KEY = "vibeCart";

function loadCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    // El precio siempre sale del catálogo vigente, nunca de lo guardado.
    return parsed.flatMap((it) => {
      const p = getProduct(it.id);
      return p ? [{ id: p.id, qty: it.qty, price: p.price }] : [];
    });
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

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const fresh = loadCart();
        setItems(fresh);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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

    const count = items.reduce((acc, it) => acc + it.qty, 0);
    // Packs: mismo cálculo que el servidor (lib/pricing.ts).
    const unitPrice = unitPriceFor(count);
    const subtotal = count * unitPrice;
    const shipping = deliveryFor(subtotal);

    return {
      hydrated: isHydrated,
      count,
      items,
      subtotal,
      unitPrice,
      shipping,
      total: subtotal + shipping,
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
