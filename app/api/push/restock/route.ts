import { NextResponse } from "next/server";
import { getProduct } from "@/lib/data";
import { chatConfigured } from "@/lib/chat-server";
import { isSubscription, pushConfigured, saveSubscription } from "@/lib/push-server";
import { allow, clientIp } from "@/lib/rate-limit";

/** "Avisame cuando vuelva": aviso push cuando un producto agotado se repone. */
export async function POST(request: Request) {
  if (!chatConfigured() || !pushConfigured()) return NextResponse.json({ error: "no_push" }, { status: 503 });
  if (!allow(`restock:${clientIp(request)}`, 20, 10 * 60 * 1000)) return NextResponse.json({ error: "slow_down" }, { status: 429 });
  let body: { productId?: number; subscription?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const id = Number(body.productId);
  if (!getProduct(id) || !isSubscription(body.subscription)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    await saveSubscription("restock", body.subscription, null, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error guardando aviso de reposición:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
