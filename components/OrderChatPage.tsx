"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import OrderChat from "@/components/OrderChat";
import { loadPendingOrder, savePendingOrder } from "@/lib/pending-order";
import { useT } from "@/components/locale-context";

/**
 * /pedido: vuelve al chat del pedido. El token viene del navegador
 * (guardado al pagar) o del enlace ?order=&t= si se abrió desde otro
 * dispositivo.
 */
export default function OrderChatPage() {
  const t = useT();
  const [creds, setCreds] = useState<{ orderId: string; token: string; message: string } | null | "none">(null);

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
      setCreds({ orderId: order, token, message: "" });
      return;
    }
    const saved = loadPendingOrder();
    setCreds(saved && saved.stage === "pagado" ? { orderId: saved.ref, token: saved.token, message: saved.message } : "none");
  }, []);

  return (
    <section className="container-page max-w-lg py-8 sm:py-14">
      <div className="mb-7 flex justify-center">
        <Wordmark />
      </div>

      {creds === null && <p className="text-center text-[13px] text-ink-500">…</p>}

      {creds === "none" && (
        <div className="rounded-[20px] border border-[#262626] p-8 text-center">
          <p className="font-display text-[20px] font-semibold uppercase text-ink-50">{t("chat.noneTitle")}</p>
          <p className="mt-2 text-[13.5px] text-ink-400">{t("chat.noneBody")}</p>
          <Link href="/" className="btn-gold mt-6">{t("order.retry")}</Link>
        </div>
      )}

      {creds && creds !== "none" && (
        <div className="text-center">
          <p className="kicker rise justify-center" style={{ "--i": 0 } as React.CSSProperties}>{t("order.kicker")}</p>
          <div className="rise mt-3" style={{ "--i": 1 } as React.CSSProperties}>
            <p className="font-display text-[30px] font-bold tracking-tight text-gold-gradient">{creds.orderId}</p>
            <span className="ref-line mx-auto mt-2 block w-24" />
          </div>
          <p className="rise mt-3 flex items-center justify-center gap-2 text-[12.5px] text-ink-400" style={{ "--i": 2 } as React.CSSProperties}>
            <span className="co-live h-1.5 w-1.5 rounded-full bg-hybrid" />
            {t("order.status")}
          </p>
          <div className="chat-card mt-6" style={{ "--i": 3 } as React.CSSProperties}>
            <OrderChat orderId={creds.orderId} token={creds.token} firstMessage={creds.message} />
          </div>
          <Link href="/" className="btn-ghost rise mt-6 w-full" style={{ "--i": 5 } as React.CSSProperties}>
            {t("order.done")}
          </Link>
        </div>
      )}
    </section>
  );
}
