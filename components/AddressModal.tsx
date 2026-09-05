"use client";

import { useEffect, useState } from "react";
import { Check, Lock, Trash2, X } from "lucide-react";
import { useUi } from "@/components/ui-context";
import {
  EMPTY_DELIVERY,
  REGIONS,
  clearDelivery,
  validateDelivery,
  type DeliveryInfo,
} from "@/lib/delivery";
import {
  FREE_SHIPPING_AT,
  NATIONAL_SHIPPING_NIO,
} from "@/lib/checkout-util";
import { shippingModeFor } from "@/lib/shipping";
import { AlertCircle, Bike, Truck } from "lucide-react";
import { useT } from "@/components/locale-context";

export default function AddressModal() {
  const t = useT();
  const { addressOpen, closeAddress, delivery, setDelivery } = useUi();
  const [form, setForm] = useState<DeliveryInfo>(EMPTY_DELIVERY);
  const [errors, setErrors] = useState<Partial<Record<keyof DeliveryInfo, string>>>({});
  const [saved, setSaved] = useState(false);

  // Al abrir, precarga lo guardado.
  useEffect(() => {
    if (!addressOpen) return;
    setForm(delivery ?? EMPTY_DELIVERY);
    setErrors({});
    setSaved(false);
  }, [addressOpen, delivery]);

  if (!addressOpen) return null;

  function update<K extends keyof DeliveryInfo>(key: K, value: DeliveryInfo[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateDelivery(form);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setDelivery(form);
    setSaved(true);
    setTimeout(closeAddress, 750);
  }

  function handleClear() {
    clearDelivery();
    setDelivery(EMPTY_DELIVERY);
    setForm(EMPTY_DELIVERY);
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm fade-overlay sm:items-center sm:p-6"
      onClick={closeAddress}
      role="dialog"
      aria-modal="true"
      aria-label={t("nav.address")}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-pop flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl2 border border-white/10 bg-ink-850 shadow-pop sm:rounded-xl2"
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-4 border-b border-white/8 p-6">
          <div>
            <p className="kicker">{t("addr.kicker")}</p>
            <h2 className="mt-3 font-display text-[24px] font-bold uppercase leading-tight tracking-tightest text-ink-50">
              {t("addr.title")}
            </h2>
          </div>
          <button
            onClick={closeAddress}
            aria-label="Cerrar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-ink-400 transition hover:bg-white/5 hover:text-ink-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nota de privacidad */}
        <div className="border-b border-white/8 bg-white/[0.02] px-6 py-4">
          <p className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-400">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-300" />
            <span>
              {t("addr.privacy")}
            </span>
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="alias">
                {t("addr.alias")}
              </label>
              <input
                id="alias"
                value={form.alias}
                onChange={(e) => update("alias", e.target.value)}
                placeholder={t("addr.aliasHint")}
                className={`field ${errors.alias ? "field-error" : ""}`}
              />
              {errors.alias && <Err msg={errors.alias} />}
            </div>

            <div>
              <label className="label" htmlFor="phone">
                {t("addr.phone")}
              </label>
              <input
                id="phone"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="8888 8888"
                className={`field ${errors.phone ? "field-error" : ""}`}
              />
              {errors.phone && <Err msg={errors.phone} />}
            </div>
          </div>

          <div className="mt-5">
            <label className="label" htmlFor="region">
              {t("addr.region")}
            </label>
            <select
              id="region"
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
              className={`field ${errors.region ? "field-error" : ""}`}
            >
              <option value="">{t("addr.regionHint")}</option>
              {REGIONS.map((r) => (
                <option key={r} value={r} className="bg-ink-850">
                  {r}
                </option>
              ))}
            </select>
            {errors.region && <Err msg={errors.region} />}
          </div>

          <div className="mt-5">
            <label className="label" htmlFor="address">
              {t("addr.address")}
            </label>
            <textarea
              id="address"
              rows={3}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder={t("addr.addressHint")}
              className={`field h-auto resize-none py-3 ${errors.address ? "field-error" : ""}`}
            />
            {errors.address && <Err msg={errors.address} />}
          </div>

          <div className="mt-5">
            <label className="label" htmlFor="notes">
              {t("addr.notes")}{" "}
              <span className="normal-case text-ink-500">{t("addr.optional")}</span>
            </label>
            <input
                id="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder={t("addr.notesHint")}
              className="field"
            />
          </div>

          {/* Qué implica el departamento elegido, al instante */}
          <div className="mt-6 rounded-[10px] border border-white/10 bg-white/[0.02] p-4">
            {form.region ? (
              (() => {
                const m = shippingModeFor(form.region);
                const Icon = m.mode === "directa" ? Bike : Truck;
                return (
                  <div className="bubble-in">
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0 text-gold-300" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide2 text-ink-400">
                        {t("ship.modeFor")} {form.region}
                      </span>
                    </div>

                    <dl className="mt-3 space-y-1.5 text-[12.5px]">
                      <div className="flex justify-between gap-4">
                        <dt className="text-ink-500">{t("ship.yourMode")}</dt>
                        <dd className="font-semibold text-ink-50">
                          {t(m.nameKey)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-ink-500">{t("ship.eta")}</dt>
                        <dd className="text-ink-100">{t(m.etaKey)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-ink-500">{t("ship.cost")}</dt>
                        <dd className="text-ink-100">
                          C${NATIONAL_SHIPPING_NIO} · {t("cart.freeFrom")} $
                          {FREE_SHIPPING_AT}
                        </dd>
                      </div>
                    </dl>

                    <p className="mt-3 text-[12px] leading-relaxed text-ink-400">
                      {t(m.anonKey)}
                    </p>

                    {m.mayRequireId && (
                      <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-gold-100">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-300" />
                        {t("ship.idWarning")}
                      </p>
                    )}
                  </div>
                );
              })()
            ) : (
              <p className="text-[12.5px] text-ink-500">{t("ship.chooseRegion")}</p>
            )}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button type="submit" className="btn-gold flex-1">
              {saved ? (
                <>
                  <Check className="h-4 w-4" /> {t("addr.saved")}
                </>
              ) : (
                t("addr.save")
              )}
            </button>
            {delivery && delivery.address && (
              <button
                type="button"
                onClick={handleClear}
                aria-label={t("addr.delete")}
                className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-white/12 text-ink-400 transition hover:border-red-500/50 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Err({ msg }: { msg: string }) {
  return <p className="mt-1.5 text-[12px] text-red-400">{msg}</p>;
}
