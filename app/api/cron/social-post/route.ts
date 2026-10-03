import { NextResponse } from "next/server";
import { db, ordersDbConfigured } from "@/lib/supabase-server";
import {
  fbPublicarVideo,
  igCrearContenedor,
  igEstadoContenedor,
  igPublicar,
  metaConfigured,
  MetaError,
} from "@/lib/social-meta";

/**
 * Publicación diaria en Instagram y Facebook.
 *
 * Toma de `social_queue` la pieza habilitada que lleva más tiempo sin
 * salir, la sube a las dos redes y actualiza la fila, así la tanda rota
 * sola. Lo llama el cron de Vercel (vercel.json) con el CRON_SECRET.
 *
 * A mano, para probar antes de dejarlo solo:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" \
 *        "https://www.vibe505.com/api/cron/social-post?dry=1"
 *
 * `dry=1` dice qué publicaría sin publicar nada.
 */

// Instagram procesa el video antes de dejarlo publicar. Con 60 s alcanza
// de sobra para un reel de 6 s; si no, el contenedor queda guardado y lo
// termina la corrida siguiente.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const ESPERA_MAX_MS = 42_000;
const ESPERA_ENTRE_SONDEOS_MS = 3_000;

interface Fila {
  id: number;
  slug: string;
  video_url: string;
  caption: string;
  platforms: string[];
  ig_creation_id: string | null;
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function registrar(
  fila: Fila,
  platform: string,
  status: "ok" | "error",
  remote_id: string | null,
  error: string | null
) {
  await db("social_posts", {
    method: "POST",
    body: [{ queue_id: fila.id, slug: fila.slug, platform, status, remote_id, error }],
    prefer: "return=minimal",
  });
}

/** Crea el contenedor (o retoma el que quedó a medias) y lo publica. */
async function publicarInstagram(fila: Fila): Promise<string> {
  let creationId = fila.ig_creation_id;

  if (!creationId) {
    creationId = await igCrearContenedor(fila.video_url, fila.caption);
    // Se guarda antes de esperar: si la función se corta acá, la próxima
    // corrida retoma este contenedor en vez de volver a subir el video.
    await db(`social_queue?id=eq.${fila.id}`, {
      method: "PATCH",
      body: { ig_creation_id: creationId, ig_creation_at: new Date().toISOString() },
      prefer: "return=minimal",
    });
  }

  const limite = Date.now() + ESPERA_MAX_MS;
  for (;;) {
    const { estado, detalle } = await igEstadoContenedor(creationId);
    if (estado === "listo") break;
    if (estado === "error") throw new MetaError(`Instagram rechazó el video: ${detalle}`);
    if (Date.now() > limite) {
      throw new MetaError("Instagram sigue procesando; la próxima corrida lo termina");
    }
    await dormir(ESPERA_ENTRE_SONDEOS_MS);
  }

  const mediaId = await igPublicar(creationId);
  // Publicado: se limpia el contenedor para que no se reintente.
  await db(`social_queue?id=eq.${fila.id}`, {
    method: "PATCH",
    body: { ig_creation_id: null, ig_creation_at: null },
    prefer: "return=minimal",
  });
  return mediaId;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "forbidden" }, { status: 401 });
  }
  if (!ordersDbConfigured()) {
    return NextResponse.json({ ok: false, reason: "falta SUPABASE_SERVICE_ROLE_KEY" });
  }
  if (!metaConfigured()) {
    return NextResponse.json({ ok: false, reason: "falta META_ACCESS_TOKEN" });
  }

  const seco = new URL(request.url).searchParams.get("dry") === "1";

  // El turno es de quien hace más que no sale. nulls first pone primero
  // lo que nunca se ha publicado.
  const filas = await db<Fila[]>(
    "social_queue?enabled=is.true" +
      "&select=id,slug,video_url,caption,platforms,ig_creation_id" +
      "&order=last_posted_at.asc.nullsfirst,position.asc&limit=1"
  );
  const fila = filas[0];
  if (!fila) return NextResponse.json({ ok: true, reason: "la cola está vacía" });

  if (seco) {
    return NextResponse.json({
      ok: true,
      seco: true,
      publicaria: { slug: fila.slug, platforms: fila.platforms, caption: fila.caption },
    });
  }

  const resultado: Record<string, string> = {};
  const fallos: Record<string, string> = {};

  // Las dos redes van por separado a propósito: que Instagram falle no
  // tiene por qué dejar a Facebook sin publicación.
  for (const red of fila.platforms) {
    try {
      const id =
        red === "instagram"
          ? await publicarInstagram(fila)
          : red === "facebook"
            ? await fbPublicarVideo(fila.video_url, fila.caption)
            : null;
      if (id === null) {
        fallos[red] = "red desconocida";
        continue;
      }
      resultado[red] = id;
      await registrar(fila, red, "ok", id, null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      fallos[red] = msg;
      await registrar(fila, red, "error", null, msg);
    }
  }

  // La fila pasa al final de la rotación solo si salió en alguna red. Si
  // fallaron las dos, conserva el turno y se reintenta mañana.
  if (Object.keys(resultado).length > 0) {
    await db("rpc/social_marcar_publicado", {
      method: "POST",
      body: { p_id: fila.id },
      prefer: "return=minimal",
    });
  }

  return NextResponse.json({
    ok: Object.keys(fallos).length === 0,
    slug: fila.slug,
    publicado: resultado,
    fallos,
  });
}
