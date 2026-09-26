"use client";

import { useT } from "@/components/locale-context";

/** Precio con descuento: final en blanco, lista tachada y el ahorro en rojo. */
export default function PriceTag({
  price,
  listPrice,
  size = "sm",
}: {
  price: number;
  listPrice: number;
  size?: "sm" | "lg";
}) {
  const t = useT();
  const off = listPrice - price;
  const lg = size === "lg";

  return (
    <div className="flex items-baseline gap-2">
      <span
        className={`font-display font-bold leading-none tabular-nums text-ink-50 ${lg ? "text-[34px]" : "text-[21px]"}`}
      >
        ${price}
      </span>
      {off > 0 && (
        <>
          <del
            className={`tabular-nums text-ink-500 decoration-red-500/60 ${lg ? "text-[16px]" : "text-[12px]"}`}
          >
            <span className="sr-only">{t("promo.label")} </span>${listPrice}
          </del>
          <span className={`font-semibold tabular-nums text-red-400 ${lg ? "text-[13px]" : "text-[11px]"}`}>
            -${off}
          </span>
        </>
      )}
    </div>
  );
}
