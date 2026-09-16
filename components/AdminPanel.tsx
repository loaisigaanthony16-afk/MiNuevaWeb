"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, Lock, PackageCheck, RefreshCw, Send } from "lucide-react";
import { askNotificationPermission, notify, type ChatMessage } from "@/lib/chat-client";

const KEY = "vibeAdminKey";
const POLL_MS = 5000;

interface OpenOrder {
  orderId: string;
  totalUsd: number;
  items: { name: string; qty: number }[];
  createdAt: string;
  unread: number;
}

/**
 * Panel del comercio: pedidos pagados con chat abierto, respuesta y
 * cierre al entregar. Se entra con la clave ADMIN_KEY configurada en
 * Vercel; se guarda en este navegador.
 */
export default function AdminPanel() {
  const [key, setKey] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [orders, setOrders] = useState<OpenOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const lastId = useRef(0);
  const knownUnread = useRef<Record<string, number>>({});
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setKey(window.localStorage.getItem(KEY) ?? "");
    } catch {
      setKey("");
    }
  }, []);

  const headers = useCallback(() => ({ "x-admin-key": key ?? "", "Content-Type": "application/json" }), [key]);

  const loadOrders = useCallback(async () => {
    if (!key) return;
    const res = await fetch("/api/admin/orders", { headers: headers(), cache: "no-store" });
    if (res.status === 401) {
      setError("Clave incorrecta.");
      setOrders(null);
      return;
    }
    if (res.status === 503) {
      setError("El panel no está configurado (falta ADMIN_KEY o la base).");
      return;
    }
    if (!res.ok) {
      setError("No se pudo cargar.");
      return;
    }
    setError(null);
    const data = (await res.json()) as { orders: OpenOrder[] };
    for (const o of data.orders) {
      const before = knownUnread.current[o.orderId] ?? 0;
      if (o.unread > before && o.orderId !== active) notify(`Pedido ${o.orderId}`, "Mensaje nuevo del cliente");
      knownUnread.current[o.orderId] = o.unread;
    }
    setOrders(data.orders);
  }, [key, headers, active]);

  const loadChat = useCallback(async () => {
    if (!key || !active) return;
    const res = await fetch(`/api/admin/chat/${active}?after=${lastId.current}`, { headers: headers(), cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { messages: ChatMessage[] };
    if (data.messages.length) {
      lastId.current = data.messages[data.messages.length - 1].id;
      setMessages((prev) => [...prev, ...data.messages]);
      setTimeout(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      }, 50);
    }
  }, [key, active, headers]);

  useEffect(() => {
    if (!key) return;
    askNotificationPermission();
    void loadOrders();
    const id = setInterval(loadOrders, POLL_MS);
    return () => clearInterval(id);
  }, [key, loadOrders]);

  useEffect(() => {
    if (!active) return;
    lastId.current = 0;
    setMessages([]);
    void loadChat();
    const id = setInterval(loadChat, POLL_MS);
    return () => clearInterval(id);
  }, [active, loadChat]);

  function login(e: React.FormEvent) {
    e.preventDefault();
    try {
      window.localStorage.setItem(KEY, input.trim());
    } catch {
      /* noop */
    }
    setKey(input.trim());
  }

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !draft.trim() || busy) return;
    setBusy(true);
    const res = await fetch(`/api/admin/chat/${active}`, { method: "POST", headers: headers(), body: JSON.stringify({ body: draft.trim() }) });
    setBusy(false);
    if (!res.ok) return;
    const { message } = (await res.json()) as { message: ChatMessage };
    lastId.current = Math.max(lastId.current, message.id);
    setMessages((prev) => [...prev, message]);
    setDraft("");
  }

  async function deliver() {
    if (!active || !window.confirm("¿Marcar como entregado? La conversación se borra y no se puede recuperar.")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/deliver/${active}`, { method: "POST", headers: headers() });
    setBusy(false);
    if (res.ok) {
      setActive(null);
      void loadOrders();
    }
  }

  if (key === null) return null;

  if (!key || (error && error.startsWith("Clave"))) {
    return (
      <form onSubmit={login} className="mx-auto max-w-sm rounded-[20px] border border-[#262626] p-8">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide2 text-gold-300">
          <Lock className="h-3.5 w-3.5" /> Panel de pedidos
        </p>
        <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Clave del panel" className="field mt-5" autoFocus />
        {error && <p className="mt-2 text-[12.5px] text-red-400">{error}</p>}
        <button type="submit" className="btn-gold mt-4 w-full">Entrar</button>
      </form>
    );
  }

  const current = orders?.find((o) => o.orderId === active) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-[20px] border border-[#262626] p-3">
        <div className="flex items-center justify-between px-2 py-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide2 text-ink-500">Chats abiertos</p>
          <button onClick={() => void loadOrders()} aria-label="Actualizar" className="text-ink-500 hover:text-ink-100">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        {error && <p className="px-2 py-2 text-[12.5px] text-red-400">{error}</p>}
        {orders && orders.length === 0 && <p className="px-2 py-6 text-center text-[13px] text-ink-500">Sin pedidos pendientes.</p>}
        <ul className="mt-1 space-y-1">
          {orders?.map((o, i) => (
            <li key={o.orderId} className="row-in" style={{ "--i": i } as React.CSSProperties}>
              <button
                onClick={() => setActive(o.orderId)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${active === o.orderId ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
              >
                <span>
                  <span className="block font-mono text-[12.5px] text-ink-50">{o.orderId}</span>
                  <span className="block text-[11.5px] text-ink-500">
                    ${o.totalUsd.toFixed(2)} · {new Date(o.createdAt).toLocaleDateString()}
                  </span>
                </span>
                {o.unread > 0 && (
                  <span key={o.unread} className="badge-pop grid h-5 min-w-[20px] place-items-center rounded-full bg-gold-400 px-1.5 text-[11px] font-bold text-ink-900">{o.unread}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex h-[min(78dvh,720px)] flex-col overflow-hidden rounded-[20px] border border-[#262626]">
        {!current ? (
          <p className="m-auto text-[13px] text-ink-500">Elegí un pedido.</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-[#262626] px-4 py-3">
              <div className="min-w-0">
                <p className="font-mono text-[13px] text-ink-50">{current.orderId}</p>
                <p className="truncate text-[12px] text-ink-500">
                  {current.items.map((i) => `${i.qty}x ${i.name}`).join(", ")} · ${current.totalUsd.toFixed(2)}
                </p>
              </div>
              <button onClick={() => void deliver()} disabled={busy} className="flex shrink-0 items-center gap-2 rounded-full bg-hybrid px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-white disabled:opacity-50">
                <PackageCheck className="h-4 w-4" /> Entregado
              </button>
            </div>
            <div ref={listRef} className="no-scrollbar min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
              {messages.map((m) => (
                <div key={m.id} className={`bubble-in flex ${m.sender === "shop" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] whitespace-pre-line break-words rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${m.sender === "shop" ? "bg-gold-400 text-ink-900" : "bg-white/[0.06] text-ink-100"}`}>
                    {m.body}
                    <span className={`mt-1 block text-[10px] ${m.sender === "shop" ? "text-ink-900/60" : "text-ink-500"}`}>
                      {new Date(m.at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={reply} className="flex items-end gap-2 border-t border-[#262626] p-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void reply(e);
                  }
                }}
                rows={1}
                maxLength={1200}
                placeholder="Responder…"
                className="field h-auto max-h-32 min-h-[44px] resize-none py-2.5 text-[14px]"
              />
              <button type="submit" disabled={!draft.trim() || busy} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold-400 text-ink-900 transition hover:bg-gold-300 disabled:opacity-40 ${busy ? "send-pop" : ""}`}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </>
        )}
      </section>
      <p className="flex items-center gap-1.5 text-[11px] text-ink-600 lg:col-span-2">
        <Check className="h-3 w-3" /> Mensajes cifrados en la base. Al marcar entregado se borran.
      </p>
    </div>
  );
}
