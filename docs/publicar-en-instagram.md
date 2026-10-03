# Conectar Instagram para que el cron publique solo

**Estado: ya está casi todo listo.** No hace falta crear una app, ni pedir
App Review, ni generar un token nuevo.

El usuario de sistema **ClaudeBot**, el que ya usa la automatización de
Pide Fácil, alcanza también a Vibe 505. Verificado el 2026-10-03 contra la
API: el token tiene `instagram_basic`, `instagram_content_publish`,
`pages_read_engagement`, `pages_show_list` y `pages_manage_posts`, y llega
a estas cuatro páginas:

| Página | page_id | Instagram |
|---|---|---|
| **VIBE 505** | 1320417081162690 | @vibe505.nic (17841435896984638) |
| Peak Goods | 1359789783879378 | @peakgoodsofficial |
| Pide Fácil Nicaragua | 1035367996317961 | @pidefacil.nic |
| Loaisiga Cigars | 115709504858400 | sin IG ligado |

La cuenta @vibe505.nic responde como profesional y el cupo de publicación
está en 0 de 100 por día. Nosotros usamos una.

---

## Lo que falta (dos cosas)

### 1. Subir los videos al bucket de Supabase

Meta descarga el video desde una URL pública, así que los archivos tienen
que estar colgados. La clave está en Supabase → Project Settings → API →
`service_role`:

```bash
cd "/c/Users/loais/MiNuevaWeb/reels-revision/generador" && SUPABASE_SERVICE_ROLE_KEY=pega_tu_clave python subir_storage.py
```

### 2. Poner tres variables en Vercel

En el proyecto → Settings → Environment Variables → Production:

```
META_IG_USER_ID = 17841435896984638
META_PAGE_ID    = 1320417081162690
META_ACCESS_TOKEN = (el token de ClaudeBot)
```

El token está en `C:\automatizacion pide facil\pidefacil-nube\.env`, en la
línea que empieza con `EAA`. Copialo de ahí.

Después de guardarlas hay que **volver a desplegar** para que las tome.

---

## Probar antes de soltarlo

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" "https://www.vibe505.com/api/cron/social-post?dry=1"
```

Responde qué publicaría, sin publicar. Si sale bien, corré la misma sin
`?dry=1` para la primera publicación real y revisá el Instagram antes de
dejarlo andando solo.

De ahí en adelante el cron de Vercel lo llama todos los días a las 19:00
de Estelí.

---

## Por qué publica en el momento y no programado

Facebook sí acepta `scheduled_publish_time` y se puede dejar agendado en
los servidores de Meta hasta 30 días adelante. **Instagram no**: la API de
contenido (`/media` + `/media_publish`) publica en el instante en que se la
llama. Toda herramienta que dice "programar Instagram" en realidad guarda
el contenido y ejecuta la llamada a la hora exacta desde su propio
servidor. Acá ese servidor es el cron de Vercel.

Es la misma razón por la que la automatización de Pide Fácil usa GitHub
Actions.

---

## Si algo falla

El error queda en la tabla `social_posts` de Supabase con el texto que
devolvió Meta:

```sql
select posted_at, slug, platform, status, error
  from public.social_posts
 order by posted_at desc
 limit 10;
```

Lo que más aparece:

- **"Page Publishing Authorization required"** — la página pide
  verificación de identidad antes de dejar publicar por API. Se resuelve
  en la configuración de la página, no hay forma de saltearlo.
- **Contenedor atascado en procesando** — no es error. El cron lo guarda y
  lo termina en la corrida siguiente.
- **Token vencido** — no debería pasar: el de usuario de sistema no vence.
  Si pasa, es que se regeneró o se le quitaron activos.

---

## Qué publica, y en qué red

Solo **Instagram**. Facebook lo cubre el bot de Business Suite, así que si
publicara en las dos redes cada reel saldría duplicado en la página.

Para volver a las dos:

```sql
update public.social_queue set platforms = array['instagram','facebook'];
```

Son 14 piezas, una por día. El ciclo completo es de dos semanas y después
se repite, así que conviene ir sumando:

```sql
insert into public.social_queue (slug, video_url, caption, position)
values ('nombre-del-sabor', 'https://.../video.mp4', 'El texto.', 14);
```

Para pausar una sin borrarla:

```sql
update public.social_queue set enabled = false where slug = '...';
```

Las reglas de qué escribir en el pie de foto están en
`reels redes/LEEME.md`.
