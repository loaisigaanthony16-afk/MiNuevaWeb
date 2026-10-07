// =====================================================================
// Contador de visitas. El navegador manda un aviso por cada página que
// se abre y por cada paso del embudo (carrito, checkout, pedido).
//
// Qué NO se guarda: ni IP, ni user-agent completo, ni nada que
// identifique a una persona. La IP solo se usa en memoria para frenar
// abusos y para que Vercel resuelva el país.
// =====================================================================

import { NextResponse } from "next/server";
import { allow, clientIp } from "@/lib/rate-limit";
import { db, ordersDbConfigured } from "@/lib/supabase-server";

/** Nada de esto debe cachearse ni prerrenderizarse. */
export const dynamic = "force-dynamic";

const TIPOS = new Set(["vista", "carrito", "checkout", "pedido", "reels", "contacto"]);

/** Un host limpio desde una URL cualquiera; null si no sirve. */
function host(valor: unknown): string | null {
  if (typeof valor !== "string" || !valor) return null;
  try {
    const h = new URL(valor).hostname.replace(/^www\./, "").toLowerCase();
    // Venir de nuestra propia página no es un origen.
    return h.endsWith("vibe505.com") ? null : h.slice(0, 120);
  } catch {
    return null;
  }
}

/** Móvil, tablet o escritorio. Solo eso: el user-agent no se guarda. */
function dispositivo(ua: string): string {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "movil";
  return "escritorio";
}

function texto(valor: unknown, max = 120): string | null {
  if (typeof valor !== "string") return null;
  const t = valor.trim().slice(0, max);
  return t || null;
}

export async function POST(request: Request) {
  // Respuesta siempre 204: al navegador no le importa el resultado y así
  // un fallo de la base nunca se ve en la página.
  const vacio = new NextResponse(null, { status: 204 });
  if (!ordersDbConfigured()) return vacio;

  // 60 avisos por minuto por IP: de sobra para navegar, corto para un bot.
  if (!allow(`visita:${clientIp(request)}`, 60, 60 * 1000)) return vacio;

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const ruta = texto(body.ruta, 200);
    if (!ruta || !ruta.startsWith("/")) return vacio;

    const tipo = texto(body.tipo, 20) ?? "vista";
    if (!TIPOS.has(tipo)) return vacio;

    // El panel y las páginas atadas a un pedido no cuentan como tráfico.
    // Los pasos del embudo sí: el pedido se confirma justo en una de
    // ellas, y sin eso no habría con qué medir la conversión. De la ruta
    // solo llega el pathname, nunca el id del pedido, que va en la query.
    if (tipo === "vista" && /^\/(admin|pedido|seguir|order-success)/.test(ruta)) return vacio;

    const ua = request.headers.get("user-agent") ?? "";
    // Los rastreadores no son visitas.
    if (/bot|crawl|spider|slurp|headless|preview|facebookexternalhit/i.test(ua)) return vacio;

    await db("visitas", {
      method: "POST",
      prefer: "return=minimal",
      body: {
        tipo,
        ruta,
        referencia: host(body.referencia),
        utm_source: texto(body.utm_source, 60),
        utm_medium: texto(body.utm_medium, 60),
        utm_campaign: texto(body.utm_campaign, 60),
        // Vercel resuelve el país en el borde; no hace falta base de IPs.
        pais: request.headers.get("x-vercel-ip-country") ?? null,
        dispositivo: dispositivo(ua),
        sesion: texto(body.sesion, 40),
        dato: body.dato && typeof body.dato === "object" ? body.dato : null,
      },
    });
  } catch {
    // Un contador roto no debe romper la página.
  }
  return vacio;
}
