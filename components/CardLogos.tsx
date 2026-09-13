/**
 * Marcas de tarjeta aceptadas, dibujadas en SVG (sin cargar nada externo).
 */
export default function CardLogos({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${className}`} aria-label="Visa, Mastercard, American Express">
      {/* Visa */}
      <svg viewBox="0 0 48 30" className="h-6 w-auto" aria-hidden>
        <rect width="48" height="30" rx="4" fill="#fff" />
        <text
          x="24"
          y="20.5"
          textAnchor="middle"
          fontFamily="Arial Black, Arial, sans-serif"
          fontSize="13"
          fontStyle="italic"
          fontWeight="900"
          fill="#1A1F71"
          letterSpacing="-0.3"
        >
          VISA
        </text>
      </svg>
      {/* Mastercard */}
      <svg viewBox="0 0 48 30" className="h-6 w-auto" aria-hidden>
        <rect width="48" height="30" rx="4" fill="#fff" />
        <circle cx="19.5" cy="15" r="8.5" fill="#EB001B" />
        <circle cx="28.5" cy="15" r="8.5" fill="#F79E1B" />
        <path d="M24 7.8a8.5 8.5 0 0 1 0 14.4 8.5 8.5 0 0 1 0-14.4z" fill="#FF5F00" />
      </svg>
      {/* American Express */}
      <svg viewBox="0 0 48 30" className="h-6 w-auto" aria-hidden>
        <rect width="48" height="30" rx="4" fill="#2E77BC" />
        <text
          x="24"
          y="19"
          textAnchor="middle"
          fontFamily="Arial Black, Arial, sans-serif"
          fontSize="9.5"
          fontWeight="900"
          fill="#fff"
          letterSpacing="0.2"
        >
          AMEX
        </text>
      </svg>
    </span>
  );
}
