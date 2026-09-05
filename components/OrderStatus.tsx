"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Lock, MessageCircle, PackageCheck, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { getProduct } from "@/lib/data";
import { useUi } from "@/components/ui-context";
import { useT } from "@/components/locale-context";
import { shippingModeFor } from "@/lib/shipping";
import Wordmark from "@/components/Wordmark";
import { buildWhatsappMessage, whatsappLink } from "@/lib/whatsapp";

type Status = "success" | "canceled" | null;

/**
 * Cierre del pedido.
 *
 * La pasarela devuelve a `/?success=true&ref=…` o `/?canceled=true`. Sin
 * esto la persona caía en la portada sin saber si su pago pasó y con la
 * bolsa aún llena.
 *
 * El resumen de entrega se arma acá, en el dispositivo, con lo que ya
 * estaba guardado en el navegador: la dirección nunca pasó por el servidor
 * ni por la pasarela, así que esta es la vía por la que el comercio la
 * recibe.
 */
export default function OrderStatus() {
  const t = useT();
  const { items, clear, hydrated } = useStore();
  const { delivery, deliveryLoaded } = useUi();

  const [status, setStatus] = useState<Status>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [waLink, setWaLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const settled = useRef(false);

  // 1) Al montar: leer el resultado de la URL y dejarla limpia.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ok = params.get("success") === "true";
    const no = params.get("canceled") === "true";
    if (!ok && !no) return;

    if (ok) setRef(params.get("ref"));
    setStatus(ok ? "success" : "canceled");

    // Recargar no debe repetir el aviso.
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  // 2) Ya rehidratado el navegador: armar el resumen y vaciar la bolsa.
  //    Antes de esto, `items` y `delivery` todavía están vacíos.
  useEffect(() => {
    if (status !== "success" || settled.current) return;
    if (!hydrated || !deliveryLoaded) return;
    settled.current = true;

    const detailed = items
      .map((it) => {
        const p = getProduct(it.id);
        return p ? { qty: it.qty, name: p.name } : null;
      })
      .filter((l): l is { qty: number; name: string } => l !== null);

    const lines = detailed.map((l) => `${l.qty}x ${l.name}`).join(", ");

    // El mensaje se arma acá, en el dispositivo: es la vía por la que el
    // comercio recibe la dirección sin que pase por ningún servidor nuestro.
    setWaLink(
      whatsappLink(
        buildWhatsappMessage({
          orderId: ref,
          lines: detailed,
          delivery,
          totalUsd: items.reduce((acc, it) => acc + it.price * it.qty, 0),
        })
      )
    );

    setSummary(
      [
        ref ? `Pedido: ${ref}` : "",
        lines ? `Artículos: ${lines}` : "",
        delivery ? `Recibe: ${delivery.alias}` : "",
        delivery ? `Tel: ${delivery.phone}` : "",
        delivery ? `Zona: ${delivery.region}` : "",
        delivery ? `Dirección: ${delivery.address}` : "",
        delivery?.notes ? `Referencias: ${delivery.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );

    clear();
  }, [status, hydrated, deliveryLoaded, items, delivery, ref, clear]);

  useEffect(() => {
    if (!status) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [status]);

  if (!status) return null;

  const mode = delivery?.region ? shippingModeFor(delivery.region) : null;
  const ok = status === "success";

  function copySummary() {
    if (!summary) return;
    try {
      void navigator.clipboard?.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-ink-950/95 py-10 backdrop-blur-md fade-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ok ? t("order.okTitle") : t("order.noTitle")}
    >
      <div className="modal-pop container-page max-w-lg">
        <div className="surface p-8 text-center sm:p-10">
          <div className="flex justify-center">
            <Wordmark />
          </div>

          <span
            className={`mx-auto mt-8 grid h-14 w-14 place-items-center rounded-full border ${
              ok
                ? "border-hybrid/40 bg-hybrid/10"
                : "border-white/12 bg-white/[0.03]"
            }`}
          >
            {ok ? (
              <Check className="h-6 w-6 text-hybrid" />
            ) : (
              <X className="h-6 w-6 text-ink-300" />
            )}
          </span>

          <h2 className="mt-6 font-display text-[26px] font-medium uppercase leading-tight tracking-tightest text-ink-50">
            {ok ? t("order.okTitle") : t("order.noTitle")}
          </h2>

          <p className="mx-auto mt-4 max-w-sm text-[14.5px] leading-relaxed text-ink-400">
            {ok ? t("order.okBody") : t("order.noBody")}
          </p>

          {ok && ref && (
            <div className="mt-7 rounded-card border border-white/10 bg-white/[0.03] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide3 text-ink-500">
                {t("order.ref")}
              </p>
              <p className="mt-2 font-display text-[22px] font-bold tracking-tight text-gold-gradient">
                {ref}
              </p>
            </div>
          )}

          {ok && waLink && (
            <div className="mt-6">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn w-full bg-[#25D366] text-ink-900 hover:bg-[#1fbe5a]"
              >
                <MessageCircle className="h-4 w-4" />
                {t("order.whatsapp")}
              </a>
              <p className="mt-3 flex items-start gap-2 text-left text-[12px] leading-relaxed text-ink-500">
                <Lock className="mt-0.5 h-3 w-3 shrink-0 text-hybrid" />
                {t("order.whatsappBody")}
              </p>
            </div>
          )}

          {ok && summary && (
            <div className="mt-4 rounded-card border border-white/10 bg-white/[0.02] p-4 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wide3 text-ink-500">
                {t("order.summary")}
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-400">
                {t("order.summaryBody")}
              </p>
              <pre className="mt-3 max-h-36 overflow-y-auto whitespace-pre-wrap break-words rounded-[8px] bg-ink-950 p-3 font-mono text-[11px] leading-relaxed text-ink-300">
                {summary}
              </pre>
              <button onClick={copySummary} className="btn-ghost mt-3 w-full">
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? t("order.copied") : t("order.copy")}
              </button>
            </div>
          )}

          {ok && (
            <ol className="mt-7 space-y-3 text-left text-[13.5px] leading-relaxed text-ink-400">
              {[
                t("order.step1"),
                mode
                  ? `${t("order.step2")} ${t(mode.nameKey)} · ${t(mode.etaKey)}.`
                  : t("order.step2Generic"),
                t("order.step3"),
              ].map((line, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-display text-[12px] font-bold tabular-nums text-gold-300">
                    0{i + 1}
                  </span>
                  {line}
                </li>
              ))}
            </ol>
          )}

          <button
            onClick={() => setStatus(null)}
            className={`${ok ? "btn-gold" : "btn-primary"} mt-8 w-full`}
          >
            {ok ? (
              <>
                <PackageCheck className="h-4 w-4" />
                {t("order.done")}
              </>
            ) : (
              t("order.retry")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
