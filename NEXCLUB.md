# NEXCLUB — Notas operativas

## Arquitectura de tenancy

- **DB compartida** con `clubId` en cada tabla relevante (User, Player, Category, Invitation, etc.).
- **Identificación del club por subdomain**: `<slug>.nexclub.app`. El middleware lo lee y `lib/club.ts::getCurrentClub()` resuelve por `Club.slug`.
- **Custom domain** (Pro): cuando se setea `Club.customDomain`, el host también resuelve a ese club.
- **Branding 100% en DB**: nombre, logo, colores y contactos del club viven en la tabla `Club`. El `RootLayout` los inyecta como CSS variables (`--club-*`) en el `<html>` de cada request.
- **Capas de tokens**:
  - `--nex-*` (fija, esmeralda) → marca NEXCLUB en bordes: landing, login, footer, powered-by.
  - `--club-*` (variable, viene de DB) → app del club. Si el club no tiene colores, hereda `--nex-*`.

## Cómo onboardear un club nuevo

### 1. DNS (una sola vez para toda la plataforma)
Wildcard `*.nexclub.app` apuntando a Railway. Ya configurado para Barrancas y todos los futuros.

### 2. Crear el club en DB
SQL directo (o desde un panel SUPERADMIN cuando exista):

```sql
INSERT INTO "Club"
  (id, slug, name, "primary", "primaryHover", "primarySoft", "onPrimary", accent, logo, tagline, "contactWhatsapp", "contactEmail")
VALUES
  (gen_random_uuid()::text, 'riestra', 'Deportivo Riestra',
   '#185FA5', '#0C447C', '#E6F1FB', '#E6F1FB', '#F97316',
   'https://.../escudo-riestra.png',
   'Inferiores · CABA',
   '+54 9 11 1111-1111', 'admin@riestra.com.ar');
```

### 3. Invitar al primer admin
Como SUPERADMIN, generar una invitación rol=ADMIN para `riestra` y mandar el link al dirigente. El link tiene la forma `https://riestra.nexclub.app/invite/<token>`.

### 4. Listo
Desde ese momento `https://riestra.nexclub.app` sirve la app del club Riestra con sus colores, su nombre y su logo. **Cero deploy, cero código tocado.**

## Cómo agregar un dominio propio (Pro)

1. El club apunta `app.suclub.com.ar` con `CNAME` hacia Railway.
2. En Railway, agregar `app.suclub.com.ar` como custom domain del proyecto.
3. `UPDATE "Club" SET "customDomain" = 'app.suclub.com.ar' WHERE slug = '<slug>';`
4. `getCurrentClub()` ya resuelve por `customDomain` automáticamente.

## Estructura del repo

- `src/app/(marketing)/` — landing pública NEXCLUB (esmeralda fija). Solo usa `bg-nex`, `text-nex`, etc. **NO** lee `--club-*`.
- `src/app/admin/`, `src/app/profesor/`, `src/app/padre/`, `src/app/invite/` — app del club. Hereda los colores del tenant vía CSS vars inyectadas en `<html>`.
- `src/lib/club.ts` — resolver del club actual (subdomain → customDomain → fallback al primer club).
- `src/components/nex/` — wordmark y powered-by (siempre marca NexClub).
- `src/components/brand-logo.tsx` — logo del panel; recibe `clubName` y `logoUrl` como props, los layouts del panel se los pasan.

## Reglas de oro

- **En la app del club**: SIEMPRE `bg-club`, `text-club`, `bg-club-soft`. NUNCA `bg-nex`.
- **En la landing / login / powered-by**: SIEMPRE `bg-nex`, `text-nex`. NUNCA `bg-club`.
- **Templates de WhatsApp/email**: leer `club.name`, `club.contactWhatsapp`, `club.contactEmail`. Cero hardcode del nombre del club.
- **Colores semánticos** (`text-red-600` para danger, `text-emerald-600` para success): no son del club. Quedan como están.

## TODOs pendientes

- [ ] Comprar `nexclub.app` y apuntar wildcard a Railway.
- [ ] Reemplazar `WHATSAPP_DEMO` en `(marketing)/page.tsx` con el número real de NEXCLUB.
- [ ] Setear `RESEND_FROM_EMAIL=NEXCLUB <noreply@nexclub.app>` en Railway cuando el dominio esté listo (hoy lo lee del env, sino usa el default).
- [ ] Panel SUPERADMIN (`/super`) para onboardear clubes nuevos sin SQL manual.
- [ ] Migrar Barrancas a `barrancas.nexclub.app` cuando el wildcard esté listo. La URL actual sigue funcionando con 301 al nuevo dominio.
