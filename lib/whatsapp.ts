// =====================================================================
// Coordinación de la entrega por WhatsApp.
//
// Como no hay base de datos y la dirección nunca sale del dispositivo del
// cliente, este es el canal por el que el comercio la recibe: el propio
// cliente abre el chat con el mensaje ya armado desde lo que tenía
// guardado localmente. Nada de esto pasa por nuestro servidor.
// =====================================================================

import type { DeliveryInfo } from "@/lib/delivery";

/** Número del comercio, en formato internacional sin signos. */
export const WHATSAPP_NUMBER = "50584905512";

export interface OrderLineText {
  qty: number;
  name: string;
}

/** Arma el texto del mensaje con lo que el cliente ya tenía en su equipo. */
export function buildWhatsappMessage(params: {
  orderId: string | null;
  lines: OrderLineText[];
  delivery: DeliveryInfo | null;
  totalUsd?: number;
}): string {
  const { orderId, lines, delivery, totalUsd } = params;

  const items = lines.map((l) => `• ${l.qty}x ${l.name}`).join("\n");

  return [
    "Hola, acabo de pagar mi pedido en Vibe 505.",
    "",
    orderId ? `Referencia: ${orderId}` : "",
    items ? `\nPedido:\n${items}` : "",
    typeof totalUsd === "number" ? `\nTotal: $${totalUsd.toFixed(2)}` : "",
    delivery ? "\nDatos de entrega:" : "",
    delivery ? `Recibe: ${delivery.alias}` : "",
    delivery ? `Teléfono: ${delivery.phone}` : "",
    delivery ? `Departamento: ${delivery.region}` : "",
    delivery ? `Dirección: ${delivery.address}` : "",
    delivery?.notes ? `Referencias: ${delivery.notes}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

/** Enlace listo para abrir el chat con el mensaje prellenado. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
