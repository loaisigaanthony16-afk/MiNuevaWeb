"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      return;
    }
    try {
      window.localStorage.setItem("newsletterEmail", email);
    } catch {
      /* noop */
    }
    setEmail("");
    setStatus("success");
    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <div>
      <h4 className="font-display text-base font-bold text-gray-900">
        Newsletter
      </h4>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Suscribirme
        </button>
      </form>
      {status === "success" && (
        <p className="mt-2 text-xs font-medium text-emerald-600">
          ¡Gracias! Te contactaremos pronto.
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-xs font-medium text-red-500">
          Ingresa un correo válido.
        </p>
      )}
    </div>
  );
}
