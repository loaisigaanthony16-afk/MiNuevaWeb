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
import { DELIVERY_ETA } from "@/lib/checkout-util";

export default function AddressModal() {
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
      aria-label="Dirección de entrega"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-pop flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl2 border border-white/10 bg-ink-850 shadow-pop sm:rounded-xl2"
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-4 border-b border-white/8 p-6">
          <div>
            <p className="kicker">Entrega</p>
            <h2 className="mt-3 font-display text-[24px] font-bold uppercase leading-tight tracking-tightest text-ink-50">
              ¿A dónde lo enviamos?
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
              Esto <span className="text-ink-100">no crea una cuenta</span>. Lo
              que escribas se guarda solo en este dispositivo y viaja cifrado
              dentro de tu código de pedido. Lo leemos únicamente para despachar
              ese envío.
            </span>
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="alias">
                Nombre para recibir
              </label>
              <input
                id="alias"
                value={form.alias}
                onChange={(e) => update("alias", e.target.value)}
                placeholder="Puede ser un apodo"
                className={`field ${errors.alias ? "field-error" : ""}`}
              />
              {errors.alias && <Err msg={errors.alias} />}
            </div>

            <div>
              <label className="label" htmlFor="phone">
                Teléfono de contacto
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
              Departamento o región
            </label>
            <select
              id="region"
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
              className={`field ${errors.region ? "field-error" : ""}`}
            >
              <option value="">Elegí una opción</option>
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
              Dirección exacta
            </label>
            <textarea
              id="address"
              rows={3}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Barrio, calle, número de casa y color del portón"
              className={`field h-auto resize-none py-3 ${errors.address ? "field-error" : ""}`}
            />
            {errors.address && <Err msg={errors.address} />}
          </div>

          <div className="mt-5">
            <label className="label" htmlFor="notes">
              Referencias u horario <span className="normal-case text-ink-500">(opcional)</span>
            </label>
            <input
                id="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Frente al parque, entregar después de las 5pm"
              className="field"
            />
          </div>

          <p className="mt-5 text-[12px] text-ink-500">
            Cobertura nacional · Entrega en {DELIVERY_ETA}.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button type="submit" className="btn-gold flex-1">
              {saved ? (
                <>
                  <Check className="h-4 w-4" /> Guardado
                </>
              ) : (
                "Guardar dirección"
              )}
            </button>
            {delivery && delivery.address && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Borrar mis datos"
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
