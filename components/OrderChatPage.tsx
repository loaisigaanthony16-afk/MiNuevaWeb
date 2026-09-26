"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import OrderChat from "@/components/OrderChat";
import { loadPendingOrders, PENDING_EVENT, savePendingOrder, type PendingOrder } from "@/lib/pending-order";
import { useT } from "@/components/locale-context";

/**
 * /pedido: vuelve al chat del pedido. El token viene del navegador
 * (guardado al pagar) o del enlace ?order=&t= si se abrió desde otro
 * dispositivo. Con varios pedidos abiertos se elige cuál ver.
 */
export default function OrderChatPage() {
  const t = useT();
  const router = useRouter();
  const [orders, setOrders] = useState<PendingOrder[] | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const order = p.get("order");
    const token = p.get("t");
    if (order && token) {
      // Abierto desde un enlace: queda guardado en este dispositivo para
      // que el aviso de mensajes nuevos funcione en todo el sitio, y el
      // token sale de la barra de direcciones.
      savePendingOrder({ stage: "pagado", ref: order, token, message: "" });
      window.history.replaceState(null, "", "/pedido");
      setCurrent(order);
    }

    const refresh = () => {
      const all = loadPendingOrders();
      const paid = all.filter((o) => o.stage === "pagado");
      // Solo un pago sin confirmar: se verifica en la página del cobro.
      if (!paid.length && all.length) {
        router.replace(`/order-success?order_id=${encodeURIComponent(all[0].ref)}`);
        return;
      }
      setOrders(paid);
    };
    refresh();
    // Un pedido entregado sale de la lista, pero su chat sigue a la vista
    // (con el aviso de entregado) hasta que se cambie de pedido.
    window.addEventListener(PENDING_EVENT, refresh);
    return () => window.removeEventListener(PENDING_EVENT, refresh);
  }, [router]);

  const [shown, setShown] = useState<PendingOrder | null>(null);
  useEffect(() => {
    if (!orders) return;
    setShown((prev) => {
      const wanted = current ?? prev?.ref ?? null;
      return orders.find((o) => o.ref === wanted) ?? (prev && prev.ref === wanted ? prev : orders[0] ?? null);
    });
  }, [orders, current]);

  return (
    <section className="container-page max-w-lg py-8 sm:py-14">
      <div className="mb-7 flex justify-center">
        <Wordmark />
      </div>

      {orders === null && <p className="text-center text-[13px] text-ink-500">…</p>}

      {orders !== null && !shown && (
        <div className="rounded-[20px] border border-[#262626] p-8 text-center">
          <p className="font-display text-[20px] font-semibold uppercase text-ink-50">{t("chat.noneTitle")}</p>
          <p className="mt-2 text-[13.5px] text-ink-400">{t("chat.noneBody")}</p>
          <Link href="/" className="btn-gold mt-6">{t("order.retry")}</Link>
        </div>
      )}

      {shown && (
        <div className="text-center">
          {orders && orders.length > 1 && (
            <div className="rise mb-6 flex flex-wrap justify-center gap-1.5" role="tablist" aria-label={t("order.kicker")}>
              {orders.map((o) => (
                <button
                  key={o.ref}
                  role="tab"
                  aria-selected={o.ref === shown.ref}
                  onClick={() => setCurrent(o.ref)}
                  className={`rounded-full px-3 py-1.5 font-mono text-[11.5px] transition ${
                    o.ref === shown.ref ? "bg-ink-50 text-ink-900" : "border border-white/10 text-ink-400 hover:text-ink-50"
                  }`}
                >
                  {o.ref}
                </button>
              ))}
            </div>
          )}
          <p className="kicker rise justify-center" style={{ "--i": 0 } as React.CSSProperties}>{t("order.kicker")}</p>
          <div className="rise mt-3" style={{ "--i": 1 } as React.CSSProperties}>
            <p className="font-display text-[30px] font-bold tracking-tight text-gold-gradient">{shown.ref}</p>
            <span className="ref-line mx-auto mt-2 block w-24" />
          </div>
          <div className="chat-card mt-6" style={{ "--i": 3 } as React.CSSProperties}>
            <OrderChat key={shown.ref} orderId={shown.ref} token={shown.token} firstMessage={shown.message} />
          </div>
          <Link href="/" className="btn-ghost rise mt-6 w-full" style={{ "--i": 5 } as React.CSSProperties}>
            {t("order.done")}
          </Link>
        </div>
      )}
    </section>
  );
}
