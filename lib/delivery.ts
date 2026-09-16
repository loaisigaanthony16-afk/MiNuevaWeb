// =====================================================================
// Datos de entrega del cliente.
//
// Modelo de privacidad: no hay cuenta ni servidor de perfiles. Lo que el
// cliente escribe vive solo en su navegador (localStorage) y nos llega
// únicamente por el chat cifrado del pedido, enviado por el cliente tras pagar.
// =====================================================================

import { DELIVERY_ZONE } from "@/lib/checkout-util";

export interface DeliveryInfo {
  alias: string; // nombre o apodo para recibir (no requiere ser real)
  phone: string; // contacto para coordinar la entrega
  region: string; // zona de entrega: por ahora siempre Estelí
  address: string; // dirección exacta
  notes: string; // referencias
  /** Franja preferida: manana | tarde | noche | "" (cualquiera). */
  slot: string;
}

export const EMPTY_DELIVERY: DeliveryInfo = {
  alias: "",
  phone: "",
  region: DELIVERY_ZONE,
  address: "",
  notes: "",
  slot: "",
};

export const DELIVERY_KEY = "vibeDelivery";

export function loadDelivery(): DeliveryInfo | null {
  try {
    const raw = window.localStorage.getItem(DELIVERY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeliveryInfo>;
    // Direcciones guardadas con otro departamento pasan a la única zona.
    return { ...EMPTY_DELIVERY, ...parsed, region: DELIVERY_ZONE };
  } catch {
    return null;
  }
}

export function saveDelivery(info: DeliveryInfo): void {
  try {
    window.localStorage.setItem(DELIVERY_KEY, JSON.stringify(info));
  } catch {
    /* noop */
  }
}

export function clearDelivery(): void {
  try {
    window.localStorage.removeItem(DELIVERY_KEY);
  } catch {
    /* noop */
  }
}

/** Mínimo necesario para poder despachar. */
export function isDeliveryComplete(info: DeliveryInfo | null): info is DeliveryInfo {
  if (!info) return false;
  return (
    info.alias.trim().length > 1 &&
    info.phone.replace(/\D/g, "").length >= 8 &&
    info.address.trim().length > 5
  );
}

/** Errores por campo, para el formulario. */
export function validateDelivery(info: DeliveryInfo): Partial<Record<keyof DeliveryInfo, string>> {
  const errors: Partial<Record<keyof DeliveryInfo, string>> = {};
  if (info.alias.trim().length < 2) {
    errors.alias = "Escribí un nombre o apodo para recibir.";
  }
  if (info.phone.replace(/\D/g, "").length < 8) {
    errors.phone = "Necesitamos un número de 8 dígitos para coordinar.";
  }
  if (info.address.trim().length < 6) {
    errors.address = "Detallá la dirección exacta de entrega.";
  }
  return errors;
}
