"use client";

import { useEffect, useState } from "react";

/**
 * Existencias y pedidos de la semana por producto. Se piden una vez por
 * página y se comparten entre tarjetas.
 */
export interface ShopInfo {
  /** Unidades disponibles; sin entrada = sin control de stock. */
  stock: Record<number, number>;
  /** Unidades pedidas en los últimos 7 días (pedidos pagados). */
  week: Record<number, number>;
}

let cache: ShopInfo | null = null;
let pending: Promise<ShopInfo> | null = null;

async function load(): Promise<ShopInfo> {
  if (cache) return cache;
  if (!pending) {
    pending = Promise.all([
      fetch("/api/stock").then((r) => r.json()).catch(() => ({ stock: {} })),
      fetch("/api/stats").then((r) => r.json()).catch(() => ({ week: {} })),
    ]).then(([s, w]) => {
      cache = { stock: (s as { stock?: Record<number, number> }).stock ?? {}, week: (w as { week?: Record<number, number> }).week ?? {} };
      return cache;
    });
  }
  return pending;
}

export function useShopInfo(): ShopInfo {
  const [info, setInfo] = useState<ShopInfo>(cache ?? { stock: {}, week: {} });
  useEffect(() => {
    let alive = true;
    void load().then((i) => alive && setInfo(i));
    return () => {
      alive = false;
    };
  }, []);
  return info;
}

export function isSoldOut(info: ShopInfo, id: number): boolean {
  const q = info.stock[id];
  return q !== undefined && q <= 0;
}
