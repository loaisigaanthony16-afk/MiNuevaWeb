import { NextResponse } from "next/server";
import { priceOrder, PricingError } from "@/lib/pricing";
import { createInvoice, GatewayError, isAllowedOrigin, isEmbeddable, siteOrigin } from "@/lib/nowpayments";
import { createOrder, newOrderId } from "@/lib/orders";

/**
 * Inicia el cobro: calcula el total, crea la factura de NOWPayments y
 * registra el pedido como `pending`.
 *
 * El navegador solo manda qué producto y cuántas unidades. El precio sale
 * del catálogo del servidor y la dirección de entrega nunca llega acá.
 */

interface Body {
  items?: { id: number; qty: number }[];
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  try {
    const order = priceOrder(body.items);
    const orderId = newOrderId();
    const units = order.lines.reduce((acc, l) => acc + l.qty, 0);

    const invoice = await createInvoice({
      orderId,
      totalUsd: order.totalUsd,
      units,
      base: siteOrigin(request),
    });

    // Registro y revisión del iframe en paralelo: ninguno frena al otro.
    const [tracked, embeddable] = await Promise.all([
      createOrder(orderId, order, invoice.id),
      isEmbeddable(invoice.url),
    ]);

    return NextResponse.json({
      orderId,
      invoiceUrl: invoice.url,
      invoiceId: invoice.id,
      embeddable,
      // Sin base de datos la página no puede confirmar sola: el modal lo
      // sabe y deja el aviso por WhatsApp como camino.
      tracked,
      subtotalUsd: order.subtotalUsd,
      deliveryUsd: order.shippingUsd,
      totalUsd: order.totalUsd,
    });
  } catch (err) {
    if (err instanceof PricingError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof GatewayError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("Error iniciando el cobro:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 500 });
  }
}
