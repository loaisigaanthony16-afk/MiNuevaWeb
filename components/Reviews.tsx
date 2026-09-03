"use client";

import { Star } from "lucide-react";
import { REVIEWS, REVIEW_STATS, pickReviews, type Review } from "@/lib/reviews";
import { useReveal } from "@/hooks/useReveal";
import { useT } from "@/components/locale-context";

/** Palomita azul de verificado, al estilo de las redes. */
export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3.5 w-3.5 shrink-0 ${className}`}
      aria-label="verified"
      role="img"
    >
      <path
        fill="#1D9BF0"
        d="M12 1.6l2.3 2.1 3.1-.3.9 3 2.8 1.4-1.1 2.9 1.1 2.9-2.8 1.4-.9 3-3.1-.3L12 22.4l-2.3-2.1-3.1.3-.9-3-2.8-1.4L4 12.7 2.9 9.8l2.8-1.4.9-3 3.1.3z"
      />
      <path
        fill="#fff"
        d="M10.7 15.3l-3-3 1.3-1.3 1.7 1.7 4.3-4.3 1.3 1.3z"
      />
    </svg>
  );
}

export function Stars({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`flex gap-0.5 text-gold-300 ${className}`} aria-label={`${n} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < n ? "fill-current" : "opacity-25"}`}
        />
      ))}
    </span>
  );
}

/** Tarjeta de reseña, usada en la muralla y en los espacios chicos. */
export function ReviewCard({
  review,
  compact = false,
}: {
  review: Review;
  compact?: boolean;
}) {
  return (
    <figure
      className={`surface flex flex-col justify-between ${
        compact ? "w-[260px] p-4" : "w-[300px] p-5"
      }`}
    >
      <div>
        <Stars n={review.stars} />
        <blockquote
          className={`mt-3 leading-relaxed text-ink-200 ${
            compact ? "text-[12.5px]" : "text-[13.5px]"
          }`}
        >
          {review.text}
        </blockquote>
      </div>

      <figcaption className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3">
        <span className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-ink-100">
            {review.alias}
          </span>
          {review.verified && <VerifiedBadge />}
        </span>
        {review.about && (
          <span className="truncate text-[11px] text-ink-500">{review.about}</span>
        )}
      </figcaption>
    </figure>
  );
}

/** Resumen compacto: promedio, estrellas y total. */
export function ReviewSummary({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Stars n={Math.round(REVIEW_STATS.average)} />
      <span className="text-[12px] text-ink-400">
        <span className="font-semibold text-ink-100 tabular-nums">
          {REVIEW_STATS.average.toFixed(1)}
        </span>{" "}
        · {REVIEW_STATS.count} {t("rev.count")}
      </span>
    </span>
  );
}

/** Dos reseñas en formato mínimo, para el carrito. */
export function ReviewMini({ offset = 0 }: { offset?: number }) {
  const [r] = pickReviews(1, offset);
  return (
    <div className="rounded-[10px] border border-white/8 bg-white/[0.02] p-3.5">
      <div className="flex items-center gap-2">
        <Stars n={r.stars} />
        <span className="flex items-center gap-1 text-[11.5px] font-semibold text-ink-200">
          {r.alias}
          {r.verified && <VerifiedBadge />}
        </span>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-400">{r.text}</p>
    </div>
  );
}

/**
 * Muralla de reseñas: dos filas que se desplazan en sentidos opuestos.
 * El movimiento se pausa al pasar el cursor para poder leer.
 */
export default function Reviews() {
  const t = useT();
  useReveal([]);
  const top = REVIEWS.slice(0, 5);
  const bottom = REVIEWS.slice(5);

  return (
    <section id="resenas" className="scroll-mt-[76px] overflow-hidden border-t border-white/8 py-24">
      <div className="container-page reveal flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="kicker">
            <span className="h-px w-8 bg-gold-400/60" />
            {t("rev.kicker")}
          </p>
          <h2 className="display-lg mt-5 text-ink-50">{t("rev.title")}</h2>
        </div>
        <ReviewSummary />
      </div>

      <div className="mt-12 space-y-4">
        <Row items={[...top, ...top]} />
        <Row items={[...bottom, ...bottom]} reverse />
      </div>
    </section>
  );
}

function Row({ items, reverse = false }: { items: Review[]; reverse?: boolean }) {
  return (
    <div className="group relative flex overflow-hidden">
      {/* Bordes difuminados para que no se corte de golpe */}
      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-ink-900 to-transparent" />
      <span className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-ink-900 to-transparent" />

      <div
        className={`flex w-max gap-4 pr-4 ${
          reverse ? "animate-marqueeBack" : "animate-marquee"
        } group-hover:[animation-play-state:paused]`}
      >
        {items.map((r, i) => (
          <ReviewCard key={`${r.id}-${i}`} review={r} />
        ))}
      </div>
    </div>
  );
}
