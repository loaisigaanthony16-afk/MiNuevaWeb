# Publicación diaria en Instagram y Facebook

**Está todo armado y probado menos una línea.**

Verificado el 2026-10-03 de punta a punta: el cron dispara, la llave de
disparo valida, la función lee los secretos y la cola, y los videos se
sirven desde el sitio. Lo único que falta es cargar el token de Meta.

---

## Lo único que queda por hacer

En el editor SQL de Supabase, proyecto `vibe505`, una sola línea:

```sql
select vault.create_secret('PEGA_ACA_EL_TOKEN', 'meta_access_token');
```

El token es el del usuario de sistema **ClaudeBot**. Está en el archivo
`.env` de la carpeta `pidefacil-nube`, dentro de la carpeta de
automatización de Pide Fácil, en la línea que empieza con `EAA`.

El nombre del secreto tiene que ser exactamente `meta_access_token`.

Y listo. De ahí en adelante publica solo, todos los días a las 19:00 de
Estelí.

---

## Probar

Para ver qué publicaría **sin publicar**:

```sql
select net.http_post(
  url     := 'https://idefyablegqrnvwtvboo.supabase.co/functions/v1/social-post?dry=1',
  headers := jsonb_build_object(
               'Content-Type',  'application/json',
               'x-trigger-key', (select decrypted_secret
                                   from vault.decrypted_secrets
                                  where name = 'social_trigger_key'))
);
```

La respuesta llega unos segundos después:

```sql
select status_code, content
  from net._http_response
 order by created desc
 limit 1;
```

Para la primera publicación real:

```sql
select public.social_disparar();
```

Revisá Instagram y Facebook antes de dejarlo solo.

---

## Por qué no hubo que tocar nada más

**El token de Meta ya existía.** El usuario de sistema ClaudeBot alcanza a
cuatro páginas, y una es VIBE 505 (@vibe505.nic). Tiene los cinco permisos
que hacen falta. No hizo falta crear app, ni App Review, ni token nuevo.

| Página | page_id | Instagram |
|---|---|---|
| **VIBE 505** | 1320417081162690 | @vibe505.nic (17841435896984638) |
| Peak Goods | 1359789783879378 | @peakgoodsofficial |
| Pide Fácil Nicaragua | 1035367996317961 | @pidefacil.nic |
| Loaisiga Cigars | 115709504858400 | sin IG ligado |

**Los videos no necesitan Storage.** Se sirven desde
`https://www.vibe505.com/reels-redes/`, que ya es público. Meta los
descarga de ahí.

**El cron no necesita la clave de servicio.** Usa una llave de disparo que
genera Postgres solo y queda en Vault. La función la valida por cabecera;
con una llave equivocada devuelve 401.

---

## Dónde vive cada cosa

Todo en el proyecto `vibe505` de Supabase, menos los videos:

| Pieza | Dónde |
|---|---|
| Cola y textos | tabla `social_queue` |
| Bitácora | tabla `social_posts` |
| El código que publica | Edge Function `social-post` |
| El reloj | `cron.job`, tarea `publicar-instagram-diario` |
| Llave de disparo | Vault, `social_trigger_key` (ya generada) |
| Token de Meta | Vault, `meta_access_token` ← **falta esto** |
| Videos | `public/reels-redes/` del sitio |

El código de la función está versionado en
`supabase/functions/social-post/index.ts`.

Horario:

```sql
select jobid, jobname, schedule, active from cron.job;

-- cambiar la hora (UTC; Estelí es UTC-6)
select cron.alter_job(
  (select jobid from cron.job where jobname = 'publicar-instagram-diario'),
  schedule := '0 1 * * *');

-- pausar
select cron.unschedule('publicar-instagram-diario');
```

---

## Si algo falla

```sql
select posted_at, slug, platform, status, error
  from public.social_posts
 order by posted_at desc
 limit 10;
```

- **"Page Publishing Authorization required"** — la página pide
  verificación de identidad antes de dejar publicar por API. Se resuelve
  en la configuración de la página.
- **Contenedor atascado en procesando** — no es error. El cron lo guarda y
  lo termina en la corrida siguiente.
- **No publicó y no hay fila en `social_posts`** — no disparó. Revisá que
  el secreto se llame exactamente `meta_access_token`.

---

## Contenido

14 piezas, una por día, en Instagram y Facebook. El ciclo es de dos
semanas y después se repite, así que conviene ir sumando:

```sql
insert into public.social_queue (slug, video_url, caption, position)
values ('nombre', 'https://www.vibe505.com/reels-redes/nombre.mp4', 'El texto.', 14);
```

Pausar una sin borrarla:

```sql
update public.social_queue set enabled = false where slug = '...';
```

Si Facebook ya lo cubre el bot de Business Suite y te salen duplicados:

```sql
update public.social_queue set platforms = array['instagram'];
```

Las reglas de qué escribir en el pie de foto están en
`reels redes/LEEME.md`.
