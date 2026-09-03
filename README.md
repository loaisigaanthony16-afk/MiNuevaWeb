# PremiumVapes — Tienda Next.js (React + TypeScript)

Tienda premium que reemplaza el frontend vanilla original (ahora en `/legacy`).
Incluye catálogo claro estilo marketplace, carrito persistente y checkout seguro
de **Stripe Checkout Session por servidor** (importe exacto al céntimo).

## Stack

- Next.js 16 (App Router) + Turbopack
- React 19
- TypeScript (strict)
- Tailwind CSS
- lucide-react
- Stripe (`stripe` server-side en API Route)

## Estructura

```
app/
  layout.tsx          # Layout raíz (tipografías, StoreProvider)
  page.tsx            # Página de inicio (composición de secciones)
  globals.css
  api/checkout/route.ts   # Crea la Checkout Session de Stripe (server)
components/
  StoreProvider.tsx   # Provider cliente (recibe children)
  ShopExperience.tsx  # Estado del drawer → Navbar + CartDrawer
  Navbar.tsx          # Cabecera sticky con botón de carrito
  Hero.tsx
  Catalog.tsx         # Filtros + grilla de producto
  ProductCard.tsx     # Tarjeta interactiva con botón "Agregar"
  CartDrawer.tsx      # Carrito lateral + resumen + checkout
  FaqSection.tsx
  Newsletter.tsx
  Footer.tsx
lib/
  data.ts             # Productos, metadatos visuales y FAQ
  store.tsx           # Contexto/estado global del carrito (localStorage)
```

## Variables de entorno

Crea un archivo `.env.local` en la raíz con tu clave **secreta** de Stripe.
**Nunca** la expongas en el frontend; solo se usa en la API Route:

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
2. En **Settings → Environment Variables**, añade `STRIPE_SECRET_KEY` (live) a los
   entornos Production y Preview.
3. Despliega. El framework detecta Next.js automáticamente desde la raíz;
   la carpeta `legacy/` se ignora para el despliegue.

## Seguridad comercial

- El frontend **no** conoce ni muestra tu clave secreta.
- El importe se valida y cobra en el servidor en la API Route.
- Solo se muestran nombres delicados del producto en la UI (catálogo grilla);
  la pasarela recibe el descriptor neutral "Compra PremiumVapes".

## Nota legal

Sitio solo para mayores de 21 años. Verifica siempre la legislación local.
