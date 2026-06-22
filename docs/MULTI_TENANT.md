# NEXCLUB · Multi-tenant operacional

Cómo dar de alta un club nuevo, dependiendo del tipo de hosting que quiera.

---

## Caso A — Subdomain `<slug>.nexclub.app` (default, gratis, 1 min)

Es lo que usa **Barrancas FC** (`barrancas.nexclub.app`). Pensado para
el 95% de los clubes.

### Pasos (desde el panel SUPERADMIN)

1. Entrar a `https://nexclub.app/super` con tu cuenta SUPERADMIN.
2. Click **"Nuevo club"**.
3. Completar:
   - **Slug** — lowercase, sin espacios. Ejemplo: `riestra` → la app va a
     ser `riestra.nexclub.app`.
   - **Nombre** — visible en el panel y comunicaciones. Ej.: `Deportivo Riestra`.
   - **Tagline** — opcional, ej. `Liga Profesional`.
   - **Colores** — `primary`, `primaryHover`, `primarySoft`, `onPrimary`,
     `accent`. El panel del club se theming completo desde acá.
   - **Logo** — URL del escudo del club (upload via UploadThing o link público).
   - **Contacto** — WhatsApp + email del club, usados en comunicaciones.
4. Click **Crear**.

### Por qué funciona inmediato

- **DNS**: `*.nexclub.app` es CNAME al wildcard de Railway, ya configurado.
- **TLS**: el cert wildcard `*.nexclub.app` (Let's Encrypt vía Railway) cubre
  cualquier subdomain.
- **Routing**: el middleware (`src/middleware.ts`) extrae el slug del host
  y lo inyecta como `x-club-slug`. `lib/club.ts::getCurrentClub()` resuelve
  el tenant por ese slug y carga sus colores y branding.

### Limitaciones

- La URL siempre tiene `.nexclub.app` (no es 100% white-label).
- El footer muestra "Powered by NEXCLUB" (no se puede ocultar hoy).

---

## Caso B — Custom domain (`barrancasfc.com.ar` u otro, 20 min)

Si un club quiere su propio dominio. El schema ya soporta `customDomain`
en `Club`. Falta cierre operacional.

### Pasos

1. **En el panel SUPERADMIN** (`/super/clubs/<id>`):
   - Editar el club existente y completar el campo **Custom Domain** con
     el dominio del cliente, ej. `barrancasfc.com.ar`.

2. **En Railway** (Settings → Networking → Custom Domain):
   - Click **Add Custom Domain** → escribir `barrancasfc.com.ar`.
   - Railway te muestra un **CNAME target** (`xyz.up.railway.app`).

3. **En el registrador del cliente** (donde tiene `barrancasfc.com.ar`):
   - Agregar **CNAME** con name `@` (o `www`, según el caso) apuntando al
     target que dio Railway.
   - Si el registrador no acepta CNAME en `@`, usar Forwarding 301 del
     apex al `www` (mismo problema que tuvimos con GoDaddy + nexclub.app).

4. Railway emite cert TLS automático en ~10 min.

### Verificación

```bash
curl -sk -I https://barrancasfc.com.ar/
```

Debería responder HTTP 200/301/302 con cert válido.

### Behavior esperado

- `barrancasfc.com.ar/` resuelve al mismo tenant que `barrancas.nexclub.app/`
  (mismo `clubId`, mismos datos).
- `lib/club.ts::getCurrentClub()` resuelve por `customDomain` cuando el host
  no es un subdomain de `nexclub.app`.

### Mejora pendiente (no implementada)

Idealmente, cuando un club tiene custom domain, redirigimos
`<slug>.nexclub.app` → `barrancasfc.com.ar` (la URL canónica es la del
cliente). Hoy ambos sirven la app. Cuando llegue el primer caso, agregar
en `src/middleware.ts` después del `extractSubdomainFromHost`:

```ts
if (subdomain) {
  const club = await prisma.club.findUnique({
    where: { slug: subdomain },
    select: { customDomain: true },
  });
  if (club?.customDomain) {
    const url = new URL(req.url);
    url.host = club.customDomain;
    return NextResponse.redirect(url, 301);
  }
}
```

**Atención**: middleware corre en Edge runtime, NO puede usar Prisma.
Hay que cachearlo en KV o pasar la lista vía env var. Tema para
implementar cuando aparezca el primer caso real.

---

## Caso C — White-label total (Enterprise tier, ~1 día)

Cuando un cliente paga por sacar toda referencia a NEXCLUB de su
instancia. No implementado, pero el path es claro:

1. Agregar en schema:
   ```prisma
   model Club {
     // ... existing fields
     hideNexBranding   Boolean   @default(false)
     customFavicon     String?
     customSenderEmail String?   // ej. noreply@barrancasfc.com.ar
   }
   ```

2. Condicionar el `<PoweredByNexClub/>` en footer del panel del club:
   ```tsx
   {!club.hideNexBranding && <PoweredByNexClub />}
   ```

3. Mailer (`lib/mailer.ts`) usa `club.customSenderEmail` si está seteado,
   con fallback al default `noreply@nexclub.app`.

4. Configurar SPF/DKIM del dominio del cliente en Resend (requiere acceso
   a su DNS — se hace una sola vez por cliente Enterprise).

5. Servir favicon del club desde su `customFavicon` URL.

### Tarifario sugerido

- **Basic** (subdomain `.nexclub.app`): gratis o cuota baja.
- **Pro** (custom domain): cuota media.
- **Enterprise** (custom domain + white-label): cuota alta (4-5x Pro).

---

## Operativa diaria

Cuando un cliente nuevo te pide entrar a NEXCLUB:

1. Crear el club desde `/super` (1 min, modo A).
2. Generar invitación admin desde `/super/clubs/<id>` → mandar el link al
   admin del club.
3. El admin entra, completa onboarding (foto/datos), genera invitaciones
   para profes y padres.
4. Si pide custom domain, pasa al modo B.

---

## Decisión: cuándo NO sumar un club

- Si tiene <50 jugadores: probablemente Excel les alcanza, no vale la
  pena el setup.
- Si requiere features que no están (control médico avanzado, fichajes AFA,
  multi-deporte): marcalo en el roadmap, no prometas timeline.
- Si pide white-label sin pagar Enterprise: cobrar primero o usar
  subdomain default.
