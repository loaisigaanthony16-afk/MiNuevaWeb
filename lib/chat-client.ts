// =====================================================================
// Chat del pedido, lado navegador.
// =====================================================================

export interface ChatMessage {
  id: number;
  sender: "client" | "shop";
  body: string;
  at: string;
}

export interface ChatState {
  status: string;
  delivered: boolean;
  messages: ChatMessage[];
  unread: number;
}

export type ChatResult = { ok: true; data: ChatState } | { ok: false; reason: "closed" | "error" };

export async function fetchChat(orderId: string, token: string, after = 0, seen = false): Promise<ChatResult> {
  try {
    const q = new URLSearchParams({ token, after: String(after), ...(seen ? { seen: "1" } : {}) });
    const res = await fetch(`/api/chat/${encodeURIComponent(orderId)}?${q}`, { cache: "no-store" });
    // Solo el 410 cierra el pedido en este dispositivo: un 404 (base no
    // disponible) o un 5xx son pasajeros y no deben borrar el aviso.
    if (res.status === 410) return { ok: false, reason: "closed" };
    if (!res.ok) return { ok: false, reason: "error" };
    return { ok: true, data: (await res.json()) as ChatState };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function sendChat(orderId: string, token: string, body: string): Promise<ChatMessage | null> {
  try {
    const res = await fetch(`/api/chat/${encodeURIComponent(orderId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, body }),
    });
    if (!res.ok) return null;
    return ((await res.json()) as { message: ChatMessage }).message;
  } catch {
    return null;
  }
}

/** Aviso del sistema cuando la pestaña no está a la vista. */
export function notify(title: string, body: string): void {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (document.visibilityState === "visible") return;
    new Notification(title, { body, icon: "/favicon.ico" });
  } catch {
    /* noop */
  }
}

export function askNotificationPermission(): void {
  try {
    if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
  } catch {
    /* noop */
  }
}
