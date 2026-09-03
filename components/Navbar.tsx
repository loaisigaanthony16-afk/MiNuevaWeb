"use client";

import { Leaf, ShoppingCart } from "lucide-react";
import { useStore } from "@/lib/store";

export default function Navbar({ onOpenCart }: { onOpenCart: () => void }) {
  const count = useStore().count;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-gray-900">
            Premium<span className="text-emerald-600">Vapes</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-medium text-gray-600 md:flex">
          <a href="#catalogo" className="transition hover:text-emerald-600">
            Catálogo
          </a>
          <a href="#faq" className="transition hover:text-emerald-600">
            FAQ
          </a>
          <a href="#contacto" className="transition hover:text-emerald-600">
            Contacto
          </a>
        </nav>

        <button
          onClick={onOpenCart}
          aria-label="Abrir carrito"
          className="relative rounded-xl border border-gray-200 p-2 text-gray-700 transition hover:border-emerald-300 hover:text-emerald-600"
        >
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-semibold text-white">
              {count}
            </span>
          )}
        </button>
      </nav>
    </header>
  );
}
