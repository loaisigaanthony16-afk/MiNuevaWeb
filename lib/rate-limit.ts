// =====================================================================
// Freno de peticiones por clave (IP o token), en memoria.
//
// Cada instancia del servidor lleva su propio contador, así que no es un
// límite exacto global, pero corta en seco a quien martilla una ruta.
// =====================================================================

const buckets = new Map<string, { count: number; reset: number }>();

/** true si la petición pasa; false si superó `limit` en `windowMs`. */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    }
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "desconocida"
  );
}
