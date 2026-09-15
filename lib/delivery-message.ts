// =====================================================================
// Primer mensaje del chat del pedido: los datos de entrega que el cliente
// tenía guardados solo en su dispositivo. Se manda por el chat cifrado
// apenas se confirma el pago.
// =====================================================================

import type { DeliveryInfo } from "@/lib/delivery";
import { DELIVERY_FEE_NIO } from "@/lib/checkout-util";

export interface OrderLineText {
  qty: number;
  name: string;
}

export function buildDeliveryMessage(params: {
  orderId: string | null;
  lines: OrderLineText[];
  delivery: DeliveryInfo | null;
  totalUsd?: number;
}): string {
  const { orderId, lines, delivery, totalUsd } = params;
  const items = lines.map((l) => `• ${l.qty}x ${l.name}`).join("\n");
  return [
    orderId ? `Pedido ${orderId}` : "",
    items ? `\n${items}` : "",
    typeof totalUsd === "number" ? `\nTotal: $${totalUsd.toFixed(2)} (incluye entrega C$${DELIVERY_FEE_NIO})` : "",
    delivery ? "\nDatos de entrega:" : "",
    delivery ? `Recibe: ${delivery.alias}` : "",
    delivery ? `Teléfono: ${delivery.phone}` : "",
    delivery ? `Ciudad: ${delivery.region}` : "",
    delivery ? `Dirección: ${delivery.address}` : "",
    delivery?.notes ? `Referencias: ${delivery.notes}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
