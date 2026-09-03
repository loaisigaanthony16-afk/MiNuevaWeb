/**
 * Marca Vibe 505.
 *
 * El monograma es una V dibujada en trazo, no una letra dentro de una caja:
 * así no se recorta ni pelea con el texto a ningún tamaño.
 */
export default function Wordmark({
  size = "md",
}: {
  size?: "md" | "lg";
}) {
  const lg = size === "lg";

  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={`relative grid shrink-0 place-items-center rounded-full border border-gold-400/35 ${
          lg ? "h-14 w-14" : "h-9 w-9"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={lg ? "h-7 w-7" : "h-[18px] w-[18px]"}
          aria-hidden
        >
          <path
            d="M5 6.5 L12 18 L19 6.5"
            stroke="url(#vg)"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="vg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f6edd6" />
              <stop offset="60%" stopColor="#dcc183" />
              <stop offset="100%" stopColor="#b08d3e" />
            </linearGradient>
          </defs>
        </svg>
      </span>

      <span className="flex flex-col leading-none">
        <span
          className={`font-display font-semibold uppercase text-ink-50 ${
            lg ? "text-[22px] tracking-[0.3em]" : "text-[15px] tracking-[0.26em]"
          }`}
        >
          Vibe
        </span>
        <span
          className={`mt-1 font-display font-medium uppercase text-gold-300 ${
            lg ? "text-[13px] tracking-[0.52em]" : "text-[9.5px] tracking-[0.46em]"
          }`}
        >
          505
        </span>
      </span>
    </span>
  );
}
