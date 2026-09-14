// =====================================================================
// NOWPayments: factura de pago y utilidades de las rutas de checkout.
//
// Se usa la API de FACTURAS (`/v1/invoice`) y no la de pagos directos
// (`/v1/payment`): la factura trae su página de pago, que es la única que
// puede ofrecer tarjeta cuando NOWPayments la habilite, y deja elegir
// moneda. Un pago directo en USDT obligaría a pagar solo con cripto.
// =====================================================================

const INVOICE_API = "https://api.nowpayments.io/v1/invoice";

/** Solo aceptamos peticiones del propio sitio (más ALLOWED_ORIGINS). */
export function isAllowedOrigin(request: Request): boolean {
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

const isLocalUrl = (url: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:|$|\/)/.test(url);

/**
 * Base pública del sitio para las URLs de retorno y del IPN.
 *
 * Se prefiere el host real de la petición cuando la variable configurada
 * apunta a localhost (un .env de desarrollo en producción dejaría a los
 * compradores sin retorno) y fuera de local se fuerza HTTPS.
 */
export function siteOrigin(request: Request): string {
  const host = request.headers.get("host");
  const fromRequest = request.headers.get("origin") ?? (host ? `https://${host}` : null);
  const configured = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL)?.replace(/\/$/, "");
  const configuredIsUsable =
    configured && (!isLocalUrl(configured) || !fromRequest || isLocalUrl(fromRequest));
  const url = (configuredIsUsable ? configured : fromRequest) ?? "http://localhost:3000";
  if (isLocalUrl(url)) return url;
  return url.replace(/^http:\/\//, "https://");
}

export interface Invoice {
  url: string;
  id: string | number | null;
}

export class GatewayError extends Error {}

/**
 * Crea la factura. Si está pedido el pago con tarjeta y NOWPayments lo
 * rechaza (cuenta sin habilitar), reintenta con la factura estándar.
 */
export async function createInvoice(params: {
  orderId: string;
  totalUsd: number;
  units: number;
  base: string;
}): Promise<Invoice> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) throw new GatewayError("Pasarela no configurada.");

  const { orderId, totalUsd, units, base } = params;
  const payload = {
    price_amount: totalUsd,
    price_currency: "usd",
    order_id: orderId,
    // Descripción neutra: ni datos personales ni nombres de producto.
    order_description: `Pedido ${orderId} · ${units} ${units === 1 ? "artículo" : "artículos"}`,
    ipn_callback_url: `${base}/api/webhooks/nowpayments`,
    success_url: `${base}/order-success?order_id=${orderId}`,
    cancel_url: `${base}/?canceled=true`,
  };

  async function attempt(withCard: boolean) {
    const res = await fetch(INVOICE_API, {
      method: "POST",
      headers: { "x-api-key": apiKey as string, "Content-Type": "application/json" },
      body: JSON.stringify(withCard ? { ...payload, buy_with_credit_card: true } : payload),
    });
    const data = (await res.json().catch(() => ({}))) as {
      invoice_url?: string;
      id?: string | number;
      message?: string;
    };
    return { res, data };
  }

  const cardEnabled = process.env.NOWPAYMENTS_ENABLE_CARD === "true";
  let { res, data } = await attempt(cardEnabled);

  if (cardEnabled && (!res.ok || !data.invoice_url)) {
    console.warn(
      "NOWPayments rechazó el pago con tarjeta:",
      res.status,
      typeof data.message === "string" ? data.message : "sin detalle",
      "— se reintenta con la factura estándar"
    );
    ({ res, data } = await attempt(false));
  }

  if (!res.ok || !data.invoice_url) {
    // Solo código y mensaje, para que ninguna credencial acabe en los registros.
    console.error(
      "NOWPayments rechazó la factura:",
      res.status,
      typeof data.message === "string" ? data.message : "sin detalle"
    );
    throw new GatewayError("No se pudo iniciar el pago.");
  }

  return { url: data.invoice_url, id: data.id ?? null };
}

/**
 * ¿Se puede mostrar la página de pago dentro de un iframe?
 *
 * Se revisan las cabeceras que lo impiden (X-Frame-Options y
 * frame-ancestors). Si la consulta falla o tarda, se asume que no, y el
 * modal abre la pasarela en una pestaña aparte.
 */
export async function isEmbeddable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    clearTimeout(timer);
    res.body?.cancel().catch(() => {});
    const xfo = res.headers.get("x-frame-options");
    const csp = res.headers.get("content-security-policy") ?? "";
    if (xfo && /deny|sameorigin/i.test(xfo)) return false;
    const ancestors = /frame-ancestors([^;]*)/i.exec(csp)?.[1]?.trim();
    if (ancestors && !/\*/.test(ancestors)) return false;
    return res.ok;
  } catch {
    return false;
  }
}
