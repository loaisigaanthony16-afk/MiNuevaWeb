"use client";

import { useEffect } from "react";

/** Registra el service worker de avisos push (no cachea nada). */
export default function PwaSetup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}
