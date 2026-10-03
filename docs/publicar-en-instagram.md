# Publicación diaria en Instagram

**Todo corre en Supabase.** La cola, los videos, el código que publica y el
reloj viven en el proyecto `vibe505`. El sitio en Vercel no participa.

**No hace falta crear una app de Meta, ni App Review, ni token nuevo.** El
usuario de sistema **ClaudeBot**, el mismo de la automatización de Pide
Fácil, alcanza también a Vibe 505. Verificado el 2026-10-03 contra la API:
tiene `instagram_basic`, `instagram_content_publish`,
`pages_read_engagement`, `pages_show_list` y `pages_manage_posts`, y llega
a estas páginas:

| Página | page_id | Instagram |
|---|---|---|
| **VIBE 505** | 1320417081162690 | @vibe505.nic (17841435896984638) |
| Peak Goods | 1359789783879378 | @peakgoodsofficial |
| Pide Fácil Nicaragua | 1035367996317961 | @pidefacil.nic |
| Loaisiga Cigars | 115709504858400 | sin IG ligado |

La cuenta @vibe505.nic responde como profesional y el cupo está en 0 de
100 publicaciones por día. Usamos una.

---

## Lo que falta (tres pasos)

### 1. Subir los videos al bucket

Meta descarga el video desde una URL pública, así que tienen que estar
colgados. La clave sale de Supabase → Project Settings → API →
`service_role`:

```bash
cd "/c/Users/loais/MiNuevaWeb/reels-revision/generador" && SUPABASE_SERVICE_ROLE_KEY=pega_tu_clave python subir_storage.py
```

### 2. Cargar los secretos de Meta

Panel de Supabase → proyecto `vibe505` → Edge Functions → Secrets:

```
META_IG_USER_ID   = 17841435896984638
META_PAGE_ID      = 1320417081162690
META_ACCESS_TOKEN = (el token de ClaudeBot)
```

El token está en el archivo `.env` de `pidefacil-nube`, dentro de la
carpeta de automatización de Pide Fácil, en la línea que empieza con
`EAA`.

### 3. Guardar la clave de servicio en Vault

El cron tiene que mandarle un JWT a la Edge Function. Esa clave va cifrada
en Vault, nunca escrita en el código. Una sola vez, en el editor SQL:

```sql
select vault.create_secret('PEGA_ACA_TU_SERVICE_ROLE_KEY', 'service_role_key');
```

El nombre del secreto tiene que ser exactamente `service_role_key`.

Mientras falte, el cron corre, avisa en el registro y no dispara. No rompe
nada, pero tampoco publica.

---

## Probar antes de soltarlo

En el editor SQL, para ver qué publicaría **sin publicar**:

```sql
select net.http_post(
  url     := 'https://idefyablegqrnvwtvboo.supabase.co/functions/v1/social-post?dry=1',
  headers := jsonb_build_object(
               'Content-Type',  'application/json',
               'Authorization', 'Bearer ' || (select decrypted_secret
                                                from vault.decrypted_secrets
                                               where name = 'service_role_key'))
) as id;
```

La respuesta llega unos segundos después:

```sql
select status_code, content
  from net._http_response
 order by created desc
 limit 1;
```

Si devuelve el sabor y el texto que publicaría, está todo bien. Para la
primera publicación real:

```sql
select public.social_disparar();
```

Revisá el Instagram antes de dejarlo solo. De ahí en adelante se dispara
todos los días a las 19:00 de Estelí.

---

## Dónde vive cada cosa

Todo en el proyecto `vibe505` de Supabase:

| Pieza | Dónde |
|---|---|
| Cola y textos | tabla `social_queue` |
| Bitácora | tabla `social_posts` |
| Videos | bucket `reels-redes` |
| El código que publica | Edge Function `social-post` |
| El reloj | `cron.job`, tarea `publicar-instagram-diario` |
| Clave de servicio | Vault, secreto `service_role_key` |
| Secretos de Meta | Edge Functions → Secrets |

El código de la función está versionado en el repo, en
`supabase/functions/social-post/index.ts`.

Para ver o cambiar el horario:

```sql
select jobid, jobname, schedule, active from cron.job;

-- cambiar la hora (está en UTC; Estelí es UTC-6)
select cron.alter_job(
  (select jobid from cron.job where jobname = 'publicar-instagram-diario'),
  schedule := '0 1 * * *');

-- pausar
select cron.unschedule('publicar-instagram-diario');
```

---

## Por qué publica en el momento y no programado

Facebook acepta `scheduled_publish_time` y se puede dejar agendado en los
servidores de Meta hasta 30 días adelante. **Instagram no**: la API de
contenido (`/media` + `/media_publish`) publica en el instante en que se la
llama. Toda herramienta que dice "programar Instagram" guarda el contenido
y ejecuta la llamada a la hora exacta desde su propio servidor. Acá ese
servidor es `pg_cron`.

Es la misma razón por la que la automatización de Pide Fácil usa GitHub
Actions.

---

## Si algo falla

El error queda en `social_posts` con el texto que devolvió Meta:

```sql
select posted_at, slug, platform, status, error
  from public.social_posts
 order by posted_at desc
 limit 10;
```

Lo que más aparece:

- **"Page Publishing Authorization required"** — la página pide
  verificación de identidad antes de dejar publicar por API. Se resuelve
  en la configuración de la página; no hay forma de saltearlo.
- **Contenedor atascado en procesando** — no es error. El cron lo guarda y
  lo termina en la corrida siguiente.
- **No publicó y no hay fila en `social_posts`** — es que no disparó.
  Revisá que el secreto en Vault se llame `service_role_key`.

---

## Qué publica, y en qué red

Solo **Instagram**. Facebook lo cubre el bot de Business Suite, así que si
publicara en las dos redes cada reel saldría duplicado en la página.

Para volver a las dos:

```sql
update public.social_queue set platforms = array['instagram','facebook'];
```

Son 14 piezas, una por día: el ciclo es de dos semanas y después se
repite. Conviene ir sumando:

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
