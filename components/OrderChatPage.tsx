"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import OrderChat from "@/components/OrderChat";
import { loadPendingOrder } from "@/lib/pending-order";
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
      setCreds({ orderId: order, token, message: "" });
      return;
    }
    const saved = loadPendingOrder();
    setCreds(saved && saved.stage === "pagado" ? { orderId: saved.ref, token: saved.token, message: saved.message } : "none");
  }, []);

  return (
    <section className="container-page max-w-lg py-10 sm:py-14">
      <div className="mb-6 flex justify-center">
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
      {creds && creds !== "none" && <OrderChat orderId={creds.orderId} token={creds.token} firstMessage={creds.message} />}
    </section>
  );
}
