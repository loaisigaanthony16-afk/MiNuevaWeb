"use client";

import { Gift, Lock, MapPin, MessageCircle, Tag, Timer } from "lucide-react";
import { useT } from "@/components/locale-context";

const ITEMS = [
  { key: "ann.price", icon: Tag },
  { key: "ann.delivery", icon: MapPin },
  { key: "ann.discount", icon: Timer },
  { key: "ann.whatsapp", icon: MessageCircle },
  { key: "ann.neutral", icon: Lock },
  { key: "ann.coupon", icon: Gift },
] as const;

/**
 * Cinta superior con los datos que más pesan al decidir la compra.
 * Se desplaza sola y se detiene al pasar el cursor para poder leerla.
 */
export default function AnnouncementBar() {
  const t = useT();
  // Dos copias idénticas: la animación recorre la mitad y empalma sin salto.
  const loop = [...ITEMS, ...ITEMS];

  return (
    <div className="announce marquee-hover relative z-50 overflow-hidden text-ink-900">
      <div className="flex w-max animate-marquee gap-10 py-2 pr-10 [animation-duration:32s]">
        {[...loop, ...loop].map(({ key, icon: Icon }, i) => (
          <span
            key={i}
            aria-hidden={i >= ITEMS.length}
            className="flex items-center gap-2 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.14em]"
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
            {t(key)}
            <span className="ml-8 h-1 w-1 rounded-full bg-ink-900/40" />
          </span>
        ))}
      </div>
    </div>
  );
}
