"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, MessageCircle, X } from "lucide-react";
import { PENDING_EVENT, clearPendingOrder, loadPendingOrder, type PendingOrder } from "@/lib/pending-order";
import { fetchChat, notify } from "@/lib/chat-client";
import { useT } from "@/components/locale-context";
import { useUi } from "@/components/ui-context";
import { FULFILLMENT_LABEL, type Fulfillment } from "@/lib/fulfillment";

const POLL_MS = 15000;

/**
 * Píldora flotante del pedido en curso. Un solo toque lleva al chat.
 *
 * - `pagado`: muestra la referencia y cuántos mensajes hay sin leer.
 *   Desaparece sola cuando el pedido se entrega.
 * - `iniciado`: se fue a pagar y no volvió; pregunta y deja descartar.
 */
export default function PendingOrderBanner() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { checkoutOpen } = useUi();
  const [pending, setPending] = useState<PendingOrder | null>(null);
  const [unread, setUnread] = useState(0);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("recibido");

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
      setFulfillment(res.data.fulfillment);
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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center p-3 sm:justify-end sm:p-5">
      <div className="bar-in pointer-events-auto flex w-full max-w-md items-center gap-1 rounded-full border border-gold-400/40 bg-ink-900/95 p-1.5 pr-2 shadow-pop backdrop-blur sm:w-auto">
        <button onClick={() => router.push("/pedido")} className="group flex min-w-0 flex-1 items-center gap-3 rounded-full py-1 pl-1 pr-2 text-left">
          <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-400 text-ink-900 ${unread > 0 ? "pill-ping" : ""}`}>
            <MessageCircle className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span
                key={unread}
                className="badge-pop absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-ink-900"
              >
                {unread}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-ink-50">
              {paid ? `${t("pending.pill")} · ${pending.ref}` : t("pending.titleStarted")}
            </span>
            <span className={`block truncate text-[11.5px] ${unread > 0 ? "font-semibold text-gold-300" : "text-ink-400"}`}>
              {paid ? (unread > 0 ? t("pending.pillNew") : `${FULFILLMENT_LABEL[fulfillment]} · ${t("pending.pillHint")}`) : t("pending.bodyStarted")}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-gold-300" />
        </button>
        {!paid && (
          <button
            onClick={clearPendingOrder}
            aria-label={t("pending.discard")}
            title={t("pending.discard")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-500 transition hover:bg-white/5 hover:text-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
