// =====================================================================
// Publicación en Instagram y Facebook por la API oficial de Meta.
//
// Solo para el SERVIDOR: lleva el token de la página, que da permiso para
// publicar en nombre del negocio y nunca debe llegar al navegador.
//
// Requisitos del lado de Meta (ver .env.example):
//  - cuenta de Instagram Profesional (empresa o creador) ligada a la
//    página de Facebook;
//  - app de Meta con instagram_basic, instagram_content_publish,
//    pages_show_list, pages_read_engagement y pages_manage_posts;
//  - token de usuario de sistema, que no vence. El token normal de página
//    dura 60 días y dejaría el cron muerto sin avisar.
// =====================================================================

if (typeof window !== "undefined") {
  throw new Error("lib/social-meta.ts es solo para el servidor");
}

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION ?? "v21.0"}`;

export class MetaError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
  }
}

export function metaConfigured(): boolean {
  return Boolean(process.env.META_ACCESS_TOKEN);
}

function token() {
  const t = process.env.META_ACCESS_TOKEN;
  if (!t) throw new MetaError("META_ACCESS_TOKEN no configurada");
  return t;
}

/**
 * Llama a la API. El token va en el cuerpo o en la query, pero nunca se
 * incluye en el mensaje de error: estos errores se guardan en la base.
 */
async function graph<T>(
  path: string,
  params: Record<string, string>,
  method: "GET" | "POST" = "GET"
): Promise<T> {
  const query = new URLSearchParams({ ...params, access_token: token() });
  const url = method === "GET" ? `${GRAPH}/${path}?${query}` : `${GRAPH}/${path}`;
  const res = await fetch(url, {
    method,
    body: method === "POST" ? query : undefined,
    cache: "no-store",
  });

  const body = (await res.json().catch(() => null)) as
    | { error?: { message?: string; code?: number }; [k: string]: unknown }
    | null;

  if (!res.ok || body?.error) {
    const e = body?.error;
    throw new MetaError(e?.message ?? `HTTP ${res.status}`, e?.code);
  }
  return body as T;
}

// ------------------------------------------------------------ Instagram

/** Paso 1: Meta empieza a descargar y procesar el video. */
export async function igCrearContenedor(videoUrl: string, caption: string): Promise<string> {
  const igUser = process.env.META_IG_USER_ID;
  if (!igUser) throw new MetaError("META_IG_USER_ID no configurada");
  const r = await graph<{ id: string }>(
    `${igUser}/media`,
    { media_type: "REELS", video_url: videoUrl, caption, share_to_feed: "true" },
    "POST"
  );
  return r.id;
}

export type EstadoContenedor = "listo" | "procesando" | "error";

export async function igEstadoContenedor(
  creationId: string
): Promise<{ estado: EstadoContenedor; detalle?: string }> {
  const r = await graph<{ status_code?: string; status?: string }>(creationId, {
    fields: "status_code,status",
  });
  switch (r.status_code) {
    case "FINISHED":
      return { estado: "listo" };
    case "IN_PROGRESS":
    case "PUBLISHED":
      // PUBLISHED ya salió: se trata como listo para no reintentar.
      return { estado: r.status_code === "PUBLISHED" ? "listo" : "procesando" };
    default:
      return { estado: "error", detalle: r.status ?? r.status_code ?? "desconocido" };
  }
}

/** Paso 2: publicar el contenedor ya procesado. */
export async function igPublicar(creationId: string): Promise<string> {
  const igUser = process.env.META_IG_USER_ID;
  if (!igUser) throw new MetaError("META_IG_USER_ID no configurada");
  const r = await graph<{ id: string }>(
    `${igUser}/media_publish`,
    { creation_id: creationId },
    "POST"
  );
  return r.id;
}

// ------------------------------------------------------------- Facebook

/**
 * Facebook sí acepta el video en una sola llamada: se le pasa la URL y él
 * la descarga. No usa el protocolo por partes de los reels porque para un
 * video corto no hace falta y es mucho más frágil.
 */
export async function fbPublicarVideo(videoUrl: string, descripcion: string): Promise<string> {
  const page = process.env.META_PAGE_ID;
  if (!page) throw new MetaError("META_PAGE_ID no configurada");
  const r = await graph<{ id: string }>(
    `${page}/videos`,
    { file_url: videoUrl, description: descripcion },
    "POST"
  );
  return r.id;
}
