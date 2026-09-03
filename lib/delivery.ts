// =====================================================================
// Datos de entrega del cliente.
//
// Modelo de privacidad: no hay cuenta ni servidor de perfiles. Lo que el
// cliente escribe vive solo en su navegador (localStorage) y viaja dentro
// del código de pedido cifrado. Nosotros leemos esos datos únicamente
// cuando el cliente nos entrega su código, y solo para ese despacho.
// =====================================================================

export interface DeliveryInfo {
  alias: string; // nombre o apodo para recibir (no requiere ser real)
  phone: string; // contacto para coordinar la entrega
  region: string; // departamento / región
  address: string; // dirección exacta
  notes: string; // referencias, horario preferido
}

export const EMPTY_DELIVERY: DeliveryInfo = {
  alias: "",
  phone: "",
  region: "",
  address: "",
  notes: "",
};

// Cobertura nacional: departamentos y regiones autónomas de Nicaragua.
export const REGIONS: string[] = [
  "Boaco",
  "Carazo",
  "Chinandega",
  "Chontales",
  "Estelí",
  "Granada",
  "Jinotega",
  "León",
  "Madriz",
  "Managua",
  "Masaya",
  "Matagalpa",
  "Nueva Segovia",
  "Región Autónoma Caribe Norte",
  "Región Autónoma Caribe Sur",
  "Río San Juan",
  "Rivas",
];

export const DELIVERY_KEY = "vibeDelivery";

export function loadDelivery(): DeliveryInfo | null {
  try {
    const raw = window.localStorage.getItem(DELIVERY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeliveryInfo>;
    return { ...EMPTY_DELIVERY, ...parsed };
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
    info.region.trim().length > 0 &&
    info.address.trim().length > 5
  );
}

/** Resumen de una línea para mostrar en la barra y el carrito. */
export function deliverySummary(info: DeliveryInfo | null): string {
  if (!isDeliveryComplete(info)) return "Agregar dirección";
  return `${info.region} · ${info.address}`;
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
  if (!info.region.trim()) {
    errors.region = "Elegí tu departamento o región.";
  }
  if (info.address.trim().length < 6) {
    errors.address = "Detallá la dirección exacta de entrega.";
  }
  return errors;
}
