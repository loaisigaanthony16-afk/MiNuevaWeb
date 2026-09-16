"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, Lock, PackageCheck, Send } from "lucide-react";
import { askNotificationPermission, fetchChat, notify, sendChat, type ChatMessage } from "@/lib/chat-client";
import { clearPendingOrder } from "@/lib/pending-order";
import { useT } from "@/components/locale-context";

const POLL_MS = 4000;

/**
 * Chat cifrado del pedido, en la misma página.
 *
 * - `firstMessage`: datos de entrega guardados en el dispositivo; se
 *   mandan solos la primera vez que se abre el chat.
 * - Consulta mensajes nuevos cada 4 s, avisa con una notificación cuando
 *   la pestaña no está a la vista y marca el pedido como entregado cuando
 *   el comercio cierra la conversación.
 */
export default function OrderChat({
  orderId,
  token,
  firstMessage,
}: {
  orderId: string;
  token: string;
  firstMessage?: string | null;
}) {
  const t = useT();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<"loading" | "open" | "delivered" | "closed" | "error">("loading");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const lastId = useRef(0);
  const seeded = useRef(false);
  const hasClientMsg = useRef(false);
  // Cuántos mensajes llegaron en la primera carga: esos entran escalonados.
  const initialCount = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // Sin repetidos aunque dos consultas se crucen (o el modo estricto
  // de desarrollo monte el componente dos veces).
  const append = (incoming: ChatMessage[]) =>
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      return [...prev, ...incoming.filter((m) => !seen.has(m.id))];
    });

  const poll = useCallback(async () => {
    const seen = document.visibilityState === "visible";
    const res = await fetchChat(orderId, token, lastId.current, seen);
    if (!res.ok) {
      setState((s) => (res.reason === "closed" ? (s === "open" || s === "loading" ? "delivered" : s) : s === "loading" ? "error" : s));
      if (res.reason === "closed") clearPendingOrder();
      return;
    }
    const { data } = res;
    if (initialCount.current === null) initialCount.current = data.messages.length;
    if (data.messages.length) {
      lastId.current = data.messages[data.messages.length - 1].id;
      append(data.messages);
      if (data.messages.some((m) => m.sender === "client")) hasClientMsg.current = true;
      const fromShop = data.messages.filter((m) => m.sender === "shop");
      if (fromShop.length && seeded.current) {
        notify("Vibe 505", fromShop[fromShop.length - 1].body.slice(0, 120));
      }
      setTimeout(scrollDown, 50);
    }
    if (data.delivered) {
      setState("delivered");
      clearPendingOrder();
      return;
    }
    setState("open");

    // Datos de entrega: se mandan solos una vez, apenas el pago figura
    // confirmado y si el cliente todavía no escribió nada (la bienvenida
    // del comercio puede estar ya en el chat).
    if (!seeded.current && data.status === "paid") {
      seeded.current = true;
      if (firstMessage && !hasClientMsg.current) {
        const sent = await sendChat(orderId, token, firstMessage);
        if (sent) {
          hasClientMsg.current = true;
          lastId.current = Math.max(lastId.current, sent.id);
          append([sent]);
          setTimeout(scrollDown, 50);
        }
      }
    }
  }, [orderId, token, firstMessage]);

  useEffect(() => {
    askNotificationPermission();
    void poll();
    const id = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const sent = await sendChat(orderId, token, text);
    setSending(false);
    if (!sent) return;
    lastId.current = Math.max(lastId.current, sent.id);
    append([sent]);
    setDraft("");
    setTimeout(scrollDown, 50);
  }

  return (
    <div className="flex h-[min(64dvh,600px)] flex-col overflow-hidden rounded-[20px] border border-[#262626] bg-[#0A0A0A] text-left">
      <div className="flex items-center justify-between border-b border-[#262626] px-4 py-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide2 text-gold-300">
            <Lock className="h-3.5 w-3.5" />
            {t("chat.title")}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-ink-500">{orderId}</p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-ink-500">
          <span className="co-live h-1.5 w-1.5 rounded-full bg-hybrid" />
          {state === "delivered" ? t("chat.closed") : t("chat.live")}
        </span>
      </div>

      <div ref={listRef} className="no-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {state === "loading" && (
          <p className="flex items-center justify-center gap-2 py-10 text-[13px] text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("chat.loading")}
          </p>
        )}
        {state === "error" && <p className="py-10 text-center text-[13px] text-red-400">{t("chat.error")}</p>}
        {state !== "loading" && state !== "error" && messages.length === 0 && (
          <p className="py-8 text-center text-[13px] text-ink-500">{t("chat.empty")}</p>
        )}
        {messages.map((m, i) => (
          <div
            key={m.id}
            className={`bubble-in flex ${m.sender === "client" ? "justify-end" : "justify-start"}`}
            style={{ "--i": i < (initialCount.current ?? 0) ? i : 0 } as React.CSSProperties}
          >
            <div
              className={`max-w-[85%] whitespace-pre-line break-words rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                m.sender === "client" ? "rounded-br-md bg-gold-400 text-ink-900" : "rounded-bl-md bg-white/[0.06] text-ink-100"
              }`}
            >
              {m.body}
              <span className={`mt-1 block text-[10px] ${m.sender === "client" ? "text-ink-900/60" : "text-ink-500"}`}>
                {m.sender === "shop" ? "Vibe 505 · " : ""}
                {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
        {state === "delivered" && (
          <div className="bubble-in mt-4 rounded-2xl border border-hybrid/30 bg-hybrid/10 p-4 text-center">
            <PackageCheck className="delivered-pop mx-auto h-6 w-6 text-hybrid" />
            <p className="mt-2 text-[14px] font-semibold text-ink-50">{t("chat.deliveredTitle")}</p>
            <p className="mt-1 text-[12.5px] text-ink-400">{t("chat.deliveredBody")}</p>
          </div>
        )}
      </div>

      {state === "open" && (
        <form onSubmit={submit} className="flex items-end gap-2 border-t border-[#262626] p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit(e);
              }
            }}
            rows={1}
            maxLength={1200}
            placeholder={t("chat.placeholder")}
            className="field h-auto max-h-32 min-h-[44px] resize-none py-2.5 text-[14px]"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            aria-label={t("chat.send")}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold-400 text-ink-900 transition hover:bg-gold-300 disabled:opacity-40 ${sending ? "send-pop" : ""}`}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      )}
      <p className="flex items-center justify-center gap-1.5 border-t border-[#262626] px-4 py-2 text-[11px] text-ink-600">
        <Check className="h-3 w-3" />
        {t("chat.encrypted")}
      </p>
    </div>
  );
}
