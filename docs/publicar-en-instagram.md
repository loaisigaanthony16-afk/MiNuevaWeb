# Conectar Instagram para que el cron publique solo

Guía para dejar andando `/api/cron/social-post`. Son tres cosas: darle a
la app acceso a la cuenta, sacar los dos IDs y generar un token que no
venza.

**No hace falta App Review.** Eso solo aplica si publicás en cuentas de
otra gente. Para publicar en la tuya alcanza con darle a la cuenta de
Instagram el rol de *Instagram Tester* en la app.

---

## Antes de empezar: tres requisitos

1. **La cuenta de Instagram tiene que ser Profesional** (Empresa o
   Creador). Si es personal, la API no la deja tocar. Se cambia desde la
   app de Instagram, en Configuración → Tipo de cuenta.

2. **Tiene que estar ligada a la página de Facebook de Vibe 505.** El
   permiso viaja por la página, no por la cuenta.

3. **La página y la cuenta tienen que estar en el mismo Business Manager
   que la app.** Acá está el punto a revisar en tu caso: la app se llama
   "Pide Facil IA". Si esa app vive en un Business Manager distinto al de
   Vibe 505, el usuario de sistema de uno **no puede** tocar los activos
   del otro. Si están separados, hay dos salidas: agregar la página y la
   cuenta de Vibe 505 como activos del Business Manager de la app, o
   crear una app aparte dentro del Business Manager de Vibe 505.

---

## Paso 1 — Preparar la app

En [developers.facebook.com](https://developers.facebook.com) → tu app:

1. **Agregá el producto "Instagram"**, variante *Instagram API with
   Facebook Login*. Es la que usa el código, porque los IDs salen de la
   página.

2. **Permisos.** Que la app tenga pedidos:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`

   Si además tenés un rol de Business Manager sobre la página, Meta pide
   también `ads_management` y `ads_read`. No es que vayas a pautar: es
   cómo Meta resuelve los permisos cuando la página está en un Business.

3. **Roles → Instagram Testers:** agregá la cuenta de Instagram de
   Vibe 505. Después, **desde Instagram** hay que aceptar la invitación:
   Configuración → Apps y sitios web → Invitaciones de tester.
   Si no aceptás ahí, nada funciona y el error no lo dice claro.

---

## Paso 2 — Sacar los dos IDs

Andá al [Explorador de la API Graph](https://developers.facebook.com/tools/explorer/),
elegí tu app arriba a la derecha, generá un token de usuario con los
permisos de arriba y corré:

```
GET /me/accounts
```

Buscá la página de Vibe 505 y copiá su `id`. Ese es **META_PAGE_ID**
(aunque el cron ahora publique solo en Instagram, conviene tenerlo).

```
GET /{el-id-de-la-pagina}?fields=instagram_business_account{id,username}
```

El `id` que devuelve adentro de `instagram_business_account` es
**META_IG_USER_ID**. Verificá que el `username` sea el de Vibe 505: es
fácil copiar el de otra cuenta sin darse cuenta.

Comprobá que la cuenta puede publicar:

```
GET /{el-id-de-instagram}/content_publishing_limit
```

Si responde con el cupo usado, está todo bien. El límite son 100
publicaciones por día; nosotros usamos una.

---

## Paso 3 — El token que no vence

**No uses el token del Explorador.** Dura una hora. El token de página
largo dura 60 días y después el cron se muere sin avisar: no falla de
forma visible, simplemente deja de publicar.

Lo correcto es un **usuario de sistema**:

1. [Business Manager](https://business.facebook.com/settings) →
   Usuarios → Usuarios del sistema → Agregar.
2. Rol: Administrador.
3. **Asignar activos:** la página de Facebook y la cuenta de Instagram de
   Vibe 505, con control total.
4. Generar token → elegí la app → marcá `instagram_basic`,
   `instagram_content_publish`, `pages_read_engagement`,
   `pages_show_list`.
5. Copialo apenas aparece. No se vuelve a mostrar.

Ese es **META_ACCESS_TOKEN**.

---

## Paso 4 — Configurar y probar

En Vercel → el proyecto → Settings → Environment Variables, agregá las
tres en Production:

```
META_ACCESS_TOKEN
META_IG_USER_ID
META_PAGE_ID
```

Volvé a desplegar para que las tome. Después, prueba en seco:

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" "https://www.vibe505.com/api/cron/social-post?dry=1"
```

Tiene que responder qué publicaría, sin publicar. Si eso sale bien, corré
la misma sin `?dry=1` para la primera publicación de verdad. Revisá el
Instagram antes de dejarlo solo.

---

## Si algo falla

El error queda guardado en la tabla `social_posts` de Supabase, en la
columna `error`, con el texto que devolvió Meta. Para ver los últimos:

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
- **"The user is not an Instagram Business"** — la cuenta sigue siendo
  personal, o no aceptaste la invitación de tester.
- **"Unsupported get request" sobre el ID de Instagram** — el token no
  tiene asignado ese activo. Volvé al paso 3, punto 3.
- **Contenedor atascado en procesando** — no es error: el cron lo guarda
  y lo termina en la corrida siguiente.

---

## Qué publica hoy

14 piezas, una por día, rotando. El ciclo completo es de dos semanas y
después se repite. Conviene ir sumando contenido:

```sql
insert into public.social_queue (slug, video_url, caption, position)
values ('nombre-del-sabor', 'https://.../video.mp4', 'El texto.', 14);
```

Para pausar una sin borrarla: `update public.social_queue set enabled =
false where slug = '...';`

Las reglas de qué escribir y qué no están en `reels redes/LEEME.md`.
