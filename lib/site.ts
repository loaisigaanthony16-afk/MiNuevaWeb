// =====================================================================
// Utilidades compartidas por las rutas de checkout.
// =====================================================================

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
 * Base pública del sitio para las URLs de retorno.
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
