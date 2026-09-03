"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { FAQ } from "@/lib/data";
import { useLocale } from "@/components/locale-context";
import { useReveal } from "@/hooks/useReveal";


interface Turn {
  from: "bot" | "user";
  text: string;
}

/**
 * Asistente de la tienda.
 *
 * Responde al instante las preguntas frecuentes: son respuestas escritas por
 * nosotros, no generadas, y se muestran como si se estuvieran escribiendo.
 * Lo que se escribe a mano no se responde acá; queda anotado para el pedido.
 */
export default function Assistant() {
  const { locale, t } = useLocale();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [asked, setAsked] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [partial, setPartial] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  useReveal([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  // Al cambiar de idioma la conversación empieza de nuevo en ese idioma.
  useEffect(() => {
    setTurns([{ from: "bot", text: t("chat.greeting") }]);
    setAsked([]);
    setPartial(null);
    setTyping(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // Mantiene la conversación a la vista.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, partial, typing]);

  function reply(text: string) {
    setTyping(true);
    const t1 = setTimeout(() => {
      setTyping(false);
      // Efecto de escritura, palabra por palabra.
      const words = text.split(" ");
      let i = 0;
      const step = () => {
        i += 1;
        setPartial(words.slice(0, i).join(" "));
        if (i < words.length) {
          const t = setTimeout(step, 34);
          timers.current.push(t);
        } else {
          setPartial(null);
          setTurns((prev) => [...prev, { from: "bot", text }]);
        }
      };
      step();
    }, 620);
    timers.current.push(t1);
  }

  function ask(index: number) {
    if (typing || partial !== null) return;
    const item = FAQ[index];
    const q = locale === "en" ? item.qEn : item.q;
    const a = locale === "en" ? item.aEn : item.a;
    setAsked((prev) => [...prev, index]);
    setTurns((prev) => [...prev, { from: "user", text: q }]);
    reply(a);
  }

  function sendDraft(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || typing || partial !== null) return;
    setDraft("");
    setTurns((prev) => [...prev, { from: "user", text }]);
    reply(t("chat.fallback"));
  }

  const pending = FAQ.map((_, i) => i).filter((i) => !asked.includes(i));
  const busy = typing || partial !== null;

  return (
    <section id="faq" className="scroll-mt-[76px] border-t border-white/8 py-24">
      <div className="container-page grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="reveal lg:sticky lg:top-28 lg:self-start">
          <p className="kicker">
            <span className="h-px w-8 bg-gold-400/60" />
            {t("chat.kicker")}
          </p>
          <h2 className="display-lg mt-5 text-ink-50">{t("chat.title")}</h2>
          <p className="mt-5 max-w-xs text-[14.5px] leading-relaxed text-ink-400">
            {t("chat.body")}
          </p>
        </div>

        <div className="reveal surface overflow-hidden">
          {/* Cabecera */}
          <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-gold-400/40">
              <Sparkles className="h-3.5 w-3.5 text-gold-300" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-ink-50">{t("chat.name")}</p>
              <p className="flex items-center gap-1.5 text-[11px] text-ink-500">
                <span className="h-1.5 w-1.5 rounded-full bg-hybrid" />
                {t("chat.online")}
              </p>
            </div>
          </div>

          {/* Conversación */}
          <div
            ref={scroller}
            className="no-scrollbar max-h-[380px] min-h-[280px] space-y-3 overflow-y-auto p-5"
          >
            {turns.map((t, i) => (
              <Bubble key={i} from={t.from}>
                {t.text}
              </Bubble>
            ))}

            {typing && (
              <Bubble from="bot">
                <span className="dots text-ink-400">
                  <span />
                  <span />
                  <span />
                </span>
              </Bubble>
            )}

            {partial !== null && (
              <Bubble from="bot">
                <span className="caret">{partial}</span>
              </Bubble>
            )}
          </div>

          {/* Preguntas listas */}
          {pending.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-white/8 px-5 py-4">
              {pending.map((i) => (
                <button
                  key={i}
                  onClick={() => ask(i)}
                  disabled={busy}
                  className="rounded-full border border-white/12 px-3.5 py-2 text-left text-[12.5px] text-ink-300 transition-all duration-300 ease-smooth hover:border-gold-400/50 hover:text-ink-50 disabled:opacity-40"
                >
                  {locale === "en" ? FAQ[i].qEn : FAQ[i].q}
                </button>
              ))}
            </div>
          )}

          {/* Consulta libre */}
          <form
            onSubmit={sendDraft}
            className="flex items-center gap-2 border-t border-white/8 p-3"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("chat.placeholder")}
              aria-label={t("chat.placeholder")}
              className="field h-11 flex-1 rounded-full text-[14px]"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              aria-label={t("chat.send")}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold-400 text-ink-900 transition-all duration-300 ease-smooth hover:bg-gold-300 active:scale-90 disabled:opacity-30"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Bubble({
  from,
  children,
}: {
  from: "bot" | "user";
  children: React.ReactNode;
}) {
  const mine = from === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <p
        className={`bubble-in max-w-[85%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
          mine
            ? "rounded-br-md bg-ink-50 text-ink-900"
            : "rounded-bl-md border border-white/8 bg-white/[0.03] text-ink-200"
        }`}
      >
        {children}
      </p>
    </div>
  );
}
