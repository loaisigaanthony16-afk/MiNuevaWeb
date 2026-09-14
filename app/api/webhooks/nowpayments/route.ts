import crypto from "node:crypto";
import { applyIpn } from "@/lib/orders";

/**
 * Webhook IPN de NOWPayments.
 *
 * NOWPayments firma el aviso con HMAC-SHA512 sobre el JSON del cuerpo con
 * las claves ORDENADAS alfabéticamente, usando NOWPAYMENTS_IPN_SECRET. Si
 * la firma no coincide, el aviso se descarta: si no, cualquiera podría
 * marcar un pedido como pagado con un simple POST.
 */

interface IpnPayload {
  payment_id?: string | number;
  payment_status?: string;
  order_id?: string;
  price_amount?: number;
  price_currency?: string;
  actually_paid?: number;
  pay_currency?: string;
}

/**
 * Serializa igual que NOWPayments para firmar: claves ordenadas en todos
 * los niveles del objeto.
 */
function sortedStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(sortedStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const body = Object.keys(obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${sortedStringify(obj[k])}`)
      .join(",");
    return `{${body}}`;
  }
  return JSON.stringify(value ?? null);
}

/** Comparación en tiempo constante, para no filtrar la firma por temporización. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) {
    console.error("Falta NOWPAYMENTS_IPN_SECRET: el IPN no se puede validar.");
    return new Response("Webhook no configurado", { status: 500 });
  }

  const signature = request.headers.get("x-nowpayments-sig");
  if (!signature) {
    return new Response("Falta la firma", { status: 400 });
  }

  // El cuerpo se lee crudo: hay que firmar exactamente lo que llegó.
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return new Response("Cuerpo ilegible", { status: 400 });
  }

  let payload: IpnPayload;
  try {
    payload = JSON.parse(raw) as IpnPayload;
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const expected = crypto
    .createHmac("sha512", secret)
    .update(sortedStringify(payload))
    .digest("hex");

  if (!safeEqual(signature.trim().toLowerCase(), expected.toLowerCase())) {
    console.warn("IPN con firma inválida, descartado:", payload.order_id);
    return new Response("Firma inválida", { status: 401 });
  }

  const status = payload.payment_status ?? "";
  const orderId = payload.order_id ?? "";

  if (!orderId || !status) {
    return new Response("Aviso incompleto", { status: 400 });
  }

  try {
    await applyIpn({
      orderId,
      npStatus: status,
      paymentId: payload.payment_id ?? null,
      priceAmount: typeof payload.price_amount === "number" ? payload.price_amount : undefined,
      actuallyPaid: typeof payload.actually_paid === "number" ? payload.actually_paid : undefined,
      payCurrency: payload.pay_currency,
    });
  } catch (err) {
    // Con 500 NOWPayments vuelve a mandar el aviso más tarde.
    console.error("No se pudo actualizar el pedido:", err instanceof Error ? err.message : "desconocido");
    return new Response("Error guardando el aviso", { status: 500 });
  }

  // NOWPayments reintenta mientras no reciba 200.
  return new Response("OK", { status: 200 });
}
