// =====================================================================
// Lógica de envío.
//
// La tarifa es única en todo el país (C$200, gratis desde $120), pero la
// FORMA de entregar cambia según el departamento, y con ella cambia lo que
// podemos prometer sobre tiempos y anonimato. Este módulo es la única
// fuente de verdad de esa diferencia.
//
// ⚙️ AJUSTABLE: `DIRECT_REGIONS` son los departamentos donde entrega tu
// propio mensajero. Editá esa lista según tu operación real.
// =====================================================================

export type ShippingMode = "directa" | "encomienda";

/** Departamentos cubiertos por mensajería propia. */
export const DIRECT_REGIONS: readonly string[] = [
  "Managua",
  "Masaya",
  "Carazo",
  "Granada",
];

export interface ShippingModeInfo {
  mode: ShippingMode;
  /** Clave de i18n del nombre del modo. */
  nameKey: "ship.directName" | "ship.parcelName";
  /** Clave de i18n del tiempo estimado. */
  etaKey: "ship.directEta" | "ship.parcelEta";
  /** Clave de i18n de quién entrega. */
  carrierKey: "ship.directCarrier" | "ship.parcelCarrier";
  /** Clave de i18n de cómo se preserva el anonimato en este modo. */
  anonKey: "ship.directAnon" | "ship.parcelAnon";
  /**
   * true si la paquetería puede pedir un documento al recibir.
   *
   * ⚠️ Confirmalo con tu transportista antes de vender: si lo exigen, la
   * entrega deja de ser 100% anónima y el texto debe decirlo.
   */
  mayRequireId: boolean;
}

export const SHIPPING_MODES: Record<ShippingMode, ShippingModeInfo> = {
  directa: {
    mode: "directa",
    nameKey: "ship.directName",
    etaKey: "ship.directEta",
    carrierKey: "ship.directCarrier",
    anonKey: "ship.directAnon",
    mayRequireId: false,
  },
  encomienda: {
    mode: "encomienda",
    nameKey: "ship.parcelName",
    etaKey: "ship.parcelEta",
    carrierKey: "ship.parcelCarrier",
    anonKey: "ship.parcelAnon",
    mayRequireId: true,
  },
};

/** Modo de entrega que corresponde a un departamento. */
export function shippingModeFor(region: string): ShippingModeInfo {
  const direct = DIRECT_REGIONS.some(
    (r) => r.toLowerCase() === region.trim().toLowerCase()
  );
  return SHIPPING_MODES[direct ? "directa" : "encomienda"];
}

/** Pasos del pedido, iguales para ambos modos salvo el texto de entrega. */
export const ORDER_STEPS = [
  "ship.step1",
  "ship.step2",
  "ship.step3",
  "ship.step4",
] as const;
