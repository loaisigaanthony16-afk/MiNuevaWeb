"use client";

import { Lock, MessageCircle, PackageCheck, Truck } from "lucide-react";
import { useT } from "@/components/locale-context";
import type { Key } from "@/lib/i18n";

const ITEMS: { icon: typeof Lock; label: Key; strong: Key }[] = [
  { icon: Lock, label: "svc.pay", strong: "svc.payStrong" },
  { icon: Truck, label: "svc.ship", strong: "svc.shipStrong" },
  { icon: MessageCircle, label: "svc.human", strong: "svc.humanStrong" },
  { icon: PackageCheck, label: "svc.neutral", strong: "svc.neutralStrong" },
];

/**
 * Cuatro garantías en una línea, justo después del titular: lo primero
 * que alguien necesita saber antes de mirar productos.
 *
 * En PC van fijas y centradas; en el teléfono no caben, así que se
 * desplazan solas en vez de apilarse en cuatro renglones.
 */
export default function ServiceBar() {
  const t = useT();

  const item = (
    { icon: Icon, label, strong }: (typeof ITEMS)[number],
    i: number,
    hidden = false
  ) => (
    <li
      key={i}
      aria-hidden={hidden || undefined}
      className="group flex shrink-0 items-center gap-2.5 whitespace-nowrap text-[13px] text-ink-300"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full border border-gold-400/25 bg-gold-400/[0.06] transition-transform duration-500 ease-smooth group-hover:-translate-y-0.5 group-hover:rotate-[-8deg]">
        <Icon className="h-[15px] w-[15px] text-gold-300" />
      </span>
      {t(label)}
      <strong className="font-semibold text-gold-200">{t(strong)}</strong>
    </li>
  );

  return (
    <section className="border-y border-white/8 bg-gradient-to-r from-white/[0.015] via-gold-400/[0.04] to-white/[0.015]">
      {/* PC */}
      <ul className="container-page hidden items-center justify-between gap-6 py-5 lg:flex">
        {ITEMS.map((it, i) => item(it, i))}
      </ul>

      {/* Teléfono y tableta */}
      <div className="edge-fade marquee-hover overflow-hidden py-4 lg:hidden">
        <ul className="flex w-max animate-marquee gap-10 pr-10 [animation-duration:26s]">
          {[...ITEMS, ...ITEMS].map((it, i) => item(it, i, i >= ITEMS.length))}
        </ul>
      </div>
    </section>
  );
}
