"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { useT } from "@/components/locale-context";
import { formatUSD } from "@/lib/checkout-util";
import { loadPendingOrder } from "@/lib/pending-order";

const SEEN_KEY = "vibeBagNudge";

/**
 * Bolsa abandonada: si vuelve con productos guardados y sin pedido en
 * curso, un aviso suave (una vez por visita) para retomar la compra.
 */
export default function AbandonedCartToast() {
  const t = useT();
  const pathname = usePathname();
  const { items, total, hydrated } = useStore();
  const { openDrawer, drawerOpen, checkoutOpen } = useUi();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hydrated || items.length === 0 || pathname !== "/") return;
    try {
      if (window.sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      return;
    }
    if (loadPendingOrder()) return;
    const timer = setTimeout(() => {
      setShow(true);
      try {
        window.sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* noop */
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [hydrated, items.length, pathname]);

  useEffect(() => {
    if (drawerOpen || checkoutOpen) setShow(false);
  }, [drawerOpen, checkoutOpen]);

  if (!show || items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--nav-h,64px)+12px)] z-[90] flex justify-center px-3">
      <div className="bar-in pointer-events-auto flex items-center gap-2 rounded-full border border-gold-400/40 bg-ink-900/95 p-1.5 pr-2 shadow-pop backdrop-blur">
        <button onClick={() => { setShow(false); openDrawer(); }} className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 text-left">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-400 text-ink-900">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-[13px] font-semibold text-ink-50">{t("toast.bag")} · {formatUSD(total)}</span>
            <span className="block text-[11.5px] text-gold-300">{t("toast.view")} →</span>
          </span>
        </button>
        <button onClick={() => setShow(false)} aria-label="Cerrar" className="grid h-8 w-8 place-items-center rounded-full text-ink-500 hover:bg-white/5 hover:text-ink-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
