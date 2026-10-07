"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { marcar } from "@/lib/medidor";

/**
 * Cuenta una vista por página y, al salir de ella, cuánto se quedó la
 * persona y hasta dónde bajó.
 *
 * Esos dos números son los que distinguen una visita real de un rebote:
 * entrar y salir en tres segundos sin bajar nada no es lo mismo que leer
 * la ficha entera. Sin esto, las dos cuentan igual.
 *
 * Va en el layout, así que también cuenta los cambios de ruta del
 * navegador interno de Next, que no recargan la página.
 */
export default function Medidor() {
  const ruta = usePathname();
  const ultima = useRef<string | null>(null);
  const desde = useRef(Date.now());
  const fondo = useRef(0);
  // Para no mandar dos veces la salida de la misma página: la manda el
  // primer evento que llegue (cambio de ruta, pestaña oculta o cierre).
  const cerrada = useRef(false);

  useEffect(() => {
    if (!ruta || ultima.current === ruta) return;

    // Al cambiar de ruta, primero se cierra la página anterior.
    if (ultima.current && !cerrada.current) salida();

    ultima.current = ruta;
    desde.current = Date.now();
    fondo.current = 0;
    cerrada.current = false;
    marcar("vista");

    function alturaVisible() {
      const doc = document.documentElement;
      const total = Math.max(doc.scrollHeight, document.body.scrollHeight);
      // Con una página más corta que la pantalla, se vio entera.
      if (total <= window.innerHeight) return 100;
      const visto = window.scrollY + window.innerHeight;
      return Math.min(100, Math.round((visto / total) * 100));
    }

    function alScroll() {
      fondo.current = Math.max(fondo.current, alturaVisible());
    }

    function salida() {
      if (cerrada.current) return;
      const dejada = ultima.current;
      if (!dejada) return;
      cerrada.current = true;
      marcar(
        "salida",
        {
          segundos: Math.round((Date.now() - desde.current) / 1000),
          fondo: Math.max(fondo.current, alturaVisible()),
        },
        // La ruta que se deja, no la que ya está en la barra del navegador.
        dejada
      );
    }

    function alOcultar() {
      // `hidden` es el único evento fiable en celulares: cerrar la
      // pestaña o cambiar de app no siempre dispara `pagehide`.
      if (document.visibilityState === "hidden") salida();
    }

    window.addEventListener("scroll", alScroll, { passive: true });
    document.addEventListener("visibilitychange", alOcultar);
    window.addEventListener("pagehide", salida);

    return () => {
      window.removeEventListener("scroll", alScroll);
      document.removeEventListener("visibilitychange", alOcultar);
      window.removeEventListener("pagehide", salida);
    };
  }, [ruta]);

  return null;
}
