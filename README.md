# Vibe 505 — Tienda de Vape en Nicaragua (Next.js)

Tienda en línea de **hardware de vapor**: pod kits, vape pens, baterías 510,
cartuchos rellenables, aromas concentrados sin nicotina y accesorios.

Posicionamiento comercial claro y presentable:

- **Catálogo editorial** con filtros por formato (pods, pens, baterías, cartuchos).
- Carrito persistente en `localStorage` con precios bimoneda (USD + Córdobas).
- Checkout seguro con **Stripe Checkout Session por servidor** (importe exacto
  al céntimo) para tarjeta.
- Pedido por **banco o efectivo** con referencia de pedido para coordinar
  entrega y pago por canal de soporte.
- Este proyecto **no** vende ni promueve cannabis, CBD, THC ni líquidos con
  nicotina.

## Stack

- Next.js (App Router) + Turbopack
- React 19
- TypeScript (strict)
- Tailwind CSS
- lucide-react
- Stripe (server-side en API Route)

## Estructura

```
app/
  layout.tsx          # Layout raíz (tipografías, metadatos, providers)
  page.tsx            # Home (Hero, Catálogo, Reseñas, FAQ, Footer)
  api/checkout/route.ts   # Crea la Checkout Session de Stripe (server)
  api/exchange-rate/route.ts
components/
  StoreProvider.tsx   # Re-export del estado global del carrito
  ui-context.tsx      # Estado global de UI (drawer, quickview, búsqueda, edad)
  Navbar.tsx          # Cabecera sticky con búsqueda + carrito
  Hero.tsx
  Catalog.tsx         # Filtros + grilla de producto
  ProductCard.tsx     # Tarjeta de producto con "Agregar"
  QuickView.tsx       # Vista rápida con especificaciones técnicas
  CartDrawer.tsx      # Carrito lateral + zonas de envío + checkout
  TestimonialsCarousel.tsx
  FaqSection.tsx
  Newsletter.tsx
  Footer.tsx
lib/
  data.ts             # Productos, metadatos visuales y FAQ
  store.tsx           # Estado del carrito (Context + localStorage)
  checkout-util.ts    # Zonas, formatos y payload de pedido
  analytics.ts        # Eventos hacia window.dataLayer
```

## Variables de entorno

Crea un archivo `.env.local` en la raíz con tu clave **secreta** de Stripe.
Nunca la expongas en el frontend; solo se usa en la API Route:

```
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
```

## Cómo ejecutar

```bash
npm install
npm run dev      # desarrollo en http://localhost:3000
npm run build    # compilación + chequeo de tipos
npm run start    # sirve la build
npm run typecheck
```

## Despliegue en Vercel

1. Sube el repositorio a Git e impórtalo en Vercel (framework: Next.js).
2. En **Settings → Environment Variables**, añade `STRIPE_SECRET_KEY` (live) a
   los entornos Production y Preview.
3. Despliega. La carpeta `legacy/` se ignora para el despliegue.

## Checkout

- El frontend nunca conoce ni muestra tu clave secreta.
- El importe se valida y cobra en el servidor en la API Route.
- Las tarjetas se procesan con Stripe Checkout Session con importe exacto;
  la línea de pago usa un nombre genérico de la tienda.
- Banco y efectivo se gestionan con una referencia de pedido y resumen local
  para coordinar por el canal de soporte de la tienda.

## Nota legal y uso responsable

- Sitio restringido a **mayores de 18 años**.
- No vendemos cannabis, THC, CBD ni líquidos con nicotina.
- Las afirmaciones sobre productos (0% nicotina, sin uso médico) deben
  verificarse contra la normativa de cada país antes de publicar.
