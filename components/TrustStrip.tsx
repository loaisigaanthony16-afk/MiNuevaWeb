"use client";

import { Lock, MessageCircle, PackageCheck, UserX } from "lucide-react";
import { useT } from "@/components/locale-context";
import { useReveal } from "@/hooks/useReveal";

/**
 * Franja de confianza: cuatro garantías concretas, sin párrafos.
 * Va entre el catálogo y las reseñas, donde aparece la duda de comprar.
 */
export default function TrustStrip() {
  const t = useT();
  useReveal([]);

  const items = [
    { icon: Lock, title: t("trust.ssl"), note: t("trust.sslNote") },
    { icon: UserX, title: t("trust.noData"), note: t("trust.noDataNote") },
    { icon: PackageCheck, title: t("trust.neutral"), note: t("trust.neutralNote") },
    { icon: MessageCircle, title: t("trust.support"), note: t("trust.supportNote") },
  ];

  return (
    <section className="border-t border-white/8">
      <div className="container-page grid gap-px overflow-hidden bg-white/8 py-0 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, note }, i) => (
          <div
            key={title}
            style={{ transitionDelay: `${i * 70}ms` }}
            className="reveal group bg-ink-900 px-6 py-8 transition-colors duration-500 hover:bg-ink-850"
          >
            <Icon className="h-[18px] w-[18px] text-gold-300 transition-transform duration-500 ease-smooth group-hover:-translate-y-0.5" />
            <p className="mt-4 font-display text-[12.5px] font-bold uppercase tracking-[0.12em] text-ink-50">
              {title}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-400">
              {note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
