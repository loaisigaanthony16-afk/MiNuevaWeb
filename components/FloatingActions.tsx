"use client";

import { useEffect, useState } from "react";
import { ChevronRight, MessageCircle, ShoppingBag } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { useT } from "@/components/locale-context";
import { formatUSD } from "@/lib/checkout-util";
import { loadPendingOrder, PENDING_EVENT } from "@/lib/pending-order";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * Accesos que acompañan al scroll:
 * - Barra de bolsa en el teléfono cuando hay productos: el botón de pagar
 *   siempre a un toque, sin volver arriba.
 * - Botón de WhatsApp para dudas antes de comprar.
 * Se ocultan mientras hay una capa abierta o un pedido pendiente, para no
 * competir con lo que la persona tiene que hacer en ese momento.
 */
export default function FloatingActions() {
  const t = useT();
  const { count, total, hydrated } = useStore();
  const { drawerOpen, openDrawer, quickProduct, addressOpen } = useUi();
  const [pending, setPending] = useState(false);
  const [past, setPast] = useState(false);

  useEffect(() => {
    const refresh = () => setPending(loadPendingOrder() !== null);
    refresh();
    window.addEventListener(PENDING_EVENT, refresh);
    window.addEventListener("storage", refresh);
    // El botón de WhatsApp aparece al dejar atrás la portada.
    const onScroll = () => setPast(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener(PENDING_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const isHidden = pending || drawerOpen || quickProduct || addressOpen;
  const showBar = hydrated && count > 0;
  const help = whatsappLink("Hola, tengo una consulta sobre Vibe 505.");

  return (
    <div className={isHidden ? 'pointer-events-none opacity-0 transition-opacity duration-200' : 'pointer-events-auto opacity-100 transition-opacity duration-200'}>
      {/* WhatsApp */}
      <a
        href={help}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("float.help")}
        className={`group fixed right-4 z-[60] flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-ink-900 shadow-pop transition-all duration-500 ease-smooth hover:pr-5 sm:right-6 ${
          showBar ? "bottom-[92px] md:bottom-6" : "bottom-5 sm:bottom-6"
        } ${past ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}
      >
        <span className="wa-ping absolute inset-0 rounded-full" aria-hidden />
        <MessageCircle className="relative h-5 w-5" />
        <span className="relative hidden max-w-0 overflow-hidden whitespace-nowrap text-[13px] font-semibold transition-all duration-500 group-hover:max-w-[160px] sm:inline">
          {t("float.help")}
        </span>
      </a>

      {/* Barra de bolsa (teléfono y tableta) */}
      {showBar && (
        <div className="fixed inset-x-0 bottom-0 z-[60] p-3 md:hidden">
          <button
            onClick={openDrawer}
            data-cart-target
            className="bar-in flex w-full items-center gap-3 rounded-full bg-gold-400 py-2.5 pl-2.5 pr-5 text-ink-900 shadow-pop active:scale-[0.98]"
          >
            <span className="relative grid h-11 w-11 place-items-center rounded-full bg-ink-900 text-gold-300">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            </span>
            <span className="flex-1 text-left">
              <span className="block text-[10.5px] font-semibold uppercase tracking-wide2 opacity-70">
                {t("float.bag")}
              </span>
              <span className="block font-display text-[17px] font-bold leading-tight tabular-nums">
                {formatUSD(total)}
              </span>
            </span>
            <span className="flex items-center gap-1 text-[13px] font-bold uppercase tracking-[0.08em]">
              {t("float.checkout")}
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
