"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MapPin, Search, ShoppingBag, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import { useStore } from "@/lib/store";
import { useLocale } from "@/components/locale-context";
import { useUi } from "@/components/ui-context";
import { isDeliveryComplete } from "@/lib/delivery";
import { scrollToSection } from "@/lib/scroll";
import { BRANDS, type BrandId } from "@/lib/data";
import type { Key } from "@/lib/i18n";

interface MenuItem {
  key: Key | "brand";
  /** Texto fijo cuando es una marca (no se traduce). */
  label?: string;
  /** Sección a la que lleva. */
  target: string;
  /** Si lleva al catálogo, con qué marca. */
  brand?: BrandId;
  /** Página aparte (en vez de una sección de la portada). */
  href?: string;
}

const MENU: MenuItem[] = [
  { key: "menu.home", target: "top" },
  { key: "menu.collections", target: "colecciones" },
  ...BRANDS.map((b) => ({ key: "brand" as const, label: b.name, target: "catalogo", brand: b.id })),
  { key: "menu.how", target: "como-funciona" },
  { key: "menu.opinions", target: "opiniones" },
  { key: "menu.reels", target: "reels", href: "/reels" },
];

// Orden en que aparecen en la página, para saber dónde está la persona.
const SPY = ["colecciones", "catalogo", "como-funciona", "opiniones"];

// Alto fijo de la fila de categorías. Es fijo a propósito: la fila flota
// sobre el contenido y un espaciador con este mismo alto la compensa, así
// plegarla nunca empuja la página.
const MENU_ROW_H = 46;

// useLayoutEffect avisa en el servidor; ahí no hay nada que medir.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function Navbar() {
  const { count } = useStore();
  const { locale, setLocale, t } = useLocale();
  const {
    openDrawer,
    openAddress,
    delivery,
    search,
    setSearch,
    browse,
    catalogBrand,
  } = useUi();
  const [jiggle, setJiggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === "/";
  // En pantallas angostas el buscador es chico: texto de ayuda más corto.
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  // La fila de categorías se pliega al bajar y vuelve al subir.
  const [rowHidden, setRowHidden] = useState(false);
  const [section, setSection] = useState<string>("top");
  const [hovered, setHovered] = useState<number | null>(null);
  const [ink, setInk] = useState<{ x: number; w: number } | null>(null);
  const prevCount = useRef(count);
  const inputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Scroll: sombra de la barra, pliegue de la fila y sección actual.
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    function update() {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 12);
      // Progreso de lectura: una línea dorada bajo la barra.
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressRef.current?.style.setProperty("transform", `scaleX(${max > 0 ? y / max : 0})`);

      if (y < 180) setRowHidden(false);
      else if (y > lastY + 6) setRowHidden(true);
      else if (y < lastY - 6) setRowHidden(false);
      lastY = y;

      // La sección activa es la última cuyo inicio ya pasó bajo la barra.
      const line = (headerRef.current?.offsetHeight ?? 76) + 80;
      let current = "top";
      for (const id of SPY) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setSection(current);
    }

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Publica las alturas de la barra para el resto de la página: el
  // catálogo fija sus filtros justo debajo y los saltos las descuentan.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const root = document.documentElement.style;
    const min = header.offsetHeight;
    root.setProperty("--nav-min", `${min}px`);
    root.setProperty("--nav-full", `${min + MENU_ROW_H}px`);
    root.setProperty("--nav-h", `${rowHidden ? min : min + MENU_ROW_H}px`);
  }, [rowHidden]);

  const activeIndex = (() => {
    if (!onHome) {
      const i = MENU.findIndex((m) => m.href === pathname);
      return i === -1 ? 0 : i;
    }
    if (section === "catalogo") {
      const i = MENU.findIndex((m) => m.brand === catalogBrand);
      return i === -1 ? 2 : i;
    }
    const i = MENU.findIndex((m) => m.target === section && !m.brand);
    return i === -1 ? 0 : i;
  })();

  // Coloca el indicador bajo la opción señalada (o la activa).
  const placeInk = useCallback(() => {
    const el = itemRefs.current[hovered ?? activeIndex];
    if (!el) return;
    setInk({ x: el.offsetLeft, w: el.offsetWidth });
  }, [hovered, activeIndex]);

  useIsoLayoutEffect(() => {
    placeInk();
  }, [placeInk, locale]);

  useEffect(() => {
    window.addEventListener("resize", placeInk);
    return () => window.removeEventListener("resize", placeInk);
  }, [placeInk]);

  // En móvil la fila se desliza: la opción activa siempre queda a la vista.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const el = itemRefs.current[activeIndex];
    if (!scroller || !el) return;
    const left = el.offsetLeft;
    const right = left + el.offsetWidth;
    if (left < scroller.scrollLeft || right > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollTo({ left: Math.max(0, left - 24), behavior: "smooth" });
    }
  }, [activeIndex]);

  function go(item: MenuItem) {
    if (item.href) {
      router.push(item.href);
      return;
    }
    if (!onHome) {
      // Las secciones viven en la portada.
      const q = item.brand ? `?marca=${item.brand}` : "";
      router.push(item.target === "top" ? "/" : `/${q}#${item.target}`);
      return;
    }
    if (item.brand) browse({ brand: item.brand, strain: "all" });
    else scrollToSection(item.target);
  }

  // La bolsa reacciona cuando sube el contador.
  useEffect(() => {
    if (count > prevCount.current) {
      setJiggle(true);
      const t = setTimeout(() => setJiggle(false), 550);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  // Atajo: "/" enfoca el buscador.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" ) return;
      const el = document.activeElement;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hasAddress = isDeliveryComplete(delivery);

  function goSearch() {
    if (onHome) scrollToSection("catalogo");
  }

  return (
    <>
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 w-full border-b transition-colors duration-500 ease-smooth ${
        scrolled ? "glass border-white/8" : "border-white/[0.05] bg-ink-900/40"
      }`}
    >
      <div className="container-page flex h-[76px] items-center gap-3 sm:gap-5">
        {/* Marca */}
        <a
          href="#top"
          aria-label="Vibe 505"
          className="shrink-0 transition-opacity duration-300 hover:opacity-80"
        >
          <Wordmark />
        </a>

        {/* Buscador */}
        <div className="relative min-w-0 flex-1 max-w-xl">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value) goSearch();
            }}
            onKeyDown={(e) => {
              // Fuera de la portada, Enter lleva al catálogo con la búsqueda.
              if (e.key === "Enter" && !onHome && search.trim()) {
                router.push(`/?q=${encodeURIComponent(search.trim())}#catalogo`);
              }
            }}
            placeholder={t(compact ? "nav.searchShort" : "nav.search")}
            aria-label={t("nav.searchLabel")}
            className="field h-11 rounded-full pl-11 pr-10 text-[14px]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label={t("nav.clear")}
              className="absolute inset-y-0 right-3 flex items-center text-ink-400 transition hover:text-ink-50"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dirección de entrega */}
        <button
          onClick={openAddress}
          className="hidden min-w-0 items-center gap-2.5 rounded-full border border-white/10 px-4 py-2.5 text-left transition-all duration-300 ease-smooth hover:border-white/30 hover:bg-white/5 lg:flex"
        >
          <MapPin
            className={`h-4 w-4 shrink-0 ${hasAddress ? "text-gold-300" : "text-ink-400"}`}
          />
          <span className="flex flex-col">
            <span className="text-[9.5px] font-semibold uppercase leading-tight tracking-wide2 text-ink-400">
              {t("nav.shipTo")}
            </span>
            <span className="max-w-[150px] truncate text-[13px] font-semibold leading-tight text-ink-50">
              {hasAddress ? delivery!.region : t("nav.chooseAddress")}
            </span>
          </span>
        </button>

        {/* Dirección compacta (móvil) */}
        <button
          onClick={openAddress}
          aria-label={t("nav.address")}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ease-smooth hover:bg-white/5 lg:hidden ${
            hasAddress
              ? "border-gold-400/45 text-gold-300"
              : "border-white/10 text-ink-300"
          }`}
        >
          <MapPin className="h-[18px] w-[18px]" />
        </button>

        {/* Idioma */}
        <button
          onClick={() => setLocale(locale === "es" ? "en" : "es")}
          aria-label={t("nav.lang")}
          title={t("nav.lang")}
          className="hidden h-11 shrink-0 items-center gap-1 rounded-full border border-white/10 px-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-300 ease-smooth hover:border-white/30 hover:bg-white/5 sm:flex"
        >
          <span className={locale === "es" ? "text-gold-300" : "text-ink-500"}>
            ES
          </span>
          <span className="text-ink-600">/</span>
          <span className={locale === "en" ? "text-gold-300" : "text-ink-500"}>
            EN
          </span>
        </button>

        {/* Bolsa */}
        <button
          onClick={openDrawer}
          data-cart-target
          aria-label={`${t("nav.bag")} (${count})`}
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 transition-all duration-300 ease-smooth hover:border-gold-400/50 hover:bg-white/5 ${
            jiggle ? "cart-jiggle" : ""
          }`}
        >
          <ShoppingBag className="h-[18px] w-[18px] text-ink-100" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-ink-900">
              {count}
            </span>
          )}
        </button>
      </div>

      <span
        ref={progressRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-200"
      />

      {/* Fila de categorías */}
      <nav
        aria-label={t("menu.label")}
        className={`nav-row border-b border-white/[0.06] ${
          scrolled ? "glass" : "bg-ink-900/40 backdrop-blur-md"
        }`}
        style={{ height: MENU_ROW_H }}
        data-hidden={rowHidden}
        aria-hidden={rowHidden || undefined}
      >
        <div ref={scrollerRef} className="container-page h-full overflow-x-auto no-scrollbar">
          <ul
            className="relative mx-auto flex h-full w-max items-center gap-1 lg:gap-3"
              onMouseLeave={() => setHovered(null)}
            >
              {MENU.map((item, i) => (
                <li key={item.label ?? item.key}>
                  <button
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    onClick={() => go(item)}
                    tabIndex={rowHidden ? -1 : undefined}
                    onMouseEnter={() => setHovered(i)}
                    aria-current={i === activeIndex ? "true" : undefined}
                    className={`relative whitespace-nowrap px-3 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] transition-colors duration-300 ${
                      i === activeIndex ? "text-ink-50" : "text-ink-400 hover:text-ink-100"
                    }`}
                  >
                    {item.key === "brand" ? item.label : t(item.key)}
                  </button>
                </li>
              ))}

              {/* Indicador que se desliza entre opciones */}
              {ink && (
                <span
                  aria-hidden
                  className="menu-ink pointer-events-none absolute bottom-1 left-0 h-[2px] rounded-full bg-gold-400"
                  style={{ transform: `translateX(${ink.x}px)`, width: ink.w }}
                />
              )}
          </ul>
        </div>
      </nav>
    </header>
    {/* Reserva el lugar de la fila de categorías en lo alto de la página */}
    <div aria-hidden style={{ height: MENU_ROW_H }} />
    </>
  );
}
