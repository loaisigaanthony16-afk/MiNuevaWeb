"use client";

import { AlertCircle, Bike, PackageCheck, Truck } from "lucide-react";
import {
  DIRECT_REGIONS,
  ORDER_STEPS,
  SHIPPING_MODES,
  type ShippingModeInfo,
} from "@/lib/shipping";
import {
  FREE_SHIPPING_AT,
  NATIONAL_SHIPPING_NIO,
} from "@/lib/checkout-util";
import { useT } from "@/components/locale-context";
import { useReveal } from "@/hooks/useReveal";

export default function ShippingSection() {
  const t = useT();
  useReveal([]);

  return (
    <section id="envios" className="scroll-mt-[76px] border-t border-white/8 py-24">
      <div className="container-page">
        <div className="reveal max-w-2xl">
          <p className="kicker">
            <span className="h-px w-8 bg-gold-400/60" />
            {t("ship.kicker")}
          </p>
          <h2 className="display-lg mt-5 text-ink-50">{t("ship.title")}</h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-ink-400">
            {t("ship.body")}
          </p>
        </div>

        {/* Tres datos duros, sin párrafos */}
        <dl className="reveal mt-12 grid gap-px overflow-hidden rounded-card border border-white/8 bg-white/8 sm:grid-cols-3">
          {[
            {
              value: `C$${NATIONAL_SHIPPING_NIO}`,
              title: t("ship.rate"),
              note: t("ship.rateNote"),
            },
            {
              value: `$${FREE_SHIPPING_AT}`,
              title: t("ship.freeTitle"),
              note: t("ship.freeNote"),
            },
            {
              value: "100%",
              title: t("ship.packTitle"),
              note: t("ship.packNote"),
            },
          ].map((d) => (
            <div key={d.title} className="bg-ink-900 px-7 py-8">
              <dd className="font-display text-[34px] font-medium leading-none tabular-nums text-gold-gradient">
                {d.value}
              </dd>
              <dt className="mt-4 font-display text-[12.5px] font-bold uppercase tracking-[0.12em] text-ink-50">
                {d.title}
              </dt>
              <p className="mt-1.5 text-[13px] text-ink-400">{d.note}</p>
            </div>
          ))}
        </dl>

        {/* Los dos modos de entrega */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ModeCard
            info={SHIPPING_MODES.directa}
            icon={Bike}
            regionsLabel={t("ship.regionsDirect")}
            regions={DIRECT_REGIONS.join(" · ")}
            delay={0}
          />
          <ModeCard
            info={SHIPPING_MODES.encomienda}
            icon={Truck}
            regionsLabel={t("ship.regionsRest")}
            regions={t("ship.parcelCarrier")}
            delay={90}
          />
        </div>

        {/* Recorrido del pedido */}
        <ol className="reveal mt-14 grid gap-px overflow-hidden rounded-card border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {ORDER_STEPS.map((key, i) => (
            <li
              key={key}
              style={{ transitionDelay: `${i * 80}ms` }}
              className="reveal group relative bg-ink-900 p-7"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[11px] font-bold tabular-nums tracking-[0.2em] text-gold-400/70">
                  0{i + 1}
                </span>
                {i === ORDER_STEPS.length - 1 && (
                  <PackageCheck className="h-4 w-4 text-gold-300" />
                )}
              </div>
              <p className="mt-5 text-[14px] leading-relaxed text-ink-100">
                {t(key)}
              </p>
              {/* Hilo que conecta los pasos */}
              <span className="absolute inset-x-7 bottom-0 h-px origin-left scale-x-0 bg-gold-400/40 transition-transform duration-700 ease-smooth group-hover:scale-x-100" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ModeCard({
  info,
  icon: Icon,
  regionsLabel,
  regions,
  delay,
}: {
  info: ShippingModeInfo;
  icon: typeof Bike;
  regionsLabel: string;
  regions: string;
  delay: number;
}) {
  const t = useT();

  return (
    <article
      style={{ transitionDelay: `${delay}ms` }}
      className="reveal card-gold p-7 transition-colors duration-500 hover:border-white/16"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-10 w-10 place-items-center rounded-full border border-gold-400/35">
          <Icon className="h-4 w-4 text-gold-300" />
        </span>
        <span className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide2 text-ink-300">
          {t(info.etaKey)}
        </span>
      </div>

      <h3 className="mt-6 font-display text-[18px] font-semibold uppercase tracking-[0.08em] text-ink-50">
        {t(info.nameKey)}
      </h3>

      <dl className="mt-5 space-y-2.5 border-y border-white/8 py-4 text-[13px]">
        <Line label={t("ship.carrier")} value={t(info.carrierKey)} />
        <Line label={t("ship.eta")} value={t(info.etaKey)} />
        <Line label={regionsLabel} value={regions} />
      </dl>

      <p className="mt-5 text-[13.5px] leading-relaxed text-ink-400">
        {t(info.anonKey)}
      </p>

      {info.mayRequireId && (
        <p className="mt-4 flex items-start gap-2.5 rounded-[10px] border border-gold-400/25 bg-gold-400/[0.05] p-3 text-[12.5px] leading-relaxed text-gold-100">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-300" />
          {t("ship.idWarning")}
        </p>
      )}
    </article>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wide2 text-ink-500">
        {label}
      </dt>
      <dd className="text-right text-[13px] text-ink-100">{value}</dd>
    </div>
  );
}
