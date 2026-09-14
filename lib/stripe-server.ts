// =====================================================================
// Stripe del lado del servidor.
//
// La clave secreta nunca llega al navegador. Este módulo solo se importa
// desde rutas de API.
// =====================================================================

import Stripe from "stripe";

if (typeof window !== "undefined") {
  throw new Error("lib/stripe-server.ts es solo para el servidor");
}

let client: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY no configurada");
  if (!client) client = new Stripe(key);
  return client;
}

/** Monto en centavos, sin errores de coma flotante. */
export function toCents(usd: number): number {
  return Math.round(usd * 100);
}
