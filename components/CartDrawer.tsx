"use client";

import { useMemo, useState } from "react";
import {
  CreditCard,
  Lock,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { getLine, getProduct } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { isDeliveryComplete } from "@/lib/delivery";
import { shippingModeFor } from "@/lib/shipping";
import {
  DELIVERY_ETA,
  FREE_SHIPPING_AT,
  formatNIO,
  formatUSD,
} from "@/lib/checkout-util";
import { ReviewMini, ReviewSummary } from "@/components/Reviews";
import { REVIEWS } from "@/lib/reviews";
import { useT } from "@/components/locale-context";

export default function CartDrawer() {
  const t = useT();
  const { drawerOpen, closeDrawer, openAddress, openCheckout, delivery } =
    useUi();
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

  const [error] = useState<string | null>(null);

  // Una reseña distinta por apertura, para que no sea siempre la misma.
  const reviewSeed = useMemo(
    () => Math.floor(Math.random() * REVIEWS.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawerOpen]
  );

  if (!drawerOpen) return null;

  const ready = isDeliveryComplete(delivery);

  // El cobro ocurre dentro del sitio, en el modal de Stripe Elements.
  function goToCheckout() {
    if (!ready) {
      openAddress();
      return;
    }
    openCheckout();
  }

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={t("cart.title")}>
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm fade-overlay"
        onClick={closeDrawer}
        aria-hidden
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] animate-slideIn flex-col border-l border-white/10 bg-ink-900 shadow-pop">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <h2 className="font-display text-[16px] font-bold uppercase tracking-[0.14em] text-ink-50">
            {t("cart.title")}
            {count > 0 && <span className="ml-2 text-ink-500">{count}</span>}
          </h2>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clear}
                className="text-[11px] font-semibold uppercase tracking-wide2 text-ink-500 transition hover:text-red-400"
              >
                {t("cart.clear")}
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

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10">
              <ShoppingBag className="h-6 w-6 text-ink-500" />
            </span>
            <p className="mt-6 font-display text-[16px] font-bold uppercase tracking-[0.1em] text-ink-50">
              {t("cart.empty")}
            </p>
            <p className="mt-2 text-[14px] text-ink-400">
              {t("cart.emptyBody")}
            </p>
            <button onClick={closeDrawer} className="btn-ghost mt-7">
              {t("cart.browse")}
            </button>

            <div className="mt-10 w-full">
              <ReviewSummary className="mb-3" />
              <ReviewMini offset={reviewSeed} />
            </div>
          </div>
        ) : (
          <>
            {/* Progreso a envío gratis */}
            <div className="border-b border-white/8 px-5 py-3.5">
              <div className="flex items-center justify-between text-[11.5px] font-semibold uppercase tracking-wide2">
                <span className="flex items-center gap-1.5 text-ink-400">
                  <Truck className="h-3.5 w-3.5" />
                  {missingForFree > 0 ? t("cart.shipping") : t("cart.free")}
                </span>
                <span className={missingForFree > 0 ? "text-ink-400" : "text-hybrid"}>
                  {missingForFree > 0
                    ? `${t("cart.missing")} ${formatUSD(missingForFree)}`
                    : t("cart.applied")}
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
                  <div key={item.id} className="flex gap-3.5 border-b border-white/6 p-5">
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
                            aria-label="-1"
                            className="flex h-8 w-8 items-center justify-center text-ink-400 transition hover:text-ink-50"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-[13px] font-semibold tabular-nums text-ink-50">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => changeQty(item.id, 1)}
                            aria-label="+1"
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

              {/* Prueba social dentro de la lista, sin interrumpir el flujo */}
              <div className="p-5">
                <ReviewMini offset={reviewSeed} />
              </div>
            </div>

            {/* Pie */}
            <div className="border-t border-white/8 p-5">
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
                    {t("nav.shipTo")}
                  </span>
                  {ready ? (
                    <>
                      <span className="mt-1 block truncate text-[13px] font-semibold text-ink-50">
                        {delivery!.alias} · {delivery!.region}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-ink-500">
                        {delivery!.address}
                      </span>
                      <span className="mt-1.5 block text-[11.5px] text-gold-300">
                        {t(shippingModeFor(delivery!.region).nameKey)} ·{" "}
                        {t(shippingModeFor(delivery!.region).etaKey)}
                      </span>
                    </>
                  ) : (
                    <span className="mt-1 block text-[13px] font-semibold text-gold-200">
                      {t("cart.needAddress")}
                    </span>
                  )}
                </span>
              </button>

              {/* Único medio de pago */}
              <div className="mt-3 flex items-center gap-2.5 rounded-[10px] border border-white/8 px-3.5 py-3">
                <CreditCard className="h-4 w-4 shrink-0 text-gold-300" />
                <span className="text-[12.5px] text-ink-300">
                  {t("cart.cardOnly")}
                </span>
              </div>

              {/* Totales */}
              <div className="mt-4 space-y-2 border-t border-white/8 pt-4 text-[13px]">
                <Row label={t("cart.subtotal")} value={formatUSD(subtotal)} />
                <Row
                  label={t("cart.shipping")}
                  value={shipping === 0 ? t("cart.freeWord") : formatNIO(shipping)}
                  accent={shipping === 0}
                />
                <div className="flex items-baseline justify-between pt-2">
                  <span className="font-display text-[13px] font-bold uppercase tracking-wide2 text-ink-50">
                    {t("cart.total")}
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

              <button
                onClick={goToCheckout}
                className="btn-primary mt-4 w-full"
              >
                <Lock className="h-4 w-4" />
                {ready ? t("cart.pay") : t("cart.needAddress")}
              </button>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-ink-500">
                  {t("cart.deliveryIn")} {DELIVERY_ETA} · {t("cart.freeFrom")} $
                  {FREE_SHIPPING_AT}
                </p>
                <ReviewSummary />
              </div>
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
