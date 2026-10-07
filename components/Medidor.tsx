"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { marcar } from "@/lib/medidor";

/**
 * Cuenta una vista por página. Va en el layout, así que también cuenta
 * los cambios de ruta del navegador interno de Next, que no recargan.
 *
 * El guard de la ruta repetida existe porque en desarrollo React monta
 * dos veces y, sin él, cada página entraba duplicada en la base.
 */
export default function Medidor() {
  const ruta = usePathname();
  const ultima = useRef<string | null>(null);

  useEffect(() => {
    if (!ruta || ultima.current === ruta) return;
    ultima.current = ruta;
    marcar("vista");
  }, [ruta]);

  return null;
}
