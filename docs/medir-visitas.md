# Medir visitas y búsquedas

Tres cosas distintas, que se miran en tres lados distintos. Conviene no
confundirlas, porque los números nunca van a coincidir.

| Qué querés saber | Dónde se ve |
| --- | --- |
| Cuánta gente entra, de dónde llega, qué mira, cuántos compran | `vibe505.com/admin` → pestaña **Visitas** |
| Qué **palabras** busca la gente en Google para llegar al sitio | Google Search Console |
| Cuánta gente ve los posts y reels | Instagram y Facebook, en sus propias estadísticas |

---

## 1. Panel de Visitas (nuestro)

Está en el panel del comercio, con la misma clave de siempre. Lo que
muestra:

- **Vistas** y **visitantes** de los últimos 7, 30 o 90 días.
- **Vistas por día**, en barras.
- **Del clic al pedido**: cuántos entran, cuántos agregan al carrito,
  cuántos abren el pago y cuántos pagan. Es el número que de verdad
  importa: si entran 500 y compran 2, el problema no es la publicidad.
- **De dónde llegan**: Instagram, Facebook, búsqueda de Google, directo.
- **Páginas más vistas**, **países** y **dispositivos**.

### Cómo funciona

Cada página abierta manda un aviso a `/api/visita`, que lo guarda en la
tabla `visitas` de Supabase. No hay servicio externo: los datos son
nuestros y no caducan.

Los pasos del embudo se marcan desde el código, no se adivinan:

| Paso | Dónde se marca |
| --- | --- |
| `carrito` | `lib/store.tsx`, al agregar un producto |
| `checkout` | `components/CheckoutModal.tsx`, al pedir pagar |
| `pedido` | `components/OrderConfirmation.tsx`, al confirmarse el pago |

Para agregar otro paso: `marcar("nombre", { … })` desde `lib/medidor.ts`,
y sumar ese nombre al conjunto `TIPOS` de `app/api/visita/route.ts`.

### Qué NO se guarda

Ni IP junto a la visita, ni user-agent, ni cookies. Solo la ruta, el
sitio que trajo a la persona, el país (que Vercel manda en una cabecera)
y un número al azar que identifica la pestaña mientras está abierta. La
tabla tiene RLS activo y sin políticas: con la clave pública no se ve
nada, solo el servidor entra.

### Un detalle de la atribución

El origen se calcula una sola vez, en la primera página de la sesión, y
se conserva en `sessionStorage`. Si no, alguien que llega desde Instagram
y recorre cinco páginas aparecería como Instagram en la primera y como
"directo" en las otras cuatro.

---

## 2. Google Search Console

Es **lo único** que dice qué palabras escribe la gente en Google antes de
entrar. Ni nuestro panel ni Vercel pueden saberlo: Google no manda esa
información al sitio.

Hace falta entrar con la cuenta de Google. Los pasos:

1. Entrar a <https://search.google.com/search-console>.
2. **Agregar propiedad** → **Prefijo de URL** → `https://www.vibe505.com`.
3. Elegir **Etiqueta HTML** y copiar solo el valor del `content`.
4. En Vercel → proyecto `mi-nueva-web` → Settings → Environment
   Variables, crear `GOOGLE_SITE_VERIFICATION` con ese valor.
5. Volver a desplegar (cualquier push sirve) y darle **Verificar**.
6. Ya dentro: **Sitemaps** → agregar `sitemap.xml`.

El layout ya escribe la etiqueta solo si esa variable existe; sin ella no
pone nada.

Después de verificar, los datos tardan **dos o tres días** en aparecer, y
el informe de **Rendimiento** es el que trae las búsquedas, las
impresiones y la posición media.

---

## 3. Vercel Web Analytics

El paquete `@vercel/analytics` ya está puesto en el layout, pero la
función está **apagada** en el proyecto: su API responde
`web_analytics_not_enabled`, así que no hay nada guardado. Se prende en
Vercel → proyecto → pestaña **Analytics** → **Enable**.

No es necesario: mide casi lo mismo que nuestro panel, pero empieza a
contar desde el día que se prende y tiene techo de eventos según el plan.
Sirve como segunda opinión, nada más.

---

## Antes de todo esto: que el sitio aparezca

A octubre de 2026 el sitio **no estaba indexado**: una búsqueda
`site:vibe505.com` no devolvía ninguna página. Si Google no tiene el
sitio, nadie puede llegar buscando, y el informe de búsquedas va a salir
en cero por más que esté todo bien configurado.

Ya está puesto lo que hace falta para que lo encuentren:

- `app/robots.ts` permite el rastreo y apunta al sitemap.
- `app/sitemap.ts` publica las 31 direcciones.
- `lib/seo.ts` pone los datos estructurados de tienda y de cada producto.
- La clave de IndexNow está en `public/`, para avisarle a Bing y a
  Yandex sin necesidad de cuenta.

Lo que falta es verificar en Search Console y pedir la indexación. Eso
acelera semanas de espera.
