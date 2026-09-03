# VapePremium – Frontend E‑commerce

Este proyecto es un frontend completo para una tienda de vapes de marihuana, con diseño minimalista premium en modo oscuro.

## Características

- **Verificación de Edad** (Age Gate) persistente en `localStorage`.
- **Navbar sticky** con contador de carrito.
- **Hero section** con CTA.
- **Catálogo dinámico** con filtros por tipo de cepa (Indica, Sativa, Híbrida).
- **Vista rápida** de producto en modal.
- **Carrito lateral** (drawer) con cálculo de subtotal, impuestos (8%) y barra de envío gratis.
- **FAQ** en acordeón.
- **Footer** con newsletter y avisos legales.

## Tecnologías

- HTML5 semántico
- Tailwind CSS (CDN)
- Vanilla JavaScript (ES6+)
- Lucide Icons (CDN)
- Google Fonts (Inter / Outfit)

## Cómo ejecutar

1. Guarda los archivos `index.html`, `app.js` y `README.md` en el mismo directorio.
2. Abre `index.html` en tu navegador (doble clic).
3. El modal de edad aparecerá al cargar; al confirmar, se guardará en `localStorage`.

## Seguridad

- Los inputs del formulario de newsletter se sanitizan para prevenir XSS.
- El estado del carrito se guarda en `localStorage` como JSON.
- No se incluyen pasarelas de pago reales; el código está preparado para integrarse con un backend headless posteriormente.

## Notas legales

Este sitio es solo para mayores de 21 años. No vendemos a menores de edad. Verifica siempre la legislación local.
