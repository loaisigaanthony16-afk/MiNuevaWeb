// =====================================================================
// Ventana de entrega: "pedí antes de las 6 pm y te llega hoy".
// Hora de Nicaragua (UTC-6, sin horario de verano).
// =====================================================================

export const CUTOFF_HOUR = 18;
export const OPEN_HOUR = 9;

export function nicaraguaHour(now = new Date()): number {
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  return new Date(utc - 6 * 60 * 60 * 1000).getHours();
}

/** true si un pedido hecho ahora sale hoy mismo. */
export function deliversToday(now = new Date()): boolean {
  const h = nicaraguaHour(now);
  return h >= OPEN_HOUR - 3 && h < CUTOFF_HOUR;
}

export interface DeliverySlot {
  id: "manana" | "tarde" | "noche";
  label: string;
  hours: string;
}

export const SLOTS: DeliverySlot[] = [
  { id: "manana", label: "Mañana", hours: "9 am – 12 pm" },
  { id: "tarde", label: "Tarde", hours: "12 – 5 pm" },
  { id: "noche", label: "Noche", hours: "5 – 8 pm" },
];

export function slotLabel(id: string): string {
  const s = SLOTS.find((x) => x.id === id);
  return s ? `${s.label} (${s.hours})` : "";
}
