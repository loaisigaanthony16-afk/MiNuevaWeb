import { NextResponse } from "next/server";
import { priceOrder, PricingError } from "@/lib/pricing";

/**
 * Crea la factura de NOWPayments y devuelve su URL de pago.
 *
 * El monto NO viene del cliente: se recalcula acá desde el catálogo. El
 * navegador solo dice qué producto y cuántas unidades.
 *
 * MINIMIZACIÓN DE DATOS: la dirección de entrega nunca llega a este
 * servidor ni a NOWPayments. A la pasarela solo le va la referencia del
 * pedido y el importe: ni nombre, ni teléfono, ni dirección, ni nombres de
 * producto. Nada de eso hace falta para cobrar.
 */

const NOWPAYMENTS_API = "https://api.nowpayments.io/v1/invoice";

/**
 * Lo ÚNICO que aceptamos del navegador. La dirección de entrega no viaja
 * hasta acá: el envío es tarifa plana, así que el servidor no la necesita
 * para cobrar, y lo que no se necesita no se pide.
 */
interface Body {
  items?: { id: number; qty: number }[];
}

/**
 * Solo aceptamos peticiones del propio sitio.
 * `ALLOWED_ORIGINS` admite dominios extra separados por coma.
 */
function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  // Sin cabecera Origin no es una petición de navegador entre sitios.
  if (!origin) return true;

  const allowed = new Set(
    (process.env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const host = request.headers.get("host");
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }
  return allowed.has(origin);
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin || !isAllowedOrigin(request)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

/**
 * Base pública del sitio, para las URLs de retorno y del IPN.
 * Fuera de local siempre se fuerza HTTPS: el IPN y el retorno no deben
 * viajar en claro aunque la configuración diga otra cosa.
 */
function siteOrigin(request: Request): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    request.headers.get("origin") ??
    (request.headers.get("host")
      ? `https://${request.headers.get("host")}`
      : "http://localhost:3000");

  const url = raw.replace(/\/$/, "");
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(url);
  if (isLocal) return url;
  return url.replace(/^http:\/\//, "https://");
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: Request) {
  const headers = corsHeaders(request);

  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }

  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Pasarela no configurada." },
      { status: 500, headers }
    );
  }

  try {
    const body = (await request.json()) as Body;

    // Precio recalculado en el servidor.
    const order = priceOrder(body.items);

    // Referencia del pedido, sin cuentas ni perfiles.
    const orderId = `VIBE-${Date.now().toString(36).toUpperCase()}`;
    const base = siteOrigin(request);

    // Descripción neutra: ni PII ni nombres de producto. La pasarela solo
    // necesita saber qué cobrar, no qué se compró ni quién lo compró.
    const units = order.lines.reduce((acc, l) => acc + l.qty, 0);
    const description = `Pedido ${orderId} · ${units} ${
      units === 1 ? "artículo" : "artículos"
    }`;

    const res = await fetch(NOWPAYMENTS_API, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: order.totalUsd,
        price_currency: "usd",
        order_id: orderId,
        order_description: description,
        ipn_callback_url: `${base}/api/nowpayments-webhook`,
        success_url: `${base}/?success=true&ref=${orderId}`,
        cancel_url: `${base}/?canceled=true`,
        // Habilita el pago directo con tarjeta en la pasarela.
        buy_with_credit_card: true,
      }),
    });

    const data = (await res.json()) as {
      invoice_url?: string;
      id?: string | number;
      message?: string;
      status?: unknown;
    };

    if (!res.ok || !data.invoice_url) {
      // Solo el código y el mensaje: nunca la respuesta completa ni cabeceras,
      // para que ninguna credencial acabe en los registros.
      console.error(
        "NOWPayments rechazó la factura:",
        res.status,
        typeof data.message === "string" ? data.message : "sin detalle"
      );
      return NextResponse.json(
        { error: "No se pudo iniciar el pago." },
        { status: 502, headers }
      );
    }

    return NextResponse.json(
      {
        invoiceUrl: data.invoice_url,
        invoiceId: data.id ?? null,
        orderId,
        // El desglose viaja para que la interfaz muestre lo que se cobra
        // de verdad, no lo que calculó el navegador.
        subtotalUsd: order.subtotalUsd,
        shippingUsd: order.shippingUsd,
        totalUsd: order.totalUsd,
      },
      { headers }
    );
  } catch (err) {
    if (err instanceof PricingError) {
      return NextResponse.json({ error: err.message }, { status: 400, headers });
    }
    // Solo el mensaje: un volcado completo puede arrastrar cabeceras.
    console.error(
      "Error creando la factura de NOWPayments:",
      err instanceof Error ? err.message : "desconocido"
    );
    return NextResponse.json(
      { error: "No se pudo iniciar el pago." },
      { status: 500, headers }
    );
  }
}
