# TalentFlow — Backend (ATS)

Backend del sistema de reclutamiento (ATS) TalentFlow, proyecto académico del curso **Desarrollo de aplicaciones Web avanzado con Node.js y Next.js** (Instituto Tecsup).

API REST construida con Express 5, TypeScript y Prisma sobre PostgreSQL (Supabase). El frontend (Next.js, repositorio separado) consume esta API vía `fetch`.

**URL pública (producción):** https://talentflow-backend-dlry.onrender.com
**Swagger:** https://talentflow-backend-dlry.onrender.com/api/docs
**Health check:** https://talentflow-backend-dlry.onrender.com/api/health

> El plan free de Render "duerme" el servicio tras ~15 min sin tráfico. La primera petición tras eso puede tardar 30-50s (cold start).

## Stack

- Node.js 20+, Express 5, TypeScript
- Prisma ORM + PostgreSQL (Supabase)
- JWT (access + refresh token), bcrypt
- Zod para validación
- Swagger (`swagger-jsdoc` + `swagger-ui-express`)
- Helmet, CORS, `express-rate-limit`
- Pino para logging
- Jest + Supertest para testing

## Requisitos previos

- Node.js 20 o superior
- Una base de datos Postgres (proyecto de Supabase gratuito)

## Instalación

```bash
npm install
cp .env.example .env
```

Completa `.env` con tus credenciales de Supabase y tus propios secretos de JWT (ver sección de variables de entorno).

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NODE_ENV` | `development`, `test` o `production` |
| `PORT` | Puerto del servidor (default `4000`) |
| `DATABASE_URL` | Cadena de conexión con connection pooling de Supabase (Transaction mode, puerto `6543`), usada por la app en runtime |
| `DIRECT_URL` | Cadena de conexión directa de Supabase (puerto `5432`), usada solo por Prisma Migrate |
| `JWT_SECRET` | Secreto para firmar el access token |
| `JWT_REFRESH_SECRET` | Secreto para firmar el refresh token |
| `JWT_ACCESS_EXPIRES_IN` | Duración del access token (default `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Duración del refresh token (default `7d`) |
| `BCRYPT_SALT_ROUNDS` | Rondas de salt para bcrypt (default `10`) |
| `CORS_ORIGIN` | URL del frontend permitida por CORS |

## Base de datos

```bash
npm run prisma:generate   # genera el cliente de Prisma
npm run prisma:migrate    # crea/aplica migraciones (requiere DATABASE_URL válido)
npm run prisma:seed       # crea usuarios y vacantes de prueba
npm run prisma:studio     # explorador visual de la base de datos
```

## Correr en local

```bash
npm run dev
```

El servidor queda disponible en `http://localhost:4000`, con la documentación Swagger en `http://localhost:4000/api/docs`.

## Build y producción

```bash
npm run build
npm start
```

## Tests

```bash
npm test
```

## Despliegue

Backend desplegado en **Render** (detección nativa de Node.js, sin Docker) en https://talentflow-backend-dlry.onrender.com. La base de datos vive en **Supabase** tanto en desarrollo como en producción.

Build Command: `npm install && npx prisma migrate deploy && npm run build`
Start Command: `npm start`

Nota: Render aplica `NODE_ENV=production` también durante el build, lo que hace que `npm install` omita las `devDependencies` (TypeScript, `@types/*`, Prisma CLI). Por eso el servicio tiene la variable `NPM_CONFIG_PRODUCTION=false`, que fuerza a instalarlas igual para poder compilar.

## Credenciales de prueba (seed)

| Rol | Email | Password |
|---|---|---|
| ADMIN | admin@talentflow.com | Talentflow123! |
| RECLUTADOR | reclutador@talentflow.com | Talentflow123! |
| POSTULANTE | postulante@talentflow.com | Talentflow123! |
