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
 * Aviso persistente de pedido sin coordinar.
 *
 * Se guarda al salir hacia la pasarela, así que aparece incluso si esta no
 * devuelve al cliente al sitio. Es la red que impide que un pedido pagado
 * se quede sin dirección de entrega.
 *
 * Dos tonos según el punto en que quedó:
 * - `pagado` (volvió por el success_url): exigente y sin forma de cerrar.
 * - `iniciado` (se fue a pagar y no sabemos si completó): pregunta en vez
 *   de afirmar, y deja descartarlo si nunca llegó a pagar.
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

  const paid = pending.stage === "pagado";

  function send() {
    if (!pending) return;
    // Se abre el chat y recién ahí se retira el aviso.
    window.open(whatsappLink(pending.message), "_blank", "noopener,noreferrer");
    clearPendingOrder();
    setPending(null);
  }

  function discard() {
    clearPendingOrder();
    setPending(null);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4">
      <div className="container-page max-w-3xl">
        <div
          className={`rounded-card border bg-ink-850/95 shadow-pop backdrop-blur ${
            paid ? "border-gold-400/50" : "border-white/15"
          }`}
        >
          <button
            onClick={send}
            className="group flex w-full items-center gap-3 p-4 text-left sm:gap-4 sm:p-5"
          >
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                paid ? "bg-gold-400/15" : "bg-white/8"
              }`}
            >
              <AlertTriangle
                className={`h-[18px] w-[18px] ${
                  paid ? "text-gold-300" : "text-ink-300"
                }`}
              />
            </span>

            <span className="min-w-0 flex-1">
              <span
                className={`block font-display text-[12.5px] font-bold uppercase tracking-[0.1em] ${
                  paid ? "text-gold-200" : "text-ink-100"
                }`}
              >
                {paid ? t("pending.title") : t("pending.titleStarted")}
              </span>
              <span className="mt-1 block text-[13px] leading-snug text-ink-300">
                {paid ? t("pending.body") : t("pending.bodyStarted")}
              </span>
              {pending.ref && (
                <span className="mt-1 block font-mono text-[11px] text-ink-500">
                  {pending.ref}
                </span>
              )}
            </span>

            <span className="flex shrink-0 items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-wide2 text-ink-900 transition-transform duration-300 group-hover:scale-[1.03]">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{t("pending.cta")}</span>
            </span>
          </button>

          {/* Solo quien no llegó a pagar puede descartarlo. Un pedido ya
              pagado no se cierra: sin sus datos no se puede despachar. */}
          {!paid && (
            <div className="border-t border-white/8 px-5 py-2.5 text-center">
              <button
                onClick={discard}
                className="text-[11.5px] text-ink-500 transition hover:text-ink-200"
              >
                {t("pending.discard")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
