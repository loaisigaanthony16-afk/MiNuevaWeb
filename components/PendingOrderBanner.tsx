"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, MessageCircle } from "lucide-react";
import { PENDING_EVENT, clearPendingOrder, loadPendingOrder, type PendingOrder } from "@/lib/pending-order";
import { fetchChat, notify } from "@/lib/chat-client";
import { useT } from "@/components/locale-context";
import { useUi } from "@/components/ui-context";

const POLL_MS = 15000;

/**
 * Aviso persistente del pedido en curso.
 *
 * - `iniciado`: se fue a pagar y no volvió; pregunta y deja descartar.
 * - `pagado`: chat abierto con el comercio; muestra mensajes sin leer y
 *   lleva a la conversación. Desaparece solo cuando el pedido se entrega.
 */
export default function PendingOrderBanner() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { checkoutOpen } = useUi();
  const [pending, setPending] = useState<PendingOrder | null>(null);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(() => setPending(loadPendingOrder()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(PENDING_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PENDING_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  // Mensajes sin leer del comercio, sin abrir el chat.
  useEffect(() => {
    if (!pending || pending.stage !== "pagado") return;
    let last = 0;
    const tick = async () => {
      const res = await fetchChat(pending.ref, pending.token, 0, false);
      if (!res.ok) {
        if (res.reason === "closed") clearPendingOrder();
        return;
      }
      if (res.data.delivered) {
        clearPendingOrder();
        return;
      }
      setUnread(res.data.unread);
      if (res.data.unread > last) notify("Vibe 505", t("pending.newMessage"));
      last = res.data.unread;
    };
    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [pending, t]);

  const hidden = !pending || checkoutOpen || pathname === "/order-success" || pathname === "/pedido" || pathname === "/admin";
  if (hidden) return null;

  const paid = pending.stage === "pagado";

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4">
      <div className="container-page max-w-3xl">
        <div className={`rounded-card border bg-ink-850/95 shadow-pop backdrop-blur ${paid ? "border-gold-400/50" : "border-white/15"}`}>
          <button onClick={() => router.push("/pedido")} className="group flex w-full items-center gap-3 p-4 text-left sm:gap-4 sm:p-5">
            <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full ${paid ? "bg-gold-400/15" : "bg-white/8"}`}>
              {paid ? <MessageCircle className="h-[18px] w-[18px] text-gold-300" /> : <AlertTriangle className="h-[18px] w-[18px] text-ink-300" />}
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block font-display text-[12.5px] font-bold uppercase tracking-[0.1em] ${paid ? "text-gold-200" : "text-ink-100"}`}>
                {paid ? (unread > 0 ? t("pending.newMessage") : t("pending.title")) : t("pending.titleStarted")}
              </span>
              <span className="mt-1 block text-[13px] leading-snug text-ink-300">{paid ? t("pending.body") : t("pending.bodyStarted")}</span>
              <span className="mt-1 block font-mono text-[11px] text-ink-500">{pending.ref}</span>
            </span>
            <span className="shrink-0 rounded-full bg-gold-400 px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-wide2 text-ink-900 transition-transform duration-300 group-hover:scale-[1.03]">
              {t("pending.cta")}
            </span>
          </button>
          {!paid && (
            <div className="border-t border-white/8 px-5 py-2.5 text-center">
              <button onClick={clearPendingOrder} className="text-[11.5px] text-ink-500 transition hover:text-ink-200">
                {t("pending.discard")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
