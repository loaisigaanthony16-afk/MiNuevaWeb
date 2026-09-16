import { NextResponse } from "next/server";
import { chatConfigured, isAdmin } from "@/lib/chat-server";
import { isSubscription, pushConfigured, removeSubscription, saveSubscription } from "@/lib/push-server";

/** Panel: suscribir este navegador a los avisos push del comercio. */
export async function POST(request: Request) {
  if (!process.env.ADMIN_KEY) return NextResponse.json({ error: "no_admin" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "forbidden" }, { status: 401 });
  if (!chatConfigured() || !pushConfigured()) return NextResponse.json({ error: "no_push" }, { status: 503 });
  let body: { subscription?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!isSubscription(body.subscription)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    await saveSubscription("shop", body.subscription, null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error guardando push (panel):", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!process.env.ADMIN_KEY) return NextResponse.json({ error: "no_admin" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "forbidden" }, { status: 401 });
  const endpoint = new URL(request.url).searchParams.get("endpoint") ?? "";
  if (!/^https:\/\//.test(endpoint)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await removeSubscription(endpoint).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
