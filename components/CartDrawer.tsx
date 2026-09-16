"use client";

import {
  ChevronRight,
  Clock,
  CreditCard,
  Lock,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";
import { getBrand, getProduct, STRAIN_LABEL } from "@/lib/data";
import { deliversToday } from "@/lib/delivery-window";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { isDeliveryComplete } from "@/lib/delivery";
import {
  DELIVERY_FEE_NIO,
  DELIVERY_ZONE,
  formatNIO,
  formatUSD,
} from "@/lib/checkout-util";
import { useT } from "@/components/locale-context";
import CardLogos from "@/components/CardLogos";
import ReferralCode from "@/components/ReferralCode";

export default function CartDrawer() {
  const t = useT();
  const { drawerOpen, closeDrawer, openAddress, openCheckout, delivery } = useUi();
  const { items, subtotal, total, count, changeQty, remove, clear } = useStore();
  const [confirmClear, setConfirmClear] = useState(false);
  const [coupon, setCoupon] = useState(0);

  if (!drawerOpen) return null;

  const ready = isDeliveryComplete(delivery);
  const today = deliversToday();
  // Cupón de cliente frecuente (lo confirma el servidor al cobrar).
  const payable = Math.max(0, total - coupon);

  // Precio de lista y ahorro, solo para mostrar: el cobro usa el precio
  // con descuento que calcula el servidor.
  const listSubtotal = items.reduce(
    (acc, it) => acc + (getProduct(it.id)?.listPrice ?? it.price) * it.qty,
    0
  );
  const savings = Math.max(0, listSubtotal - subtotal);

  // El cobro pasa en un modal: la persona no sale del sitio.
  function goToCheckout() {
    if (!ready) {
      openAddress();
      return;
    }
    openCheckout();
  }

  function handleClear() {
    if (confirmClear) {
      clear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  }

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={t("cart.title")}>
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm fade-overlay"
        onClick={closeDrawer}
        aria-hidden
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] animate-slideIn flex-col bg-ink-900 shadow-pop sm:border-l sm:border-white/8">
        {/* Cabecera */}
        <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-6">
          <h2 className="font-display text-[20px] font-semibold uppercase tracking-[0.08em] text-ink-50">
            {t("cart.title")}
            {count > 0 && (
              <span className="ml-2 align-middle text-[13px] font-medium tabular-nums text-ink-500">
                {count}
              </span>
            )}
          </h2>
          <button
            onClick={closeDrawer}
            aria-label={t("cart.close")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-400 transition hover:bg-white/5 hover:text-ink-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 pb-16 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.03]">
              <ShoppingBag className="h-7 w-7 text-ink-500" />
            </span>
            <p className="mt-6 font-display text-[17px] font-semibold uppercase tracking-[0.08em] text-ink-50">
              {t("cart.empty")}
            </p>
            <p className="mt-2 text-[14px] text-ink-400">{t("cart.emptyBody")}</p>
            <button onClick={closeDrawer} className="btn-primary mt-8">
              {t("cart.browse")}
            </button>
          </div>
        ) : (
          <>
            {/* Artículos. `min-h-0` deja que la lista se encoja y el pie
                nunca tape productos. */}
            <ul className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
              {items.map((item) => {
                const p = getProduct(item.id);
                if (!p) return null;
                return (
                  <li key={item.id} className="bubble-in flex gap-4 rounded-card p-2 transition-colors hover:bg-white/[0.02]">
                    <div className="grid h-[88px] w-[88px] shrink-0 place-items-center rounded-[12px] bg-white/[0.03]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.img} alt={p.name} className="h-[80px] w-[80px] object-contain" />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col py-0.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold text-ink-50">{p.name}</p>
                          <p className="mt-0.5 text-[12px] text-ink-500">
                            {getBrand(p.brand).name} · {STRAIN_LABEL[p.strain]}
                          </p>
                        </div>
                        <p className="shrink-0 text-[14px] font-semibold tabular-nums text-ink-50">
                          {formatUSD(item.price * item.qty)}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1 rounded-full bg-white/[0.05] p-0.5">
                          <button
                            onClick={() => changeQty(item.id, -1)}
                            aria-label={t("cart.decrease")}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-300 transition hover:bg-white/10 hover:text-ink-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center text-[13px] font-semibold tabular-nums text-ink-50">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => changeQty(item.id, 1)}
                            disabled={item.qty >= 99}
                            aria-label={t("cart.increase")}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-300 transition hover:bg-white/10 hover:text-ink-50 disabled:opacity-50 disabled:hover:bg-transparent"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => remove(item.id)}
                          className="text-[12px] text-ink-500 underline-offset-4 transition hover:text-red-400 hover:underline"
                        >
                          {t("cart.remove")}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}

              <li className="px-2 pt-1 text-right">
                <button
                  onClick={handleClear}
                  className="text-[11.5px] uppercase tracking-wide2 text-ink-600 transition hover:text-red-400"
                >
                  {confirmClear ? t("cart.clearConfirm" as any) : t("cart.clear")}
                </button>
              </li>
            </ul>

            {/* Pie */}
            <div className="shrink-0 border-t border-white/8 bg-ink-900 p-4 pb-6 sm:p-6 sm:pb-6">
              {/* Dirección */}
              <button
                onClick={openAddress}
                className={`group flex w-full items-center gap-3 rounded-[12px] px-4 py-3 text-left transition ${
                  ready ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-gold-400/10 ring-1 ring-gold-400/40 hover:bg-gold-400/15"
                }`}
              >
                <MapPin className={`h-4 w-4 shrink-0 ${ready ? "text-ink-400" : "text-gold-300"}`} />
                <span className="min-w-0 flex-1">
                  {ready ? (
                    <>
                      <span className="block truncate text-[13px] font-semibold text-ink-50">
                        {delivery!.alias} · {DELIVERY_ZONE}
                      </span>
                      <span className="block truncate text-[12px] text-ink-500">{delivery!.address}</span>
                    </>
                  ) : (
                    <span className="block text-[13px] font-semibold text-gold-200">
                      {t("cart.needAddress")}
                    </span>
                  )}
                </span>
                <span className="flex items-center text-[12px] text-ink-500 group-hover:text-ink-200">
                  {ready && t("cart.edit")}
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>

              {/* Cupón de cliente frecuente: grande y a la vista */}
              <ReferralCode onChange={setCoupon} />

              {/* Totales */}
              <dl className="mt-5 space-y-2 text-[13.5px]">
                <div className="flex justify-between">
                  <dt className="text-ink-400">{t("cart.subtotal")}</dt>
                  <dd className="tabular-nums text-ink-100">{formatUSD(listSubtotal)}</dd>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-red-400">{t("cart.discount")}</dt>
                    <dd className="font-semibold tabular-nums text-red-400">-{formatUSD(savings)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-400">{t("cart.delivery")}</dt>
                  <dd className="tabular-nums text-ink-100">C$ {DELIVERY_FEE_NIO}</dd>
                </div>
                {coupon > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-hybrid">{t("cart.couponLine")}</dt>
                    <dd className="font-semibold tabular-nums text-hybrid">-{formatUSD(coupon)}</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t border-white/8 pt-3">
                  <dt className="text-[14px] font-semibold text-ink-50">{t("cart.total")}</dt>
                  <dd className="text-right">
                    <span className="block font-display text-[26px] font-semibold leading-none tabular-nums text-ink-50">
                      {formatUSD(payable)}
                    </span>
                    <span className="mt-1 block text-[12px] tabular-nums text-ink-500">
                      {formatNIO(payable)}
                    </span>
                  </dd>
                </div>
              </dl>

              <p className="mt-3 flex items-center gap-2 text-[12px] text-ink-400">
                <Clock className={`h-3.5 w-3.5 shrink-0 ${today ? "text-hybrid" : "text-ink-500"}`} />
                {today ? t("cart.today") : t("cart.tomorrow")}
              </p>

              <button
                onClick={goToCheckout}
                className="btn-gold mt-5 w-full"
              >
                <CreditCard className="h-4 w-4" />
                {!ready ? t("cart.needAddress") : `${t("cart.pay")} ${formatUSD(payable)}`}
              </button>

              <div className="mt-3 flex flex-col items-center gap-2">
                <CardLogos />
                <p className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
                  <Lock className="h-3 w-3" />
                  {t("cart.secure")}
                </p>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
