"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Heart,
  Pause,
  Play,
  Plus,
  Send,
  ShoppingBag,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { getProduct } from "@/lib/data";
import { POLLS, REELS, type Reel } from "@/lib/reels";
import { useStore } from "@/lib/store";
import { useUi } from "@/components/ui-context";
import { useT } from "@/components/locale-context";
import { flyToCart } from "@/lib/fly";

const LIKES_KEY = "vibeReelLikes";
const VOTES_KEY = "vibeReelVotes";
const SOUND_KEY = "vibeReelSound";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

/**
 * Pestaña de reels: galería de los 15 videos y visor a pantalla completa
 * con gestos de redes sociales. Todo lo relacionado a reels vive acá.
 */
export default function ReelsPage() {
  const t = useT();
  const [open, setOpen] = useState<number | null>(null);
  const [likes, setLikes] = useState<string[]>([]);

  useEffect(() => {
    setLikes(readJson<string[]>(LIKES_KEY, []));
    // Enlace compartido: /reels?v=<slug> abre directo ese reel.
    const slug = new URLSearchParams(window.location.search).get("v");
    const i = REELS.findIndex((r) => r.slug === slug);
    if (i !== -1) setOpen(i);
  }, []);

  // Sin scroll de fondo mientras el visor está abierto.
  useEffect(() => {
    if (open === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const toggleLike = useCallback((slug: string, force?: boolean) => {
    setLikes((prev) => {
      const has = prev.includes(slug);
      const next = has && !force ? prev.filter((s) => s !== slug) : has ? prev : [...prev, slug];
      writeJson(LIKES_KEY, next);
      return next;
    });
  }, []);

  return (
    <section className="pb-24 pt-14 sm:pt-20">
      <div className="container-page">
        <p className="kicker">
          <span className="h-px w-8 bg-gold-400/60" />
          {t("reels.kicker")}
        </p>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <h1 className="display-lg text-ink-50">{t("reels.title")}</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-400">{t("reels.body")}</p>
          </div>
          <button onClick={() => setOpen(0)} className="btn-gold group">
            <Play className="h-4 w-4 fill-current transition-transform duration-300 group-hover:scale-110" />
            {t("reels.watch")}
          </button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {REELS.map((reel, i) => (
            <GalleryCard
              key={reel.slug}
              reel={reel}
              index={i}
              liked={likes.includes(reel.slug)}
              onOpen={() => setOpen(i)}
            />
          ))}
        </div>
      </div>

      {open !== null && (
        <Viewer
          start={open}
          likes={likes}
          toggleLike={toggleLike}
          onClose={() => {
            setOpen(null);
            const url = new URL(window.location.href);
            if (url.searchParams.has("v")) {
              url.searchParams.delete("v");
              window.history.replaceState({}, "", url.pathname + url.search);
            }
          }}
        />
      )}
    </section>
  );
}

function GalleryCard({
  reel,
  index,
  liked,
  onOpen,
}: {
  reel: Reel;
  index: number;
  liked: boolean;
  onOpen: () => void;
}) {
  const t = useT();
  const ref = useRef<HTMLVideoElement>(null);
  const product = reel.productId ? getProduct(reel.productId) : null;

  // En el teléfono (sin cursor) se reproducen solas las que están a la vista.
  useEffect(() => {
    const v = ref.current;
    if (!v || !window.matchMedia("(hover: none)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? v.play().catch(() => {}) : v.pause()),
      { threshold: 0.6 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => ref.current?.play().catch(() => {})}
      onMouseLeave={() => ref.current?.pause()}
      aria-label={`${t("reels.watch")}: ${reel.title}`}
      style={{ animationDelay: `${index * 45}ms` }}
      className="reel-tile group relative aspect-[9/16] overflow-hidden rounded-[18px] border border-white/10 bg-ink-850 text-left"
    >
      <video
        ref={ref}
        src={reel.video}
        poster={reel.poster}
        muted
        loop
        playsInline
        preload="none"
        className="h-full w-full object-cover transition-transform duration-700 ease-smooth group-hover:scale-[1.04]"
      />
      <span className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />
      <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 backdrop-blur">
        <span className="reel-live h-1.5 w-1.5 rounded-full bg-red-500" />
        <span className="text-[9.5px] font-bold uppercase tracking-wide2 text-white">Reel</span>
      </span>
      {liked && <Heart className="absolute right-2.5 top-2.5 h-4 w-4 fill-red-500 text-red-500" />}
      <span className="absolute bottom-2.5 right-2.5 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-transform duration-500 group-hover:scale-110">
        <Play className="h-3.5 w-3.5 translate-x-px fill-current" />
      </span>
      <span className="absolute bottom-3 left-3 right-14">
        <span className="block font-display text-[13px] font-bold uppercase leading-tight text-white sm:text-[14px]">
          {reel.title}
        </span>
        {product && (
          <span className="mt-0.5 flex items-baseline gap-1.5 text-[12px]">
            <span className="font-bold tabular-nums text-white">${product.price}</span>
            <span className="tabular-nums text-white/50 line-through">${product.listPrice}</span>
          </span>
        )}
      </span>
    </button>
  );
}

function Viewer({
  start,
  likes,
  toggleLike,
  onClose,
}: {
  start: number;
  likes: string[];
  toggleLike: (slug: string, force?: boolean) => void;
  onClose: () => void;
}) {
  const t = useT();
  const { add, count } = useStore();
  const { openDrawer } = useUi();

  const scrollerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const bagRef = useRef<HTMLButtonElement>(null);

  const [active, setActive] = useState(start);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(true);
  const [added, setAdded] = useState<number | null>(null);
  const [sticker, setSticker] = useState(false);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [burst, setBurst] = useState<{ id: number; x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const activeRef = useRef(start);
  const pausedRef = useRef(false);
  pausedRef.current = paused;
  const jumping = useRef<number | null>(null);

  useEffect(() => {
    setVotes(readJson(VOTES_KEY, {}));
    setSound(readJson(SOUND_KEY, true));
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1700);
  }, []);

  // Reproduce el reel activo y pausa los demás.
  const playActive = useCallback(
    (i: number) => {
      videoRefs.current.forEach((v, k) => {
        if (!v) return;
        if (k !== i) {
          v.pause();
          return;
        }
        v.muted = !sound;
        v.currentTime = 0;
        v.play().catch(() => {
          // Si el navegador bloquea el sonido, sigue sin audio y avisa.
          v.muted = true;
          setSound(false);
          v.play().catch(() => {});
        });
      });
    },
    [sound]
  );

  const activate = useCallback(
    (i: number) => {
      activeRef.current = i;
      setActive(i);
      setPaused(false);
      setSticker(false);
      playActive(i);
    },
    [playActive]
  );

  // Posición inicial.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = start * el.clientHeight;
    activate(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El sticker aparece a los 2 s (en el reel del catálogo, al final).
  useEffect(() => {
    const timer = setTimeout(
      () => setSticker(true),
      REELS[active].productId === null ? 6200 : 2000
    );
    return () => clearTimeout(timer);
  }, [active]);

  const go = useCallback(
    (index: number) => {
      const n = REELS.length;
      const i = ((index % n) + n) % n;
      jumping.current = i;
      setTimeout(() => {
        if (jumping.current === i) jumping.current = null;
      }, 1000);
      activate(i);
      scrollerRef.current?.scrollTo({ top: i * (scrollerRef.current?.clientHeight ?? 0), behavior: "smooth" });
    },
    [activate]
  );

  function onScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (jumping.current !== null) {
      if (i === jumping.current) jumping.current = null;
      return;
    }
    if (i !== activeRef.current) activate(i);
  }

  // Barras de progreso atadas al tiempo real del video.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const v = videoRefs.current[activeRef.current];
      const p = v && v.duration ? v.currentTime / v.duration : 0;
      barRefs.current.forEach((b, k) => {
        if (b) b.style.transform = `scaleX(${k < activeRef.current ? 1 : k === activeRef.current ? p : 0})`;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Teclado.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        go(activeRef.current + 1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        go(activeRef.current - 1);
      } else if (e.key === " ") {
        e.preventDefault();
        setPausedState(!pausedRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go, onClose]);

  function setPausedState(p: boolean) {
    setPaused(p);
    const v = videoRefs.current[activeRef.current];
    if (!v) return;
    if (p) v.pause();
    else v.play().catch(() => {});
  }

  function toggleSound() {
    const next = !sound;
    setSound(next);
    writeJson(SOUND_KEY, next);
    const v = videoRefs.current[activeRef.current];
    if (v) {
      v.muted = !next;
      if (next) v.play().catch(() => {});
    }
  }

  function onEnded(i: number) {
    if (i !== activeRef.current) return;
    // En el reel del catálogo espera la respuesta del quiz.
    if (REELS[i].productId === null && sticker && !votes[REELS[i].slug]) return;
    go(i + 1);
  }

  function handleAdd(reel: Reel, i: number) {
    if (!reel.productId) {
      go(1);
      return;
    }
    add(reel.productId);
    flyToCart(videoRefs.current[i], bagRef.current);
    setAdded(reel.productId);
    setTimeout(() => setAdded((cur) => (cur === reel.productId ? null : cur)), 1500);
  }

  async function share(reel: Reel) {
    const url = `${window.location.origin}/reels?v=${reel.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${reel.title} · Vibe 505`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast(t("reels.copied"));
    } catch {
      /* la persona canceló */
    }
  }

  function vote(slug: string, value: string) {
    const next = { ...votes, [slug]: value };
    setVotes(next);
    writeJson(VOTES_KEY, next);
    setTimeout(() => setSticker(false), 1300);
  }

  function quiz(strain: string) {
    setVotes((v) => ({ ...v, [REELS[activeRef.current].slug]: strain }));
    const options = REELS.map((r, k) => [r, k] as const).filter(([r]) => r.strain === strain);
    const [, k] = options[Math.floor(Math.random() * options.length)];
    setTimeout(() => go(k), 700);
  }

  // Gestos: mantener = pausa, toque a los lados = navegar, doble toque = me gusta.
  const press = useRef({ time: 0, x: 0, y: 0, hold: null as ReturnType<typeof setTimeout> | null });
  const lastTap = useRef(0);

  function onPointerDown(e: React.PointerEvent) {
    press.current = {
      time: Date.now(),
      x: e.clientX,
      y: e.clientY,
      hold: setTimeout(() => {
        const v = videoRefs.current[activeRef.current];
        v?.pause();
      }, 230),
    };
  }

  function onPointerUp(e: React.PointerEvent, reel: Reel) {
    const { time, x, y, hold } = press.current;
    if (hold) clearTimeout(hold);
    const held = Date.now() - time;
    if (held >= 230) {
      if (!pausedRef.current) videoRefs.current[activeRef.current]?.play().catch(() => {});
      return;
    }
    if (Math.abs(e.clientX - x) > 12 || Math.abs(e.clientY - y) > 12) return;

    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      toggleLike(reel.slug, true);
      setBurst({ id: now, x: e.clientX - box.left, y: e.clientY - box.top });
      setTimeout(() => setBurst((b) => (b?.id === now ? null : b)), 900);
      return;
    }
    lastTap.current = now;
    const rel = (e.clientX - box.left) / box.width;
    setTimeout(() => {
      if (lastTap.current !== now) return;
      if (rel < 0.3) go(activeRef.current - 1);
      else if (rel > 0.7) go(activeRef.current + 1);
      else setPausedState(!pausedRef.current);
    }, 290);
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black fade-overlay" role="dialog" aria-modal="true" aria-label={t("reels.kicker")}>
      {/* Flechas (PC) */}
      <div className="absolute right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
        <button onClick={() => go(active - 1)} aria-label={t("reels.prev")} className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20">
          <ChevronUp className="h-5 w-5" />
        </button>
        <button onClick={() => go(active + 1)} aria-label={t("reels.next")} className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20">
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
      <p className="absolute bottom-6 left-6 z-30 hidden text-[12px] leading-relaxed text-white/50 lg:block">
        {t("reels.keys")}
      </p>

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-contain"
      >
        {REELS.map((reel, i) => {
          const on = i === active;
          const near = Math.abs(i - active) <= 1;
          const liked = likes.includes(reel.slug);
          const poll = POLLS[i % POLLS.length];
          const voted = votes[reel.slug];
          return (
            <section key={reel.slug} className="flex h-[100dvh] snap-start snap-always justify-center">
              <div className="relative aspect-[9/16] h-full max-w-full overflow-hidden bg-ink-950">
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  src={near ? reel.video : undefined}
                  poster={reel.poster}
                  playsInline
                  preload={near ? "auto" : "none"}
                  onEnded={() => onEnded(i)}
                  // "contain": en pantallas angostas el video se ve completo,
                  // sin recortar los textos de los costados.
                  className="h-full w-full object-contain"
                />

                {/* Capa de gestos */}
                <div
                  className="absolute inset-0 z-[2] touch-pan-y"
                  onPointerDown={onPointerDown}
                  onPointerUp={(e) => onPointerUp(e, reel)}
                  onPointerCancel={() => press.current.hold && clearTimeout(press.current.hold)}
                />

                {/* Progreso */}
                <div className="absolute inset-x-2.5 top-2.5 z-10 flex gap-1">
                  {REELS.map((r, k) => (
                    <span key={r.slug} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
                      <span
                        ref={(el) => {
                          if (on) barRefs.current[k] = el;
                        }}
                        className="block h-full origin-left scale-x-0 bg-white"
                      />
                    </span>
                  ))}
                </div>

                {/* Cabecera */}
                <div className="absolute inset-x-3.5 top-6 z-10 flex items-center justify-between">
                  <span className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-white drop-shadow">
                    {t("reels.kicker")} <span className="text-white/60">{i + 1}/{REELS.length}</span>
                  </span>
                  <span className="flex gap-2">
                    <button onClick={toggleSound} aria-label={t("reels.sound")} className="grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur">
                      {sound ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
                    </button>
                    <button onClick={onClose} aria-label={t("reels.close")} className="grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur">
                      <X className="h-5 w-5" />
                    </button>
                  </span>
                </div>

                {on && !sound && (
                  <button onClick={toggleSound} className="bubble-in absolute left-1/2 top-20 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-ink-900 shadow-pop">
                    <Volume2 className="h-4 w-4" />
                    {t("reels.tapSound")}
                  </button>
                )}

                {on && paused && (
                  <span className="pointer-events-none absolute inset-0 z-[3] m-auto grid h-20 w-20 place-items-center rounded-full bg-black/45">
                    <Pause className="h-9 w-9 fill-white text-white" />
                  </span>
                )}

                {burst && on && (
                  <Heart
                    key={burst.id}
                    className="heart-burst pointer-events-none absolute z-[6] h-24 w-24 fill-red-500 text-red-500"
                    style={{ left: burst.x - 48, top: burst.y - 48 }}
                  />
                )}

                {/* Sticker interactivo */}
                <div
                  className={`absolute left-1/2 top-[40%] z-[5] w-[min(78%,300px)] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-white/95 p-3.5 text-center text-ink-900 shadow-pop transition-all duration-500 ease-smooth ${
                    on && sticker ? "rotate-[-3deg] scale-100 opacity-100" : "pointer-events-none rotate-[-6deg] scale-75 opacity-0"
                  }`}
                >
                  <button onClick={() => setSticker(false)} aria-label="Ocultar" className="absolute right-2.5 top-1 text-[18px] text-ink-400">
                    ×
                  </button>
                  {reel.productId === null ? (
                    <>
                      <p className="text-[16px] font-black">{t("reels.quiz")}</p>
                      <div className="mt-2.5 flex flex-col gap-2">
                        {[
                          ["indica", "🌙 Relax · suave"],
                          ["sativa", "⚡ Energía · con chispa"],
                          ["hybrid", "🌗 Balance · equilibrio"],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            onClick={() => quiz(value)}
                            className={`relative h-11 overflow-hidden rounded-xl text-[14px] font-extrabold transition active:scale-95 ${
                              voted === value ? "bg-gold-300" : "bg-ink-100"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-[16px] font-black">{poll[0]}</p>
                      <div className="mt-2.5 flex gap-2">
                        {(["a", "b"] as const).map((k) => (
                          <button
                            key={k}
                            onClick={() => vote(reel.slug, k)}
                            className={`h-11 flex-1 rounded-xl text-[14px] font-extrabold transition active:scale-95 ${
                              voted === k ? "bg-gold-300" : "bg-ink-100"
                            }`}
                          >
                            {k === "a" ? poll[1] : poll[2]}
                          </button>
                        ))}
                      </div>
                      {voted && <p className="bubble-in mt-2 text-[12px] text-ink-500">{t("reels.voted")}</p>}
                    </>
                  )}
                </div>

                {/* Acciones */}
                <div className="absolute bottom-24 right-2.5 z-10 flex flex-col items-center gap-4">
                  <Action label={t("reels.like")} onClick={() => toggleLike(reel.slug)}>
                    <Heart className={`h-6 w-6 transition-transform duration-300 ${liked ? "scale-110 fill-red-500 text-red-500" : "text-white"}`} />
                  </Action>
                  <Action label={t("reels.share")} onClick={() => share(reel)}>
                    <Send className="h-6 w-6 text-white" />
                  </Action>
                  <Action
                    label={t("reels.bag")}
                    buttonRef={on ? bagRef : undefined}
                    onClick={() => {
                      onClose();
                      openDrawer();
                    }}
                  >
                    <span className="relative">
                      <ShoppingBag className="h-6 w-6 text-white" />
                      {count > 0 && (
                        <span className="absolute -right-2 -top-2 grid h-4 min-w-[16px] place-items-center rounded-full bg-gold-400 px-1 text-[9.5px] font-bold text-ink-900">
                          {count}
                        </span>
                      )}
                    </span>
                  </Action>
                </div>

                {/* Comprar */}
                <div className="absolute bottom-5 left-3.5 right-[72px] z-10">
                  <button
                    onClick={() => handleAdd(reel, i)}
                    className={`flex h-12 w-full items-center justify-center gap-2 rounded-full text-[13.5px] font-extrabold uppercase tracking-[0.08em] transition-all duration-300 active:scale-95 ${
                      added !== null && added === reel.productId ? "bg-hybrid text-white" : "bg-gold-400 text-ink-900 hover:bg-gold-300"
                    }`}
                  >
                    {reel.productId === null ? (
                      t("reels.seeAll")
                    ) : added === reel.productId ? (
                      <>
                        <Check className="h-4 w-4" />
                        {t("quick.added")}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        {t("cat.add")} ${getProduct(reel.productId)?.price}
                      </>
                    )}
                  </button>
                </div>

                {i === start && on && (
                  <p className="reel-hint pointer-events-none absolute inset-x-0 bottom-[88px] z-10 text-center text-[11.5px] uppercase tracking-wide2 text-white/70">
                    ↑ {t("reels.hint")}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {toast && (
        <div className="bubble-in fixed bottom-24 left-1/2 z-[95] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink-900 shadow-pop">
          {toast}
        </div>
      )}
    </div>
  );
}

function Action({
  label,
  onClick,
  children,
  buttonRef,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button ref={buttonRef} onClick={onClick} aria-label={label} className="flex flex-col items-center gap-1 text-white transition active:scale-90">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-black/40 backdrop-blur">{children}</span>
      <span className="text-[10.5px] font-semibold drop-shadow">{label}</span>
    </button>
  );
}
