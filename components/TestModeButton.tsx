"use client";

import { Zap } from "lucide-react";
import { DELIVERY_KEY } from "@/lib/delivery";

/**
 * Simulador de pago, solo para pruebas.
 *
 * ⚠️ NO se renderiza salvo que NEXT_PUBLIC_TEST_MODE sea exactamente
 * "true". En producción esa variable no existe, así que el botón no llega
 * al cliente ni por accidente: no depende de que nadie se acuerde de
 * borrarlo antes de lanzar.
 *
 * Para quitarlo del todo cuando ya no haga falta:
 *   1. Borrar este archivo.
 *   2. Quitar <TestModeButton /> de components/CartDrawer.tsx.
 *   3. Quitar NEXT_PUBLIC_TEST_MODE de .env y de .env.example.
 */

const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === "true";

/** Datos de prueba, para no depender de lo que haya guardado el navegador. */
const TEST_DELIVERY = {
  alias: "Cliente de Prueba",
  phone: "8888 7777",
  region: "Río San Juan",
  address: "Del parque central 2c al sur, portón negro",
  notes: "Entregar después de las 5pm",
};

// Grape Gas x2 y Garlic Jelly x1: cubre dos líneas distintas del catálogo.
const TEST_CART = [
  { id: 1, qty: 2, price: 42 },
  { id: 12, qty: 1, price: 48 },
];

export default function TestModeButton() {
  if (!TEST_MODE) return null;

  function simulatePayment() {
    try {
      // Se escribe primero y luego se navega: al cargar de nuevo, el
      // carrito y la dirección se rehidratan desde aquí, igual que en un
      // regreso real desde la pasarela.
      window.localStorage.setItem(DELIVERY_KEY, JSON.stringify(TEST_DELIVERY));
      window.localStorage.setItem("shopCart", JSON.stringify(TEST_CART));
      window.localStorage.setItem("pv18s", "1");
    } catch {
      /* noop */
    }

    const ref = `VIBE-TEST-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    window.location.href = `/?success=true&ref=${ref}`;
  }

  return (
    <button
      onClick={simulatePayment}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-gold-400/40 bg-gold-400/[0.04] px-3 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide2 text-gold-200 transition hover:bg-gold-400/10"
    >
      <Zap className="h-3.5 w-3.5" />
      Simular pago exitoso (Modo Test)
    </button>
  );
}
