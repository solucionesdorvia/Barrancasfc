# Barrancas FC — MVP Demo

Sistema de gestión integral del club (jugadores, cobranza, asistencia, portal del padre).

> MVP para demo de cierre. Stack: Next.js 14, TypeScript, Tailwind + shadcn/ui, Prisma + Postgres, Clerk, Uploadthing.

## Setup local

### 1. Requisitos
- Node 20+ (probado en 22)
- Postgres local o Railway

### 2. Instalar
```bash
npm install
cp .env.example .env
```

Completar `.env`:
- `DATABASE_URL` — Postgres
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — desde dashboard.clerk.com
- `UPLOADTHING_TOKEN` — desde uploadthing.com (opcional para demo)

### 3. Base de datos
```bash
npm run db:migrate    # aplica migrations versionadas (recomendado)
# o si estás en local y querés iterar más rápido:
npm run db:push       # sincroniza schema sin crear migration
npm run db:seed       # carga datos demo (1 club, 8 categorías, 80 jugadores)
```

### 4. Correr
```bash
npm run dev
```
→ http://localhost:3000

## Usuarios demo

| Rol      | Email                  | Password   |
|----------|------------------------|------------|
| Admin    | admin@barrancas.com    | Valen050203!   |
| Profesor | profe@barrancas.com    | Valen050203!   |
| Padre    | padre@barrancas.com    | Valen050203!   |

> Hay que crear esos 3 usuarios en Clerk con esos emails. El seed los linkea por email al `User` correspondiente.

## Deploy a Railway

1. Crear proyecto en Railway con Postgres
2. Conectar repo de GitHub
3. Setear variables de entorno
4. Build y start los maneja `railway.json` automático
5. **Las migraciones corren solas en cada deploy** (el `start` script ejecuta `prisma migrate deploy && next start`)
6. Solo después del primer deploy: correr `npm run db:seed` una vez para cargar data demo

### Workflow al cambiar el schema

```bash
# 1. Editás prisma/schema.prisma
# 2. Generás la migration
npx prisma migrate dev --name nombre_descriptivo
# 3. Commit + push → Railway aplica la migration solo al deployar
git add prisma/migrations && git commit -m "..." && git push
```

## Estructura

```
src/
  app/
    (admin)/admin/           Dashboard admin
    (profesor)/profesor/     Asistencia profesor
    (padre)/padre/           Portal padre (mobile-first)
    sign-in, sign-up         Clerk
  components/ui/             shadcn/ui base
  lib/                       prisma.ts, utils.ts
prisma/
  schema.prisma, seed.ts
```

## Roadmap del sistema final (no en MVP)
- Pasarela de pago real (Mercado Pago)
- WhatsApp API real para recordatorios
- 7 roles (admin, tesorería, coordinador, profesor, DT, médico, padre)
- Multi-club
- Firma digital de documentación
- Módulo médico ampliado, scouting, boletines
