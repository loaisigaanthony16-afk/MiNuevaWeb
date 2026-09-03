"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translate, type Key, type Locale } from "@/lib/i18n";

const LOCALE_KEY = "vibeLocale";

interface LocaleStore {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: Key) => string;
}

const Ctx = createContext<LocaleStore | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // El español es el idioma por defecto; el inglés es opcional.
  const [locale, setLocaleState] = useState<Locale>("es");

  // Rehidratación tras el montaje, para no romper el HTML del servidor.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCALE_KEY);
      if (saved === "en") setLocaleState("en");
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(LOCALE_KEY, l);
    } catch {
      /* noop */
    }
  }, []);

  const value = useMemo<LocaleStore>(
    () => ({
      locale,
      setLocale,
      t: (key: Key) => translate(locale, key),
    }),
    [locale, setLocale]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocale debe usarse dentro de <LocaleProvider>");
  return ctx;
}

/** Atajo para componentes que solo necesitan traducir. */
export function useT(): (key: Key) => string {
  return useLocale().t;
}
