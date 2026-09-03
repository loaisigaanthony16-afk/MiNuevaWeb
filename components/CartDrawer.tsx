"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { getLine, getProduct, DEFAULT_ITEM_LABEL } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { isDeliveryComplete } from "@/lib/delivery";
import {
  DELIVERY_ETA,
  FREE_SHIPPING_AT,
  PAYMENT_LABEL,
  buildOrderPayload,
  encodeOrder,
  formatNIO,
  formatUSD,
  makeOrderCode,
  type BankMethod,
  type PaymentChannel,
} from "@/lib/checkout-util";

const BANKS: BankMethod[] = ["BAC", "Banpro", "LAFISE"];

export default function CartDrawer() {
  const { drawerOpen, closeDrawer, openAddress, delivery } = useUi();
  const {
    items,
    subtotal,
    shipping,
    total,
    count,
    missingForFree,
    freeProgress,
    changeQty,
    remove,
    clear,
  } = useStore();

  const [channel, setChannel] = useState<PaymentChannel>("card");
  const [bank, setBank] = useState<BankMethod>("BAC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<{ code: string; blob: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!drawerOpen) return null;

  const ready = isDeliveryComplete(delivery);

  async function handleCard() {
    if (!ready) {
      openAddress();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalAmount: total }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "No se pudo iniciar el pago.");
    } catch {
      setError("Error de conexión con la pasarela.");
    } finally {
      setLoading(false);
    }
  }

  function handleCode() {
    if (!ready || !delivery) {
      openAddress();
      return;
    }
    const payload = buildOrderPayload({
      items: items.map((it) => ({
        id: it.id,
        name: getProduct(it.id)?.name ?? DEFAULT_ITEM_LABEL,
        qty: it.qty,
        price: it.price,
      })),
      delivery,
      payment: channel,
      bank: channel === "bank" ? bank : undefined,
      subtotalUsd: subtotal,
      shippingUsd: shipping,
      totalUsd: total,
    });
    setOrder({ code: makeOrderCode(), blob: encodeOrder(payload) });
  }

  function copyOrder() {
    if (!order) return;
    const text = `${order.code}\n\n${order.blob}`;
    try {
      void navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Tu bolsa">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm fade-overlay"
        onClick={closeDrawer}
        aria-hidden
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] animate-slideIn flex-col border-l border-white/10 bg-ink-900 shadow-pop">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <h2 className="font-display text-[16px] font-bold uppercase tracking-[0.14em] text-ink-50">
            Tu bolsa
            {count > 0 && <span className="ml-2 text-ink-500">{count}</span>}
          </h2>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clear}
                className="text-[11px] font-semibold uppercase tracking-wide2 text-ink-500 transition hover:text-red-400"
              >
                Vaciar
              </button>
            )}
            <button
              onClick={closeDrawer}
              aria-label="Cerrar"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-400 transition hover:bg-white/5 hover:text-ink-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {order ? (
          <OrderReceipt
            order={order}
            copied={copied}
            onCopy={copyOrder}
            onNew={() => {
              setOrder(null);
              clear();
              closeDrawer();
            }}
          />
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10">
              <ShoppingBag className="h-6 w-6 text-ink-500" />
            </span>
            <p className="mt-6 font-display text-[16px] font-bold uppercase tracking-[0.1em] text-ink-50">
              Tu bolsa está vacía
            </p>
            <p className="mt-2 text-[14px] text-ink-400">
              Explorá las cuatro líneas del catálogo.
            </p>
            <button onClick={closeDrawer} className="btn-ghost mt-7">
              Ver catálogo
            </button>
          </div>
        ) : (
          <>
            {/* Progreso a envío gratis */}
            <div className="border-b border-white/8 px-5 py-3.5">
              <div className="flex items-center justify-between text-[11.5px] font-semibold uppercase tracking-wide2">
                <span className="flex items-center gap-1.5 text-ink-400">
                  <Truck className="h-3.5 w-3.5" />
                  {missingForFree > 0 ? "Envío nacional" : "Envío gratis"}
                </span>
                <span className={missingForFree > 0 ? "text-ink-400" : "text-hybrid"}>
                  {missingForFree > 0
                    ? `Faltan ${formatUSD(missingForFree)}`
                    : "Aplicado"}
                </span>
              </div>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gold-400 transition-all duration-700 ease-smooth"
                  style={{ width: `${freeProgress * 100}%` }}
                />
              </div>
            </div>

            {/* Artículos */}
            <div className="no-scrollbar flex-1 overflow-y-auto">
              {items.map((item) => {
                const p = getProduct(item.id);
                if (!p) return null;
                return (
                  <div
                    key={item.id}
                    className="flex gap-3.5 border-b border-white/6 p-5"
                  >
                    <div className="h-[74px] w-[64px] shrink-0 overflow-hidden rounded-[10px] border border-white/8">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.img}
                        alt={p.name}
                        className="h-full w-full object-contain p-1"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[13px] font-bold uppercase leading-tight tracking-[0.05em] text-ink-50">
                        {p.name}
                      </p>
                      <p className="mt-1 text-[11.5px] text-ink-500">
                        {getLine(p.line).name}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-full border border-white/10">
                          <button
                            onClick={() => changeQty(item.id, -1)}
                            aria-label="Quitar uno"
                            className="flex h-8 w-8 items-center justify-center text-ink-400 transition hover:text-ink-50"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-[13px] font-semibold tabular-nums text-ink-50">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => changeQty(item.id, 1)}
                            aria-label="Agregar uno"
                            className="flex h-8 w-8 items-center justify-center text-ink-400 transition hover:text-ink-50"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-display text-[14px] font-bold tabular-nums text-ink-50">
                            {formatUSD(item.price * item.qty)}
                          </span>
                          <button
                            onClick={() => remove(item.id)}
                            aria-label={`Eliminar ${p.name}`}
                            className="text-ink-600 transition hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pie: dirección, pago y totales */}
            <div className="border-t border-white/8 p-5">
              {/* Dirección */}
              <button
                onClick={openAddress}
                className={`flex w-full items-start gap-3 rounded-[10px] border p-3.5 text-left transition-all duration-300 ease-smooth ${
                  ready
                    ? "border-white/10 hover:border-white/25"
                    : "border-gold-400/40 bg-gold-400/[0.06] hover:border-gold-400"
                }`}
              >
                <MapPin
                  className={`mt-0.5 h-4 w-4 shrink-0 ${ready ? "text-gold-300" : "text-gold-400"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide2 text-ink-400">
                    Enviar a
                  </span>
                  {ready ? (
                    <>
                      <span className="mt-1 block truncate text-[13px] font-semibold text-ink-50">
                        {delivery!.alias} · {delivery!.region}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-ink-500">
                        {delivery!.address}
                      </span>
                    </>
                  ) : (
                    <span className="mt-1 block text-[13px] font-semibold text-gold-200">
                      Agregar dirección de entrega
                    </span>
                  )}
                </span>
              </button>

              {/* Pago */}
              <div className="mt-4 grid grid-cols-3 gap-1.5">
                {(Object.keys(PAYMENT_LABEL) as PaymentChannel[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setChannel(c)}
                    className={`h-10 rounded-[9px] border text-[12px] font-bold uppercase tracking-[0.08em] transition-all duration-300 ease-smooth ${
                      channel === c
                        ? "border-transparent bg-ink-50 text-ink-900"
                        : "border-white/10 text-ink-400 hover:border-white/25 hover:text-ink-100"
                    }`}
                  >
                    {PAYMENT_LABEL[c]}
                  </button>
                ))}
              </div>

              {channel === "bank" && (
                <div className="mt-2 flex gap-1.5">
                  {BANKS.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBank(b)}
                      className={`flex-1 rounded-[7px] py-2 text-[11.5px] font-bold uppercase tracking-[0.08em] transition ${
                        bank === b
                          ? "bg-gold-400/15 text-gold-200"
                          : "bg-white/5 text-ink-500 hover:text-ink-200"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}

              {/* Totales */}
              <div className="mt-4 space-y-2 border-t border-white/8 pt-4 text-[13px]">
                <Row label="Subtotal" value={formatUSD(subtotal)} />
                <Row
                  label="Envío nacional"
                  value={shipping === 0 ? "Gratis" : formatUSD(shipping)}
                  accent={shipping === 0}
                />
                <div className="flex items-baseline justify-between pt-2">
                  <span className="font-display text-[13px] font-bold uppercase tracking-wide2 text-ink-50">
                    Total
                  </span>
                  <span className="text-right">
                    <span className="block font-display text-[22px] font-bold leading-none tabular-nums text-ink-50">
                      {formatUSD(total)}
                    </span>
                    <span className="mt-1 block text-[11.5px] tabular-nums text-ink-500">
                      {formatNIO(total)}
                    </span>
                  </span>
                </div>
              </div>

              {error && (
                <p className="mt-3 text-center text-[12px] text-red-400">{error}</p>
              )}

              {/* Acciones */}
              {channel === "card" ? (
                <button
                  onClick={handleCard}
                  disabled={loading}
                  className="btn-primary mt-4 w-full disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  {ready ? "Pagar con tarjeta" : "Agregar dirección"}
                </button>
              ) : (
                <button onClick={handleCode} className="btn-gold mt-4 w-full">
                  <Lock className="h-4 w-4" />
                  {ready ? "Generar código de pedido" : "Agregar dirección"}
                </button>
              )}

              <p className="mt-3 text-center text-[11px] text-ink-500">
                Entrega en {DELIVERY_ETA} · Gratis desde ${FREE_SHIPPING_AT}
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-400">{label}</span>
      <span className={`tabular-nums ${accent ? "text-hybrid" : "text-ink-100"}`}>
        {value}
      </span>
    </div>
  );
}

function OrderReceipt({
  order,
  copied,
  onCopy,
  onNew,
}: {
  order: { code: string; blob: string };
  copied: boolean;
  onCopy: () => void;
  onNew: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400/10">
        <Check className="h-5 w-5 text-gold-300" />
      </span>

      <h3 className="mt-5 font-display text-[22px] font-bold uppercase leading-tight tracking-tightest text-ink-50">
        Pedido listo
      </h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-400">
        Guardá este código: es lo único que necesitás. Lleva adentro tu pedido y
        tu dirección, cifrados.
      </p>

      <div className="mt-6 rounded-card border border-white/10 bg-white/[0.03] p-5 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide3 text-ink-500">
          Tu código
        </p>
        <p className="mt-2 font-display text-[30px] font-bold tabular-nums tracking-tight text-gold-gradient">
          {order.code}
        </p>
      </div>

      <div className="mt-4 rounded-[10px] border border-white/8 bg-ink-950 p-3">
        <p className="break-all font-mono text-[10.5px] leading-relaxed text-ink-500">
          {order.blob.slice(0, 180)}…
        </p>
      </div>

      <button onClick={onCopy} className="btn-ghost mt-4 w-full">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copiado" : "Copiar código y resumen"}
      </button>

      <ol className="mt-6 space-y-3 text-[13px] leading-relaxed text-ink-400">
        {[
          "Guardá o copiá tu código antes de cerrar.",
          "Enviálo por el canal privado que preferís para confirmar el pago.",
          `Recibís en empaque neutro en ${DELIVERY_ETA}.`,
        ].map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-display text-[12px] font-bold tabular-nums text-gold-300">
              0{i + 1}
            </span>
            {t}
          </li>
        ))}
      </ol>

      <button onClick={onNew} className="btn-primary mt-7 w-full">
        Listo
      </button>
    </div>
  );
}
