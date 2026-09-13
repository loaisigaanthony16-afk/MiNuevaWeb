// =====================================================================
// Opiniones de la comunidad (Supabase).
//
// La clave publicable es pública por diseño: la base solo deja LEER lo no
// ocultado y ESCRIBIR a través de la función `post_opinion`, que valida
// largo, bloquea enlaces, frena el spam y no guarda IP ni contacto.
// Para moderar: en Supabase, poner `hidden = true` en la fila.
// =====================================================================

const SUPABASE_URL = "https://idefyablegqrnvwtvboo.supabase.co";
const SUPABASE_KEY = "sb_publishable_7l4ZUXGvJc0nbBYkkuyWow_uYHQdixL";

const HEADERS = {
  apikey: SUPABASE_KEY,
  "Content-Type": "application/json",
};

export interface Opinion {
  id: string;
  parent_id: string | null;
  alias: string;
  body: string;
  rating: number | null;
  created_at: string;
}

export interface Thread extends Opinion {
  replies: Opinion[];
}

/** Códigos de error que devuelve la base; cada uno tiene su texto. */
export const OPINION_ERRORS = [
  "alias_invalido",
  "texto_invalido",
  "sin_enlaces",
  "calificacion_invalida",
  "respuesta_invalida",
  "demasiadas",
  "repetida",
] as const;
export type OpinionError = (typeof OPINION_ERRORS)[number] | "generic";

export class PostError extends Error {
  constructor(public code: OpinionError) {
    super(code);
  }
}

/** Trae opiniones y respuestas, agrupadas en hilos (lo más nuevo arriba). */
export async function fetchThreads(): Promise<Thread[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/opinions?select=id,parent_id,alias,body,rating,created_at&order=created_at.desc&limit=500`,
    { headers: HEADERS, cache: "no-store" }
  );
  if (!res.ok) throw new Error("load");
  const rows = (await res.json()) as Opinion[];

  const threads = rows
    .filter((r) => r.parent_id === null)
    .map((r) => ({ ...r, replies: [] as Opinion[] }));
  const byId = new Map(threads.map((t) => [t.id, t]));

  // Las respuestas se leen en orden cronológico dentro de su hilo.
  for (const r of [...rows].reverse()) {
    if (r.parent_id) byId.get(r.parent_id)?.replies.push(r);
  }
  return threads;
}

export async function postOpinion(input: {
  alias: string;
  body: string;
  rating?: number | null;
  parentId?: string | null;
}): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/post_opinion`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        p_alias: input.alias,
        p_body: input.body,
        p_rating: input.parentId ? null : input.rating ?? null,
        p_parent: input.parentId ?? null,
      }),
    });
  } catch {
    throw new PostError("generic");
  }

  if (res.ok) return (await res.json()) as string;

  const data = (await res.json().catch(() => null)) as { message?: string } | null;
  const code = OPINION_ERRORS.find((c) => c === data?.message);
  throw new PostError(code ?? "generic");
}

/** Promedio de estrellas de las opiniones principales. */
export function averageRating(threads: Thread[]): number | null {
  const rated = threads.filter((t) => typeof t.rating === "number");
  if (!rated.length) return null;
  return rated.reduce((acc, t) => acc + (t.rating ?? 0), 0) / rated.length;
}
