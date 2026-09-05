"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, MessageCircle } from "lucide-react";
import {
  PENDING_EVENT,
  clearPendingOrder,
  loadPendingOrder,
  type PendingOrder,
} from "@/lib/pending-order";
import { whatsappLink } from "@/lib/whatsapp";
import { useT } from "@/components/locale-context";

/**
 * Aviso persistente de pedido pagado sin coordinar.
 *
 * Si alguien cerró la pestaña antes de mandar sus datos por WhatsApp, el
 * pedido quedó pagado y nosotros sin dirección. Este banner reaparece en
 * cada visita hasta que se envíe.
 *
 * No se puede descartar: solo desaparece al abrir el chat, que es
 * justamente la acción que falta.
 */
export default function PendingOrderBanner() {
  const t = useT();
  const [pending, setPending] = useState<PendingOrder | null>(null);

  const refresh = useCallback(() => {
    setPending(loadPendingOrder());
  }, []);

  useEffect(() => {
    // Se lee tras el montaje para no romper la hidratación.
    refresh();
    window.addEventListener(PENDING_EVENT, refresh);
    // Si la persona lo resuelve en otra pestaña, esta se entera.
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PENDING_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  if (!pending) return null;

  function send() {
    if (!pending) return;
    // Se abre el chat y recién ahí se retira el aviso.
    window.open(whatsappLink(pending.message), "_blank", "noopener,noreferrer");
    clearPendingOrder();
    setPending(null);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4">
      <div className="container-page max-w-3xl">
        <button
          onClick={send}
          className="group flex w-full items-center gap-3 rounded-card border border-gold-400/50 bg-ink-850/95 p-4 text-left shadow-pop backdrop-blur transition-colors duration-300 hover:border-gold-400 sm:gap-4 sm:p-5"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-400/15">
            <AlertTriangle className="h-[18px] w-[18px] text-gold-300" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block font-display text-[12.5px] font-bold uppercase tracking-[0.1em] text-gold-200">
              {t("pending.title")}
            </span>
            <span className="mt-1 block text-[13px] leading-snug text-ink-300">
              {t("pending.body")}
            </span>
            <span className="mt-1 block font-mono text-[11px] text-ink-500">
              {pending.ref}
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-wide2 text-ink-900 transition-transform duration-300 group-hover:scale-[1.03]">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t("pending.cta")}</span>
          </span>
        </button>
      </div>
    </div>
  );
}
