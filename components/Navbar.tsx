"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, ShoppingBag, X } from "lucide-react";
import Wordmark from "@/components/Wordmark";
import { useStore } from "@/lib/store";
import { useLocale } from "@/components/locale-context";
import { useUi } from "@/components/ui-context";
import { isDeliveryComplete } from "@/lib/delivery";

export default function Navbar() {
  const { count } = useStore();
  const { locale, setLocale, t } = useLocale();
  const { openDrawer, openAddress, delivery, search, setSearch } = useUi();
  const [jiggle, setJiggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const prevCount = useRef(count);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-500 ease-smooth ${
        scrolled ? "glass border-b border-white/8" : "border-b border-transparent"
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
            placeholder={t("nav.search")}
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
    </header>
  );
}
