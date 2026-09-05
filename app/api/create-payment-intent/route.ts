import { NextResponse } from "next/server";
import Stripe from "stripe";
import { priceOrder, summarize, PricingError } from "@/lib/pricing";

/**
 * Crea el PaymentIntent del pedido.
 *
 * El monto NO viene del cliente: se recalcula acá a partir del catálogo.
 * El navegador solo dice qué producto y cuántas unidades.
 */

interface Body {
  items?: { id: number; qty: number }[];
  delivery?: {
    alias?: string;
    phone?: string;
    region?: string;
    address?: string;
    notes?: string;
  };
}

/** Stripe limita cada valor de metadata a 500 caracteres. */
function clip(value: string | undefined, max = 480): string {
  return (value ?? "").slice(0, max);
}

/**
 * Solo aceptamos peticiones desde nuestro propio sitio.
 *
 * `ALLOWED_ORIGINS` permite añadir dominios extra por variable de entorno,
 * separados por coma. El host de la propia petición siempre se acepta, que
 * es lo que cubre los despliegues de vista previa de Vercel.
 */
function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  // Sin cabecera Origin no es una petición de navegador entre sitios.
  if (!origin) return true;

  const extra = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const host = request.headers.get("host");
  const allowed = new Set(extra);
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

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: Request) {
  const headers = corsHeaders(request);

  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 }
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Pasarela no configurada." },
      { status: 500, headers }
    );
  }

  try {
    const body = (await request.json()) as Body;
    const { delivery } = body;

    // Sin dirección no hay a dónde despachar.
    if (
      !delivery?.alias ||
      !delivery.phone ||
      !delivery.region ||
      !delivery.address
    ) {
      return NextResponse.json(
        { error: "Falta la dirección de entrega." },
        { status: 400, headers }
      );
    }

    // Precio recalculado en el servidor.
    const order = priceOrder(body.items);

    // Referencia legible del pedido, sin cuentas ni perfiles.
    const pedidoId = `VIBE-${Date.now().toString(36).toUpperCase()}`;

    // Se instancia por request para no romper el build cuando falta la env.
    const stripe = new Stripe(secretKey);

    const intent = await stripe.paymentIntents.create({
      amount: order.amountInCents,
      currency: "usd",
      description: "Compra en sitio web",
      // Los métodos disponibles los decide Stripe según la cuenta.
      automatic_payment_methods: { enabled: true },
      metadata: {
        origen: "Pagina_Web",
        pedido_id: pedidoId,
        pedido: clip(summarize(order)),
        subtotal_usd: order.subtotalUsd.toFixed(2),
        envio_usd: order.shippingUsd.toFixed(2),
        total_usd: order.totalUsd.toFixed(2),
        entrega_alias: clip(delivery.alias, 120),
        entrega_telefono: clip(delivery.phone, 40),
        entrega_region: clip(delivery.region, 80),
        entrega_direccion: clip(delivery.address),
        entrega_referencias: clip(delivery.notes, 300),
      },
    });

    return NextResponse.json(
      {
        clientSecret: intent.client_secret,
        pedidoId,
        // Se devuelve el desglose para que la interfaz muestre lo que se
        // va a cobrar realmente, no lo que calculó el navegador.
        subtotalUsd: order.subtotalUsd,
        shippingUsd: order.shippingUsd,
        totalUsd: order.totalUsd,
      },
      { headers }
    );
  } catch (err) {
    if (err instanceof PricingError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400, headers }
      );
    }
    console.error("Error creando el PaymentIntent:", err);
    return NextResponse.json(
      { error: "No se pudo iniciar el pago." },
      { status: 500, headers }
    );
  }
}
