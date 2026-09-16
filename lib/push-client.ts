// =====================================================================
// Avisos push, lado navegador: registra el service worker y guarda la
// suscripción en el servidor (cliente con su token; comercio con su clave).
// =====================================================================

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export type PushState = "unsupported" | "denied" | "off" | "on" | "ios-install";

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && Boolean(PUBLIC_KEY);
}

/** iPhone/iPad en Safari: los push solo funcionan como app en la pantalla de inicio. */
export function needsIosInstall(): boolean {
  if (typeof navigator === "undefined") return false;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  return ios && !standalone;
}

export async function currentPushState(): Promise<PushState> {
  if (!pushSupported()) return needsIosInstall() ? "ios-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await reg?.pushManager.getSubscription();
  return sub ? "on" : "off";
}

function toKey(base64: string): Uint8Array {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Pide permiso y devuelve la suscripción (null si no se pudo). Llamar desde un toque. */
export async function subscribePush(): Promise<PushSubscriptionJSON | null> {
  if (!pushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(PUBLIC_KEY!) as BufferSource }));
    return sub.toJSON();
  } catch {
    return null;
  }
}

/** Cliente: activa los avisos de su pedido. */
export async function enableOrderPush(orderId: string, token: string): Promise<boolean> {
  const sub = await subscribePush();
  if (!sub) return false;
  try {
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, token, subscription: sub }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Comercio: activa los avisos del panel. */
export async function enableShopPush(adminKey: string): Promise<boolean> {
  const sub = await subscribePush();
  if (!sub) return false;
  try {
    const res = await fetch("/api/admin/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ subscription: sub }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
