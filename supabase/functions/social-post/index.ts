// =====================================================================
// Publicación diaria en Instagram (y Facebook si se habilita).
//
// Corre en Supabase Edge Functions. La dispara pg_cron, que la llama por
// HTTP una vez al día. Así la cola, los videos y el reloj viven en el
// mismo lugar y esto no depende del sitio ni de Vercel.
//
// Secretos que hay que cargar en Edge Functions -> Secrets:
//   META_ACCESS_TOKEN   token del usuario de sistema ClaudeBot
//   META_IG_USER_ID     17841435896984638  (@vibe505.nic)
//   META_PAGE_ID        1320417081162690
//
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta la plataforma.
// =====================================================================

const GRAPH = `https://graph.facebook.com/${Deno.env.get("META_GRAPH_VERSION") ?? "v21.0"}`;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Instagram procesa el video antes de dejarlo publicar. Un reel de 6 s y
// 2 MB tarda bastante menos que esto; el tope es para no acercarse al
// límite de la Edge Function. Si igual no termina, el contenedor queda
// guardado y lo retoma la corrida siguiente.
const ESPERA_MAX_MS = 60_000;
const ESPERA_ENTRE_SONDEOS_MS = 4_000;

interface Fila {
  id: number;
  slug: string;
  video_url: string;
  caption: string;
  platforms: string[];
  ig_creation_id: string | null;
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Acceso a la base por PostgREST con la clave de servicio. */
async function db<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown; prefer?: string } = {},
): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: init.method ?? "GET",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(`base ${res.status}: ${detalle.slice(0, 200)}`);
  }
  if (res.status === 204) return undefined as T;
  const texto = await res.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}

/**
 * Llama a la API de Meta. El token nunca entra en el mensaje de error:
 * estos errores se guardan en la base.
 */
async function graph<T>(
  path: string,
  params: Record<string, string>,
  method: "GET" | "POST" = "GET",
): Promise<T> {
  const token = Deno.env.get("META_ACCESS_TOKEN");
  if (!token) throw new Error("falta META_ACCESS_TOKEN");

  const query = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(
    method === "GET" ? `${GRAPH}/${path}?${query}` : `${GRAPH}/${path}`,
    { method, body: method === "POST" ? query : undefined },
  );
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.error) {
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  }
  return body as T;
}

async function registrar(
  fila: Fila,
  platform: string,
  status: "ok" | "error",
  remote_id: string | null,
  error: string | null,
) {
  await db("social_posts", {
    method: "POST",
    body: [{ queue_id: fila.id, slug: fila.slug, platform, status, remote_id, error }],
    prefer: "return=minimal",
  });
}

/** Crea el contenedor (o retoma el que quedó a medias) y lo publica. */
async function publicarInstagram(fila: Fila): Promise<string> {
  const igUser = Deno.env.get("META_IG_USER_ID");
  if (!igUser) throw new Error("falta META_IG_USER_ID");

  let creationId = fila.ig_creation_id;
  if (!creationId) {
    const creado = await graph<{ id: string }>(
      `${igUser}/media`,
      {
        media_type: "REELS",
        video_url: fila.video_url,
        caption: fila.caption,
        share_to_feed: "true",
      },
      "POST",
    );
    creationId = creado.id;
    // Se guarda antes de esperar: si esto se corta, la próxima corrida
    // retoma el contenedor en vez de volver a subir el video.
    await db(`social_queue?id=eq.${fila.id}`, {
      method: "PATCH",
      body: { ig_creation_id: creationId, ig_creation_at: new Date().toISOString() },
      prefer: "return=minimal",
    });
  }

  const limite = Date.now() + ESPERA_MAX_MS;
  for (;;) {
    const r = await graph<{ status_code?: string; status?: string }>(creationId, {
      fields: "status_code,status",
    });
    if (r.status_code === "FINISHED" || r.status_code === "PUBLISHED") break;
    if (r.status_code !== "IN_PROGRESS") {
      throw new Error(`Instagram rechazó el video: ${r.status ?? r.status_code}`);
    }
    if (Date.now() > limite) {
      throw new Error("Instagram sigue procesando; la próxima corrida lo termina");
    }
    await dormir(ESPERA_ENTRE_SONDEOS_MS);
  }

  const publicado = await graph<{ id: string }>(
    `${igUser}/media_publish`,
    { creation_id: creationId },
    "POST",
  );
  return publicado.id;
}

/** Facebook acepta el video en una sola llamada: se le pasa la URL. */
async function publicarFacebook(fila: Fila): Promise<string> {
  const page = Deno.env.get("META_PAGE_ID");
  if (!page) throw new Error("falta META_PAGE_ID");
  const r = await graph<{ id: string }>(
    `${page}/videos`,
    { file_url: fila.video_url, description: fila.caption },
    "POST",
  );
  return r.id;
}

Deno.serve(async (req) => {
  const seco = new URL(req.url).searchParams.get("dry") === "1";

  if (!Deno.env.get("META_ACCESS_TOKEN")) {
    return Response.json({ ok: false, reason: "falta META_ACCESS_TOKEN" });
  }

  // El turno es de quien hace más que no sale. nullsfirst pone primero lo
  // que nunca se publicó.
  const filas = await db<Fila[]>(
    "social_queue?enabled=is.true" +
      "&select=id,slug,video_url,caption,platforms,ig_creation_id" +
      "&order=last_posted_at.asc.nullsfirst,position.asc&limit=1",
  );
  const fila = filas[0];
  if (!fila) return Response.json({ ok: true, reason: "la cola está vacía" });

  if (seco) {
    return Response.json({
      ok: true,
      seco: true,
      publicaria: { slug: fila.slug, platforms: fila.platforms, caption: fila.caption },
    });
  }

  const publicado: Record<string, string> = {};
  const fallos: Record<string, string> = {};

  // Cada red por separado: que una falle no deja a la otra sin publicación.
  for (const red of fila.platforms) {
    try {
      const id = red === "instagram"
        ? await publicarInstagram(fila)
        : red === "facebook"
        ? await publicarFacebook(fila)
        : null;
      if (id === null) {
        fallos[red] = "red desconocida";
        continue;
      }
      publicado[red] = id;
      await registrar(fila, red, "ok", id, null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      fallos[red] = msg;
      await registrar(fila, red, "error", null, msg);
    }
  }

  // La fila pasa al final de la rotación solo si salió en alguna red. Si
  // fallaron todas, conserva el turno y se reintenta mañana.
  if (Object.keys(publicado).length > 0) {
    await db("rpc/social_marcar_publicado", {
      method: "POST",
      body: { p_id: fila.id },
      prefer: "return=minimal",
    });
  }

  return Response.json({
    ok: Object.keys(fallos).length === 0,
    slug: fila.slug,
    publicado,
    fallos,
  });
});
