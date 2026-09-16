// =====================================================================
// Notificaciones push (Web Push con claves VAPID).
//
// - El cliente se suscribe con el token de su pedido; el comercio, desde
//   el panel. Las suscripciones viven en `push_subscriptions`.
// - Los avisos nunca llevan el texto de los mensajes ni datos de entrega:
//   solo "hay novedad en tu pedido" y el enlace.
// - Sin claves VAPID no pasa nada: todo lo demás sigue funcionando.
// =====================================================================

import webpush, { type PushSubscription } from "web-push";
import { db } from "@/lib/supabase-server";

if (typeof window !== "undefined") {
  throw new Error("lib/push-server.ts es solo para el servidor");
}

let ready = false;

export function pushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function setup(): boolean {
  if (!pushConfigured()) return false;
  if (!ready) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:loaisigaanthony16@gmail.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    ready = true;
  }
  return true;
}

export interface SubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function isSubscription(v: unknown): v is SubscriptionInput {
  const s = v as SubscriptionInput;
  return (
    typeof s?.endpoint === "string" &&
    /^https:\/\//.test(s.endpoint) &&
    s.endpoint.length < 2000 &&
    typeof s.keys?.p256dh === "string" &&
    typeof s.keys?.auth === "string"
  );
}

export async function saveSubscription(
  role: "client" | "shop" | "restock",
  sub: SubscriptionInput,
  orderId: string | null,
  productId: number | null = null
): Promise<void> {
  // Un mismo navegador puede pedir aviso de varios productos: el endpoint
  // se repite con distinto producto, así que ahí no se fusiona.
  if (role === "restock") {
    const existing = await db<{ id: number }[]>(
      `push_subscriptions?role=eq.restock&product_id=eq.${productId}&endpoint=eq.${encodeURIComponent(sub.endpoint)}&select=id`
    );
    if (existing.length) return;
    // El endpoint es único en la tabla: si ya está con otro rol/producto,
    // se guarda con sufijo lógico usando la misma fila (mismo navegador).
    try {
      await db("push_subscriptions", {
        method: "POST",
        prefer: "return=minimal",
        body: { role, product_id: productId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      });
    } catch {
      await db(`push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: { product_id: productId },
      });
    }
    return;
  }
  await db("push_subscriptions?on_conflict=endpoint", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: { role, order_id: orderId, product_id: productId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
}

/** Producto repuesto: avisa a quienes lo esperaban y borra esos avisos. */
export async function pushRestock(productId: number, name: string): Promise<void> {
  try {
    const rows = await db<Row[]>(`push_subscriptions?product_id=eq.${productId}&select=id,endpoint,p256dh,auth`);
    await sendAll(rows, { title: `${name} volvió`, body: "Ya está disponible otra vez. Pedilo antes de que se agote.", url: `/`, tag: `restock-${productId}` });
    await db(`push_subscriptions?product_id=eq.${productId}&role=eq.restock`, { method: "DELETE", prefer: "return=minimal" });
    await db(`push_subscriptions?product_id=eq.${productId}&role=neq.restock`, { method: "PATCH", prefer: "return=minimal", body: { product_id: null } });
  } catch (err) {
    console.error("Push de reposición falló:", err instanceof Error ? err.message : "desconocido");
  }
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await db(`push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: "DELETE", prefer: "return=minimal" });
}

interface Row {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendAll(rows: Row[], payload: { title: string; body: string; url: string; tag?: string }): Promise<void> {
  if (!rows.length || !setup()) return;
  await Promise.all(
    rows.map(async (r) => {
      const sub: PushSubscription = { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } };
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 60 * 60 * 6 });
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // Suscripción vencida o revocada: se limpia.
        if (status === 404 || status === 410) await removeSubscription(r.endpoint).catch(() => undefined);
      }
    })
  );
}

/** Aviso al cliente de un pedido (respuesta del comercio o cambio de estado). */
export async function pushClient(orderId: string, title: string, body: string): Promise<void> {
  try {
    const rows = await db<Row[]>(
      `push_subscriptions?role=eq.client&order_id=eq.${encodeURIComponent(orderId)}&select=id,endpoint,p256dh,auth`
    );
    await sendAll(rows, { title, body, url: "/pedido", tag: `order-${orderId}` });
  } catch (err) {
    console.error("Push al cliente falló:", err instanceof Error ? err.message : "desconocido");
  }
}

/** Aviso al comercio (pedido pagado o mensaje del cliente). */
export async function pushShop(title: string, body: string): Promise<void> {
  try {
    const rows = await db<Row[]>("push_subscriptions?role=eq.shop&select=id,endpoint,p256dh,auth");
    await sendAll(rows, { title, body, url: "/admin", tag: "shop" });
  } catch (err) {
    console.error("Push al comercio falló:", err instanceof Error ? err.message : "desconocido");
  }
}
