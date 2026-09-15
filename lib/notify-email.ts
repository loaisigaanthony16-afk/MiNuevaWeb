// =====================================================================
// Avisos por correo al comercio (Resend).
//
// Se envía un correo cuando un pedido queda pagado y cuando un cliente
// escribe en el chat y el comercio no tenía nada pendiente de leer.
// Los correos nunca llevan datos del cliente ni el texto de los mensajes:
// solo la referencia y un enlace al panel. Todo eso sigue cifrado en la
// base y se lee desde vibe505.com/admin.
//
// Si falta RESEND_API_KEY no pasa nada: el pedido y el chat siguen igual.
// =====================================================================

if (typeof window !== "undefined") {
  throw new Error("lib/notify-email.ts es solo para el servidor");
}

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.vibe505.com").replace(/\/$/, "");

const TO_DEFAULT = "loaisigaanthony16@gmail.com";
const FROM_DEFAULT = "Vibe 505 <onboarding@resend.dev>";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function recipients(): string[] {
  return (process.env.NOTIFY_EMAIL ?? TO_DEFAULT)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

async function send(subject: string, lines: string[]): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111">${lines
    .map((l) => `<p style="margin:0 0 10px">${l}</p>`)
    .join("")}</div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM ?? FROM_DEFAULT,
      to: recipients(),
      subject,
      html,
      text: lines.map((l) => l.replace(/<[^>]+>/g, "")).join("\n"),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

const panel = () => `${siteUrl()}/admin`;

/** Pedido pagado: referencia, artículos e importe. Sin datos del cliente. */
export async function notifyPaidOrder(order: {
  orderId: string;
  totalUsd: number;
  items: { name: string; qty: number }[];
}): Promise<void> {
  try {
    const items = order.items.map((i) => `${i.qty}× ${esc(i.name)}`).join("<br>");
    await send(`Nuevo pedido pagado · ${order.orderId}`, [
      `<strong>Pedido ${esc(order.orderId)}</strong> — pagado.`,
      items,
      `Total cobrado: <strong>$${Number(order.totalUsd).toFixed(2)}</strong>`,
      `Los datos de entrega están en el chat cifrado del pedido: <a href="${panel()}">${panel()}</a>`,
    ]);
  } catch (err) {
    console.error("No se pudo enviar el aviso de pedido:", err instanceof Error ? err.message : "desconocido");
  }
}

/** Mensaje nuevo de un cliente. No incluye el texto: se lee en el panel. */
export async function notifyClientMessage(orderId: string): Promise<void> {
  try {
    await send(`Mensaje nuevo · ${orderId}`, [
      `El cliente del pedido <strong>${esc(orderId)}</strong> escribió en el chat.`,
      `Respondé desde el panel: <a href="${panel()}">${panel()}</a>`,
    ]);
  } catch (err) {
    console.error("No se pudo enviar el aviso de mensaje:", err instanceof Error ? err.message : "desconocido");
  }
}
