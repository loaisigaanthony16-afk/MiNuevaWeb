"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellRing, Check, Loader2, Lock, PackageCheck, RefreshCw, Send } from "lucide-react";
import { askNotificationPermission, notify, type ChatMessage } from "@/lib/chat-client";
import { currentPushState, enableShopPush, type PushState } from "@/lib/push-client";
import { FULFILLMENT_LABEL, FULFILLMENT_STEPS, stepIndex, type Fulfillment } from "@/lib/fulfillment";
import { products } from "@/lib/data";
import OrderStepper from "@/components/OrderStepper";

const KEY = "vibeAdminKey";
const POLL_MS = 5000;

interface OpenOrder {
  orderId: string;
  totalUsd: number;
  items: { name: string; qty: number }[];
  createdAt: string;
  fulfillment: Fulfillment;
  unread: number;
}

interface Sale {
  orderId: string;
  items: { name: string; qty: number }[];
  totalUsd: number;
  paidAt: string;
  deliveredAt: string | null;
  fulfillment: Fulfillment;
}

type Tab = "pedidos" | "ventas" | "stock";

/**
 * Panel del comercio: pedidos pagados con chat abierto, estado de entrega,
 * historial de ventas y stock. Se entra con la clave ADMIN_KEY configurada
 * en Vercel; se guarda en este navegador.
 */
export default function AdminPanel() {
  const [key, setKey] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<Tab>("pedidos");
  const [orders, setOrders] = useState<OpenOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [push, setPush] = useState<PushState>("unsupported");
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

  const append = (incoming: ChatMessage[]) =>
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      return [...prev, ...incoming.filter((m) => !seen.has(m.id))];
    });

  const loadChat = useCallback(async () => {
    if (!key || !active) return;
    const res = await fetch(`/api/admin/chat/${active}?after=${lastId.current}`, { headers: headers(), cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { messages: ChatMessage[] };
    if (data.messages.length) {
      lastId.current = data.messages[data.messages.length - 1].id;
      append(data.messages);
      setTimeout(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      }, 50);
    }
  }, [key, active, headers]);

  useEffect(() => {
    if (!key) return;
    askNotificationPermission();
    void currentPushState().then(setPush);
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
    append([message]);
    setDraft("");
  }

  async function setStatus(f: Fulfillment) {
    if (!active || busy) return;
    if (f === "entregado" && !window.confirm("¿Marcar como entregado? La conversación se borra y no se puede recuperar.")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/status/${active}`, { method: "POST", headers: headers(), body: JSON.stringify({ fulfillment: f }) });
    setBusy(false);
    if (!res.ok) return;
    if (f === "entregado") setActive(null);
    else void loadChat();
    void loadOrders();
  }

  async function enablePush() {
    if (!key) return;
    const ok = await enableShopPush(key);
    setPush(ok ? "on" : await currentPushState());
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
  const totalUnread = orders?.reduce((a, o) => a + o.unread, 0) ?? 0;

  return (
    <div>
      {/* Pestañas + avisos */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border border-white/10 p-1">
          {(
            [
              ["pedidos", `Pedidos${orders ? ` · ${orders.length}` : ""}`],
              ["ventas", "Ventas"],
              ["stock", "Stock"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative h-9 rounded-full px-4 text-[12px] font-bold uppercase tracking-[0.08em] transition ${tab === id ? "bg-ink-50 text-ink-900" : "text-ink-400 hover:text-ink-50"}`}
            >
              {label}
              {id === "pedidos" && totalUnread > 0 && tab !== "pedidos" && (
                <span className="badge-pop absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-gold-400 px-1 text-[9px] text-ink-900">{totalUnread}</span>
              )}
            </button>
          ))}
        </div>
        {push !== "unsupported" &&
          (push === "on" ? (
            <span className="flex items-center gap-1.5 text-[12px] text-ink-400"><BellRing className="h-3.5 w-3.5 text-gold-300" /> Avisos push activos</span>
          ) : push === "ios-install" ? (
            <span className="text-[11.5px] text-ink-500">iPhone: agregá el panel a la pantalla de inicio para recibir avisos.</span>
          ) : push === "denied" ? (
            <span className="text-[11.5px] text-ink-500">Avisos bloqueados en este navegador.</span>
          ) : (
            <button onClick={() => void enablePush()} className="btn-ghost h-9 min-h-0 px-4 text-[12px]"><Bell className="h-3.5 w-3.5" /> Activar avisos push</button>
          ))}
      </div>

      {tab === "pedidos" && (
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
                    <span className="min-w-0">
                      <span className="block font-mono text-[12.5px] text-ink-50">{o.orderId}</span>
                      <span className="block text-[11.5px] text-ink-500">
                        ${o.totalUsd.toFixed(2)} · {new Date(o.createdAt).toLocaleDateString()} ·{" "}
                        <span className="text-gold-300">{FULFILLMENT_LABEL[o.fulfillment ?? "recibido"]}</span>
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
                <div className="border-b border-[#262626] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[13px] text-ink-50">{current.orderId}</p>
                      <p className="truncate text-[12px] text-ink-500">
                        {current.items.map((i) => `${i.qty}x ${i.name}`).join(", ")} · ${current.totalUsd.toFixed(2)}
                      </p>
                    </div>
                    <button onClick={() => void setStatus("entregado")} disabled={busy} className="flex shrink-0 items-center gap-2 rounded-full bg-hybrid px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-white disabled:opacity-50">
                      <PackageCheck className="h-4 w-4" /> Entregado
                    </button>
                  </div>
                  {/* Estado de entrega: un botón por paso */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {FULFILLMENT_STEPS.filter((s) => s !== "entregado").map((s) => {
                      const cur = current.fulfillment ?? "recibido";
                      const on = s === cur;
                      const past = stepIndex(s) < stepIndex(cur);
                      return (
                        <button
                          key={s}
                          onClick={() => void setStatus(s)}
                          disabled={busy || on}
                          className={`h-8 rounded-full px-3 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
                            on ? "bg-gold-400 text-ink-900" : past ? "border border-gold-400/40 text-gold-300" : "border border-white/12 text-ink-400 hover:text-ink-50"
                          }`}
                        >
                          {on && <Check className="mr-1 inline h-3 w-3" />}
                          {FULFILLMENT_LABEL[s]}
                        </button>
                      );
                    })}
                  </div>
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
      )}

      {tab === "ventas" && <SalesTab headers={headers} />}
      {tab === "stock" && <StockTab headers={headers} />}
    </div>
  );
}

// ---------------------------------------------------------------- ventas
function SalesTab({ headers }: { headers: () => Record<string, string> }) {
  const [data, setData] = useState<{ sales: Sale[]; months: Record<string, { count: number; totalUsd: number; units: number }> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/history", { headers: headers(), cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("No se pudo cargar el historial.");
        return (await r.json()) as typeof data;
      })
      .then((d) => alive && setData(d))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [headers]);

  if (error) return <p className="text-[13px] text-red-400">{error}</p>;
  if (!data) return <p className="flex items-center gap-2 text-[13px] text-ink-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>;

  const months = Object.entries(data.months).sort(([a], [b]) => (a < b ? 1 : -1));
  const fmtMonth = (k: string) => {
    const [y, m] = k.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("es", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {months.slice(0, 3).map(([k, m], i) => (
          <div key={k} className="row-in rounded-[20px] border border-[#262626] p-5" style={{ "--i": i } as React.CSSProperties}>
            <p className="text-[11px] font-semibold uppercase tracking-wide2 text-ink-500">{fmtMonth(k)}</p>
            <p className="mt-2 font-display text-[28px] font-bold tabular-nums text-gold-gradient">${m.totalUsd.toFixed(2)}</p>
            <p className="mt-1 text-[12.5px] text-ink-400">{m.count} pedidos · {m.units} unidades</p>
          </div>
        ))}
        {months.length === 0 && <p className="text-[13px] text-ink-500">Todavía no hay ventas.</p>}
      </div>

      {data.sales.length > 0 && (
        <div className="overflow-x-auto rounded-[20px] border border-[#262626]">
          <table className="w-full text-left text-[12.5px]">
            <thead className="text-[10.5px] uppercase tracking-wide2 text-ink-500">
              <tr className="border-b border-[#262626]">
                <th className="px-4 py-3">Referencia</th>
                <th className="px-4 py-3">Artículos</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Pagado</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.sales.map((s, i) => (
                <tr key={s.orderId} className="row-in border-b border-[#1c1c1c] last:border-0" style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
                  <td className="px-4 py-3 font-mono text-ink-50">{s.orderId}</td>
                  <td className="px-4 py-3 text-ink-300">{s.items.map((it) => `${it.qty}x ${it.name}`).join(", ")}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-50">${s.totalUsd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-ink-400">{new Date(s.paidAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={s.fulfillment === "entregado" ? "text-hybrid" : "text-gold-300"}>{FULFILLMENT_LABEL[s.fulfillment ?? "recibido"]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-ink-600">Sin datos personales: solo referencia, artículos, total y fechas.</p>
    </div>
  );
}

// ---------------------------------------------------------------- stock
function StockTab({ headers }: { headers: () => Record<string, string> }) {
  const [stock, setStock] = useState<Record<number, number> | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/stock", { headers: headers(), cache: "no-store" })
      .then((r) => r.json())
      .then((d: { stock?: Record<number, number> }) => alive && setStock(d.stock ?? {}))
      .catch(() => alive && setStock({}));
    return () => {
      alive = false;
    };
  }, [headers]);

  async function save(productId: number, qty: number | null) {
    setSaving(productId);
    const res = await fetch("/api/admin/stock", { method: "PUT", headers: headers(), body: JSON.stringify({ productId, qty }) });
    setSaving(null);
    if (res.ok) setStock(((await res.json()) as { stock: Record<number, number> }).stock);
  }

  if (!stock) return <p className="flex items-center gap-2 text-[13px] text-ink-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>;

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-ink-400">
        Sin número = sin control (se vende siempre). Con número, el catálogo muestra <strong className="text-ink-200">Agotado</strong> al llegar a 0 y descuenta solo con cada pago.
      </p>
      <ul className="divide-y divide-[#1c1c1c] overflow-hidden rounded-[20px] border border-[#262626]">
        {products.map((p, i) => {
          const q = stock[p.id];
          return (
            <li key={p.id} className="row-in flex items-center gap-3 px-4 py-2.5" style={{ "--i": Math.min(i, 14) } as React.CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt="" className="h-10 w-10 rounded-lg bg-white/[0.03] object-contain" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink-50">{p.name}</span>
                <span className={`block text-[11px] ${q === undefined ? "text-ink-500" : q <= 0 ? "text-red-400" : q <= 3 ? "text-gold-300" : "text-ink-400"}`}>
                  {q === undefined ? "Sin control" : q <= 0 ? "Agotado" : `${q} disponibles`}
                </span>
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => void save(p.id, Math.max(0, (q ?? 0) - 1))} disabled={saving === p.id} className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-ink-300 hover:text-ink-50 disabled:opacity-40">−</button>
                <input
                  type="number"
                  min={0}
                  value={q ?? ""}
                  placeholder="—"
                  onChange={(e) => setStock({ ...stock, [p.id]: Number(e.target.value) })}
                  onBlur={(e) => void save(p.id, e.target.value === "" ? null : Number(e.target.value))}
                  className="field h-8 w-16 px-2 text-center text-[13px]"
                />
                <button onClick={() => void save(p.id, (q ?? 0) + 1)} disabled={saving === p.id} className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-ink-300 hover:text-ink-50 disabled:opacity-40">+</button>
                {q !== undefined && (
                  <button onClick={() => void save(p.id, null)} disabled={saving === p.id} className="ml-1 text-[11px] text-ink-500 hover:text-ink-200">quitar</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
