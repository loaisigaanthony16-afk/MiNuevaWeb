"use client";

import { useState } from "react";
import { Loader2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { productMeta } from "@/lib/data";
import { useStore } from "@/lib/store";

function getMeta(id: number) {
  return productMeta.find((m) => m.id === id);
}

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, subtotal, shipping, total, changeQty, remove } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleCheckout() {
    if (total <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalAmount: total }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "No se pudo iniciar el pago.");
      }
    } catch {
      setError("Error de conexión con la pasarela.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal>
      <div
        className="absolute inset-0 bg-gray-900/40"
        onClick={onClose}
        aria-hidden
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h3 className="font-display text-lg font-bold text-gray-900">
            Tu Carrito
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <ShoppingBag className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm">Tu carrito está vacío.</p>
            </div>
          ) : (
            items.map((item) => {
              const meta = getMeta(item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 border-b border-gray-100 pb-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={meta?.img}
                    alt={meta?.name ?? "Producto"}
                    className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {meta?.name}
                    </h4>
                    <p className="text-xs text-gray-500">{meta?.unit}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-1 py-0.5">
                        <button
                          onClick={() => changeQty(item.id, -1)}
                          aria-label="Disminuir"
                          className="p-1 text-gray-500 hover:text-emerald-600"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => changeQty(item.id, 1)}
                          aria-label="Incrementar"
                          className="p-1 text-gray-500 hover:text-emerald-600"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(item.id)}
                        aria-label="Eliminar"
                        className="text-gray-300 transition hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    ${(item.price * item.qty).toFixed(2)}
                  </p>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-3 border-t border-gray-100 p-4">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Envío</span>
            <span>{shipping === 0 ? "Gratis" : `$${shipping.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          {error && (
            <p className="text-center text-xs font-medium text-red-500">
              {error}
            </p>
          )}

          <button
            onClick={handleCheckout}
            disabled={total <= 0 || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Proceder al Pago
          </button>
        </div>
      </aside>
    </div>
  );
}
