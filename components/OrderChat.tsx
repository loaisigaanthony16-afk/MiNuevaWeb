"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, BellRing, Check, Copy, Loader2, Lock, PackageCheck, RotateCcw, Send } from "lucide-react";
import { askNotificationPermission, fetchChat, notify, sendChat, type ChatMessage } from "@/lib/chat-client";
import { clearPendingOrder } from "@/lib/pending-order";
import { currentPushState, enableOrderPush, type PushState } from "@/lib/push-client";
import { rememberOwnCode, saveRefCode } from "@/lib/referral-client";
import { LOYALTY_COUPON_USD, LOYALTY_EVERY, purchasesToNext } from "@/lib/loyalty";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { useT } from "@/components/locale-context";
import OrderStepper from "@/components/OrderStepper";
import type { Fulfillment } from "@/lib/fulfillment";

const POLL_MS = 4000;

/**
 * Chat cifrado del pedido, en la misma página.
 *
 * - `firstMessage`: datos de entrega guardados en el dispositivo; se
 *   mandan solos la primera vez que se abre el chat.
 * - Consulta mensajes nuevos cada 4 s, avisa con una notificación cuando
 *   la pestaña no está a la vista y muestra el estado de la entrega.
 * - Entregado: la conversación se borró; queda el botón de volver a pedir
 *   y el código de amigo.
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
  const router = useRouter();
  const { add, clear } = useStore();
  const { openDrawer } = useUi();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<"loading" | "open" | "delivered" | "closed" | "error">("loading");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("recibido");
  const [items, setItems] = useState<{ id: number | null; name: string; qty: number }[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [loyalty, setLoyalty] = useState<{ purchases: number; credits: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [push, setPush] = useState<PushState>("unsupported");
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
    setFulfillment(data.fulfillment);
    if (data.items.length) setItems(data.items);
    if (data.referralCode) {
      setCode(data.referralCode);
      rememberOwnCode(data.referralCode);
      saveRefCode(data.referralCode);
    }
    if (data.loyalty) setLoyalty(data.loyalty);
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
    void currentPushState().then(setPush);
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

  async function enablePush() {
    const ok = await enableOrderPush(orderId, token);
    setPush(ok ? "on" : await currentPushState());
  }

  function reorder() {
    clear();
    for (const it of items) {
      if (it.id === null) continue;
      for (let i = 0; i < it.qty; i++) add(it.id);
    }
    router.push("/");
    setTimeout(openDrawer, 400);
  }

  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(`${code} · vibe505.com`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  }

  const delivered = state === "delivered";

  return (
    <div className="text-left">
      {/* Estado de la entrega */}
      {state !== "loading" && state !== "error" && (
        <div className="rise mb-4 rounded-2xl border border-[#262626] bg-[#0A0A0A] px-3 py-3.5 sm:px-4">
          <OrderStepper current={delivered ? "entregado" : fulfillment} />
        </div>
      )}

      <div className="flex h-[min(56dvh,540px)] flex-col overflow-hidden rounded-[20px] border border-[#262626] bg-[#0A0A0A]">
        <div className="flex items-center justify-between border-b border-[#262626] px-4 py-3">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide2 text-gold-300">
              <Lock className="h-3.5 w-3.5" />
              {t("chat.title")}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-ink-500">{orderId}</p>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] text-ink-500">
            <span className={`h-1.5 w-1.5 rounded-full ${delivered ? "bg-ink-600" : "co-live bg-hybrid"}`} />
            {delivered ? t("chat.closed") : t("chat.live")}
          </span>
        </div>

        <div ref={listRef} className="no-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
          {state === "loading" && (
            <p className="flex items-center justify-center gap-2 py-10 text-[13px] text-ink-500">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("chat.loading")}
            </p>
          )}
          {state === "error" && <p className="py-10 text-center text-[13px] text-red-400">{t("chat.error")}</p>}
          {state === "open" && messages.length === 0 && (
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
          {delivered && (
            <div className="bubble-in mt-2 rounded-2xl border border-hybrid/30 bg-hybrid/10 p-5 text-center">
              <PackageCheck className="delivered-pop mx-auto h-7 w-7 text-hybrid" />
              <p className="mt-2 text-[15px] font-semibold text-ink-50">{t("chat.deliveredTitle")}</p>
              <p className="mt-1 text-[12.5px] text-ink-400">{t("chat.deliveredBody")}</p>
              {items.some((i) => i.id !== null) && (
                <button onClick={reorder} className="btn-gold mt-5 w-full">
                  <RotateCcw className="h-4 w-4" />
                  {t("chat.reorder")}
                </button>
              )}
              <Link href="/#opiniones" className="mt-3 inline-block text-[13px] text-gold-300 underline-offset-4 hover:underline">
                {t("chat.review")} →
              </Link>
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

      {/* Avisos push */}
      {state === "open" && push !== "unsupported" && (
        <div className="rise mt-3" style={{ "--i": 1 } as React.CSSProperties}>
          {push === "on" ? (
            <p className="flex items-center justify-center gap-2 text-[12.5px] text-ink-400">
              <BellRing className="h-3.5 w-3.5 text-gold-300" /> {t("chat.pushOn")}
            </p>
          ) : push === "ios-install" ? (
            <p className="rounded-xl border border-[#262626] px-4 py-3 text-center text-[12px] leading-relaxed text-ink-400">{t("chat.pushIos")}</p>
          ) : push === "denied" ? null : (
            <button onClick={() => void enablePush()} className="btn-ghost w-full">
              <Bell className="h-4 w-4" />
              {t("chat.push")}
            </button>
          )}
        </div>
      )}

      {/* Código de cliente frecuente */}
      {code && (state === "open" || delivered) && (
        <div className="rise mt-4 rounded-2xl border border-gold-400/25 bg-gold-400/[0.04] p-4 text-center" style={{ "--i": 2 } as React.CSSProperties}>
          <p className="text-[10.5px] font-semibold uppercase tracking-wide3 text-gold-300">{t("chat.refTitle")}</p>
          <button onClick={() => void copyCode()} className="mt-2 inline-flex items-center gap-2 font-display text-[26px] font-bold tracking-[0.18em] text-ink-50">
            {code}
            {copied ? <Check className="h-4 w-4 text-hybrid" /> : <Copy className="h-4 w-4 text-ink-500" />}
          </button>
          <p className="mx-auto mt-1.5 max-w-xs text-[12px] leading-relaxed text-ink-400">
            {t("chat.refBody").replace("{n}", String(LOYALTY_EVERY)).replace("{usd}", String(LOYALTY_COUPON_USD))}
          </p>
          {loyalty && (
            <div className="mx-auto mt-3 max-w-xs">
              <div className="flex justify-center gap-1.5">
                {Array.from({ length: LOYALTY_EVERY }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2 w-8 rounded-full ${i < (loyalty.purchases % LOYALTY_EVERY === 0 ? LOYALTY_EVERY : loyalty.purchases % LOYALTY_EVERY) ? "bg-gold-400" : "bg-white/10"}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-[12px] text-ink-300">
                {loyalty.credits > 0
                  ? t("chat.refCoupon").replace("{usd}", String(LOYALTY_COUPON_USD))
                  : t("chat.refLeft").replace("{left}", String(purchasesToNext(loyalty.purchases)))}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
