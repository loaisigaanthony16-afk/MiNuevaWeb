// =====================================================================
// Acceso a Supabase desde el SERVIDOR.
//
// Usa la clave de servicio, que se salta RLS: nunca debe importarse desde
// un componente de cliente ni llegar al navegador. La tabla `orders` no
// tiene ninguna política pública, así que solo este módulo la toca.
// =====================================================================

// Red de seguridad: si alguien lo importa en el cliente, falla en seguida.
if (typeof window !== "undefined") {
  throw new Error("lib/supabase-server.ts es solo para el servidor");
}

const DEFAULT_URL = "https://idefyablegqrnvwtvboo.supabase.co";

function config() {
  const url = (process.env.SUPABASE_URL ?? DEFAULT_URL).replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key };
}

/** true si el servidor tiene con qué escribir pedidos. */
export function ordersDbConfigured(): boolean {
  return Boolean(config().key);
}

export class DbError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Petición a la API REST de Supabase (PostgREST).
 * `path` empieza en la tabla: `orders?order_id=eq.X`.
 */
export async function db<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown; prefer?: string } = {}
): Promise<T> {
  const { url, key } = config();
  if (!key) throw new DbError(503, "SUPABASE_SERVICE_ROLE_KEY no configurada");

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: init.method ?? "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });

  if (!res.ok) {
    // Solo código y mensaje: nunca cabeceras, que llevan la clave.
    const detail = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new DbError(res.status, detail?.message ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
