"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageCircle, Send, ShieldAlert, Star } from "lucide-react";
import {
  averageRating,
  fetchThreads,
  postOpinion,
  PostError,
  type Thread,
} from "@/lib/community";
import { useLocale } from "@/components/locale-context";
import { useReveal } from "@/hooks/useReveal";
import type { Key } from "@/lib/i18n";

const ALIAS_KEY = "vibeAlias";
const PAGE = 6;

/**
 * Opiniones reales y públicas: cualquiera publica, responde y lee.
 * Reemplaza a las reseñas de muestra y a las preguntas frecuentes.
 */
export default function Community() {
  const { t, locale } = useLocale();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  // Recuerda el apodo en este equipo para no pedirlo en cada respuesta.
  const [alias, setAlias] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  useReveal([threads?.length]);

  const load = useCallback(async () => {
    try {
      setThreads(await fetchThreads());
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    void load();
    try {
      setAlias(window.localStorage.getItem(ALIAS_KEY) ?? "");
    } catch {
      /* noop */
    }
  }, [load]);

  function rememberAlias(value: string) {
    setAlias(value);
    try {
      window.localStorage.setItem(ALIAS_KEY, value);
    } catch {
      /* noop */
    }
  }

  async function afterPost(id: string) {
    setFresh(id);
    await load();
  }

  const avg = threads ? averageRating(threads) : null;

  return (
    <section id="opiniones" className="scroll-mt-[var(--nav-min)] border-t border-white/8 py-24">
      <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        {/* Encabezado y formulario */}
        <div className="lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:self-start">
          <div className="reveal">
            <p className="kicker">
              <span className="h-px w-8 bg-gold-400/60" />
              {t("op.kicker")}
            </p>
            <h2 className="display-lg mt-5 text-ink-50">{t("op.title")}</h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-400">
              {t("op.body")}
            </p>

            {threads && threads.length > 0 && (
              <div className="mt-6 flex items-center gap-3 text-[13px] text-ink-300">
                {avg !== null && (
                  <>
                    <Stars value={Math.round(avg)} />
                    <span className="font-semibold tabular-nums text-ink-50">
                      {avg.toFixed(1)}
                    </span>
                    <span className="text-ink-600">·</span>
                  </>
                )}
                <span className="tabular-nums">
                  {threads.length} {threads.length === 1 ? t("op.count1") : t("op.count")}
                </span>
              </div>
            )}
          </div>

          <Composer
            alias={alias}
            onAlias={rememberAlias}
            onPosted={afterPost}
            className="reveal mt-8"
          />
        </div>

        {/* Hilos */}
        <div>
          {loadError && (
            <p className="rounded-card border border-white/8 p-6 text-center text-[13.5px] text-ink-400">
              {t("op.err.load")}
            </p>
          )}

          {!threads && !loadError && (
            <p className="flex items-center justify-center gap-2 py-16 text-[13.5px] text-ink-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("op.loading")}
            </p>
          )}

          {threads && threads.length === 0 && (
            <div className="flex flex-col items-center rounded-card border border-dashed border-white/12 px-6 py-16 text-center">
              <MessageCircle className="h-6 w-6 text-ink-500" />
              <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-ink-400">
                {t("op.empty")}
              </p>
            </div>
          )}

          {threads && threads.length > 0 && (
            <ul className="space-y-3">
              {threads.slice(0, visible).map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  locale={locale}
                  alias={alias}
                  onAlias={rememberAlias}
                  onPosted={afterPost}
                  highlight={fresh}
                />
              ))}
            </ul>
          )}

          {threads && threads.length > visible && (
            <button
              onClick={() => setVisible((v) => v + PAGE)}
              className="btn-ghost mt-6 w-full"
            >
              {t("op.more")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function Stars({
  value,
  size = "h-3.5 w-3.5",
}: {
  value: number;
  size?: string;
}) {
  return (
    <span className="flex gap-0.5 text-gold-300" aria-label={`${value} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${size} ${i < value ? "fill-current" : "opacity-25"}`} />
      ))}
    </span>
  );
}

function useErrorText() {
  const { t } = useLocale();
  return (e: unknown) =>
    t(`op.err.${e instanceof PostError ? e.code : "generic"}` as Key);
}

/** Formulario de opinión principal. */
function Composer({
  alias,
  onAlias,
  onPosted,
  className = "",
}: {
  alias: string;
  onAlias: (v: string) => void;
  onPosted: (id: string) => void;
  className?: string;
}) {
  const { t } = useLocale();
  const errorText = useErrorText();
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      setError(t("op.err.calificacion_invalida"));
      return;
    }
    setSending(true);
    setError(null);
    try {
      const id = await postOpinion({ alias, body, rating });
      setBody("");
      setRating(0);
      onPosted(id);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className={`surface p-5 sm:p-6 ${className}`}>
      <p className="font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-50">
        {t("op.formTitle")}
      </p>

      <div className="mt-5">
        <span className="label">{t("op.rating")}</span>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} / 5`}
              aria-pressed={rating === n}
              className="p-0.5 transition-transform duration-200 hover:scale-110 active:scale-95"
            >
              <Star
                className={`h-6 w-6 text-gold-300 transition-all ${
                  n <= (hover || rating) ? "fill-current" : "opacity-30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <label className="label mt-5" htmlFor="op-alias">
        {t("op.alias")}
      </label>
      <input
        id="op-alias"
        value={alias}
        maxLength={40}
        onChange={(e) => onAlias(e.target.value)}
        placeholder={t("op.aliasHint")}
        className="field"
      />

      <label className="label mt-5" htmlFor="op-body">
        {t("op.message")}
      </label>
      <textarea
        id="op-body"
        rows={4}
        maxLength={600}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("op.messageHint")}
        className="field h-auto resize-none py-3"
      />
      <p className="mt-1.5 text-right text-[11px] tabular-nums text-ink-600">
        {body.length}/600
      </p>

      {error && <p className="mt-2 text-[12.5px] text-red-400">{error}</p>}

      <button type="submit" disabled={sending} className="btn-gold mt-3 w-full disabled:opacity-60">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sending ? t("op.sending") : t("op.send")}
      </button>

      <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-500">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
        {t("op.public")}
      </p>
    </form>
  );
}

function timeAgo(iso: string, locale: string, now: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  if (seconds > -60) return now;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["minute", 60],
    ["hour", 3600],
    ["day", 86400],
    ["week", 604800],
    ["month", 2592000],
    ["year", 31536000],
  ];
  let unit: Intl.RelativeTimeFormatUnit = "minute";
  let div = 60;
  for (const [u, s] of steps) {
    if (Math.abs(seconds) >= s) {
      unit = u;
      div = s;
    }
  }
  return rtf.format(Math.round(seconds / div), unit);
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-gold-400/20 to-transparent font-display text-[13px] font-bold uppercase text-gold-200">
      {name.trim().charAt(0) || "·"}
    </span>
  );
}

function ThreadCard({
  thread,
  locale,
  alias,
  onAlias,
  onPosted,
  highlight,
}: {
  thread: Thread;
  locale: string;
  alias: string;
  onAlias: (v: string) => void;
  onPosted: (id: string) => void;
  highlight: string | null;
}) {
  const { t } = useLocale();
  const errorText = useErrorText();
  const [open, setOpen] = useState(false);
  const [replying, setReplying] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNew =
    highlight === thread.id || thread.replies.some((r) => r.id === highlight);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const id = await postOpinion({ alias, body, parentId: thread.id });
      setBody("");
      setReplying(false);
      setOpen(true);
      onPosted(id);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSending(false);
    }
  }

  const count = thread.replies.length;

  return (
    <li
      className={`bubble-in rounded-card border bg-ink-850 p-5 transition-colors duration-700 ${
        isNew ? "border-gold-400/40" : "border-white/8"
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={thread.alias} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="truncate text-[13.5px] font-semibold text-ink-50">{thread.alias}</p>
            <span className="text-[11.5px] text-ink-500">
              {timeAgo(thread.created_at, locale, t("op.justNow"))}
            </span>
          </div>
          {thread.rating !== null && <div className="mt-1"><Stars value={thread.rating} size="h-3 w-3" /></div>}
          <p className="mt-3 whitespace-pre-line break-words text-[14px] leading-relaxed text-ink-200">
            {thread.body}
          </p>

          <div className="mt-4 flex items-center gap-4 text-[12px] font-semibold uppercase tracking-[0.1em]">
            <button
              onClick={() => setReplying((v) => !v)}
              className="text-gold-300 transition hover:text-gold-200"
            >
              {t("op.reply")}
            </button>
            {count > 0 && (
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 text-ink-400 transition hover:text-ink-100"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {count} {count === 1 ? t("op.reply1") : t("op.replies")}
              </button>
            )}
          </div>

          {open && count > 0 && (
            <ul className="mt-4 space-y-4 border-l border-white/10 pl-4">
              {thread.replies.map((r) => (
                <li key={r.id} className="bubble-in flex items-start gap-2.5">
                  <Avatar name={r.alias} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px]">
                      <span className="font-semibold text-ink-50">{r.alias}</span>
                      <span className="ml-2 text-ink-500">
                        {timeAgo(r.created_at, locale, t("op.justNow"))}
                      </span>
                    </p>
                    <p className="mt-1 whitespace-pre-line break-words text-[13.5px] leading-relaxed text-ink-300">
                      {r.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {replying && (
            <form onSubmit={submit} className="bubble-in mt-4 space-y-2.5">
              <input
                value={alias}
                maxLength={40}
                onChange={(e) => onAlias(e.target.value)}
                placeholder={t("op.aliasHint")}
                aria-label={t("op.alias")}
                className="field h-10 text-[13.5px]"
              />
              <textarea
                rows={2}
                maxLength={600}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("op.replyHint")}
                aria-label={t("op.reply")}
                className="field h-auto resize-none py-2.5 text-[13.5px]"
              />
              {error && <p className="text-[12px] text-red-400">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplying(false)}
                  className="h-9 rounded-full px-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-400 hover:text-ink-100"
                >
                  {t("op.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex h-9 items-center gap-2 rounded-full bg-ink-50 px-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-900 transition hover:bg-white disabled:opacity-60"
                >
                  {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {t("op.reply")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </li>
  );
}
