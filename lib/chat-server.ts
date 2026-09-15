// =====================================================================
// Chat por pedido, lado servidor.
//
// - Cada pedido tiene un `chat_token` secreto que solo conoce el navegador
//   que lo pagó. Sin ese token no se lee ni se escribe.
// - Los mensajes se guardan cifrados con AES-256-GCM: en la base solo hay
//   texto ilegible. La clave vive en CHAT_SECRET (o, si falta, se deriva de
//   la clave de servicio de Supabase).
// - Al marcar el pedido como entregado se borran todos los mensajes.
// =====================================================================

import crypto from "node:crypto";
import { db, ordersDbConfigured } from "@/lib/supabase-server";

if (typeof window !== "undefined") {
  throw new Error("lib/chat-server.ts es solo para el servidor");
}

export type Sender = "client" | "shop";

export interface ChatMessage {
  id: number;
  sender: Sender;
  body: string;
  at: string;
}

export interface ChatOrder {
  order_id: string;
  status: string;
  chat_token: string | null;
  delivered_at: string | null;
  shop_seen_at: string | null;
  client_seen_at: string | null;
  total_usd: number;
  items: { name: string; qty: number }[];
  created_at: string;
}

const ORDER_SELECT =
  "select=order_id,status,chat_token,delivered_at,shop_seen_at,client_seen_at,total_usd,items,created_at";

// ---------------------------------------------------------------- cifrado
function key(): Buffer {
  const secret = process.env.CHAT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Falta CHAT_SECRET");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return `${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${enc.toString("base64")}`;
}

export function decrypt(payload: string): string {
  const [iv, tag, enc] = payload.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(enc, "base64")), decipher.final()]).toString("utf8");
}

export function newChatToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// ---------------------------------------------------------------- pedidos
export function chatConfigured(): boolean {
  return ordersDbConfigured();
}

export async function getChatOrder(orderId: string): Promise<ChatOrder | null> {
  const rows = await db<ChatOrder[]>(`orders?order_id=eq.${encodeURIComponent(orderId)}&${ORDER_SELECT}`);
  return rows[0] ?? null;
}

/** Pedido si el token coincide y el chat sigue abierto; null si no. */
export async function authorizeClient(orderId: string, token: string): Promise<ChatOrder | null> {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const order = await getChatOrder(orderId);
  if (!order || !order.chat_token || !safeEqual(order.chat_token, token)) return null;
  return order;
}

export async function listMessages(orderId: string, afterId = 0): Promise<ChatMessage[]> {
  const rows = await db<{ id: number; sender: Sender; body_enc: string; created_at: string }[]>(
    `messages?order_id=eq.${encodeURIComponent(orderId)}&id=gt.${afterId}&order=id.asc&select=id,sender,body_enc,created_at`
  );
  return rows.map((r) => {
    let body = "";
    try {
      body = decrypt(r.body_enc);
    } catch {
      body = "[mensaje ilegible]";
    }
    return { id: r.id, sender: r.sender, body, at: r.created_at };
  });
}

export async function addMessage(orderId: string, sender: Sender, body: string): Promise<ChatMessage> {
  const text = body.trim().slice(0, 1200);
  const rows = await db<{ id: number; created_at: string }[]>("messages", {
    method: "POST",
    prefer: "return=representation",
    body: { order_id: orderId, sender, body_enc: encrypt(text) },
  });
  return { id: rows[0].id, sender, body: text, at: rows[0].created_at };
}

export async function touchSeen(orderId: string, who: Sender): Promise<void> {
  const col = who === "shop" ? "shop_seen_at" : "client_seen_at";
  await db(`orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: { [col]: new Date().toISOString() },
  });
}

/** Cuántos mensajes de la otra parte llegaron después de la última lectura. */
export async function unreadCount(orderId: string, forWho: Sender, seenAt: string | null): Promise<number> {
  const other = forWho === "shop" ? "client" : "shop";
  const since = seenAt ? `&created_at=gt.${encodeURIComponent(seenAt)}` : "";
  const rows = await db<{ id: number }[]>(
    `messages?order_id=eq.${encodeURIComponent(orderId)}&sender=eq.${other}${since}&select=id`
  );
  return rows.length;
}

/** Entregado: se borran los mensajes y se cierra el chat. */
export async function markDelivered(orderId: string): Promise<void> {
  await db(`messages?order_id=eq.${encodeURIComponent(orderId)}`, { method: "DELETE", prefer: "return=minimal" });
  await db(`orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: { delivered_at: new Date().toISOString(), chat_token: null },
  });
}

/** Pedidos pagados con chat abierto, los más nuevos primero. */
export async function listOpenOrders(): Promise<ChatOrder[]> {
  return db<ChatOrder[]>(`orders?status=eq.paid&delivered_at=is.null&order=created_at.desc&limit=200&${ORDER_SELECT}`);
}

// ---------------------------------------------------------------- admin
export function isAdmin(request: Request): boolean {
  const expected = process.env.ADMIN_KEY;
  const given = request.headers.get("x-admin-key") ?? "";
  return Boolean(expected) && expected!.length >= 8 && safeEqual(given, expected!);
}
