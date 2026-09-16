// Cabeceras de seguridad para todo el sitio.
//
// La CSP deja pasar solo lo que el sitio usa de verdad: Stripe (formulario
// de pago incrustado), Supabase (opiniones desde el navegador) y los
// scripts propios. Los `unsafe-inline` de script/estilo son los que Next
// necesita para hidratar; el resto queda cerrado.
const STRIPE = "https://*.stripe.com https://*.stripe.network";
const SUPABASE = "https://*.supabase.co";
const VERCEL = "https://va.vercel-scripts.com";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  `form-action 'self' ${STRIPE}`,
  `script-src 'self' 'unsafe-inline' ${STRIPE} ${VERCEL}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  `connect-src 'self' ${STRIPE} ${SUPABASE} ${VERCEL}`,
  `frame-src ${STRIPE}`,
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://js.stripe.com\"), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // El panel y la API nunca deben quedar en cachés intermedias.
      { source: "/admin", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/(.*)", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
