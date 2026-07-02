# CLAUDE.md — Backend ATS (Applicant Tracking System)

Este archivo es el contexto de proyecto para Claude Code. Léelo completo antes de escribir o modificar código. Todas las decisiones técnicas aquí descritas son intencionales y deben respetarse salvo que el usuario indique lo contrario explícitamente.

---

## 1. Contexto general

Este es un proyecto académico para el curso de **Desarrollo de aplicaciones Web avanzado con Node.js y Next.js** (Instituto Tecsup). El caso de negocio: una empresa necesita digitalizar su proceso de reclutamiento.

Se eligió el **Módulo 1 — Sistema de Reclutamiento (ATS)**, similar en espíritu a plataformas como **LinkedIn Jobs** y **Computrabajo**: una zona pública donde cualquiera puede ver y buscar vacantes (con buen SEO), y una zona privada donde reclutadores gestionan vacantes/postulantes y administradores gestionan la plataforma.

Este repositorio es **solo el backend**. El frontend (Next.js) se construirá después en un proyecto separado con su propio CLAUDE.md, y consumirá esta API vía `fetch`. Cuando trabajes en este backend, diseña siempre pensando en que un cliente Next.js externo (con SSR/SSG para SEO) va a consumir estos endpoints — expón datos completos y bien estructurados (slugs, fechas ISO, IDs consistentes) para que el frontend no tenga que adivinar nada.

**Referencia visual/UX que debe soportar la API** (aunque el diseño lo hace el frontend, el backend debe entregar los datos que estas features necesitan):
- Listado público de vacantes con filtros (ubicación, modalidad, categoría, fecha de publicación) — estilo Computrabajo/LinkedIn Jobs.
- Página de detalle de vacante con slug amigable para URL (`/vacantes/desarrollador-backend-node-lima`).
- Perfil de postulante con historial de postulaciones y su estado.
- Panel de reclutador tipo Kanban/tabla para mover postulantes entre estados (Postulado → En revisión → Entrevista → Oferta → Rechazado/Contratado).

---

## 2. Rol de Claude Code en este proyecto

- Actúa como un desarrollador backend senior que sigue principios SOLID y Clean Architecture de forma pragmática (no académica al extremo — esto es un proyecto de curso, no una librería open source).
- Antes de generar código nuevo, revisa la estructura de carpetas ya existente y sigue el patrón establecido.
- Si una petición del usuario rompe la arquitectura descrita aquí, coméntalo antes de proceder.
- Prioriza que el proyecto **cumpla rigurosamente los requerimientos obligatorios del curso** (sección 9). Ningún endpoint o feature debe implementarse "a medias" cuando el requerimiento es explícito.
- Genera commits pequeños y descriptivos si se te pide hacer control de versiones (convención: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:` — estilo Conventional Commits).

---

## 3. Stack tecnológico (Backend)

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express 5 |
| Lenguaje | TypeScript |
| ORM | Prisma |
| Base de datos (dev y prod) | Supabase Postgres (mismo `DATABASE_URL` en ambos entornos, sin Docker) |
| Autenticación | JWT (access + refresh token) |
| Hashing de contraseñas | bcrypt |
| Validación | Zod |
| Documentación API | Swagger (OpenAPI 3.0) vía `swagger-jsdoc` + `swagger-ui-express` |
| Seguridad HTTP | Helmet, CORS configurado, rate limiting (`express-rate-limit`) |
| Logging | Pino o Winston (logs estructurados, no `console.log` en producción) |
| Testing | Jest + Supertest (mínimo para endpoints críticos: auth, CRUD de vacantes, postulaciones) |
| Gestor de paquetes | npm |

**Por qué TypeScript**: mejor mantenibilidad y menos bugs en tiempo de ejecución, y facilita generar tipos compartibles con el frontend más adelante si se desea.

**Por qué Prisma**: migraciones versionadas, tipado automático, y encaja bien con Postgres gestionado en Supabase.

---

## 4. Arquitectura y principios SOLID aplicados

Arquitectura en capas (Layered / Clean Architecture simplificada), separando responsabilidades para que el código sea testeable, escalable y fácil de mantener:

```
Routes → Controllers → Services → Repositories → Prisma (DB)
              ↓
          DTOs / Validators (Zod)
```

### Cómo se aplica cada principio SOLID:

- **S — Single Responsibility**: cada capa tiene una única razón para cambiar.
  - `controllers/`: solo reciben `req`/`res`, delegan al service, formatean la respuesta HTTP.
  - `services/`: contienen la lógica de negocio pura (sin conocer Express).
  - `repositories/`: son los únicos que hablan con Prisma/la base de datos.
- **O — Open/Closed**: los servicios dependen de interfaces de repositorio, no de Prisma directamente, para poder extender o cambiar la fuente de datos sin modificar la lógica de negocio.
- **L — Liskov Substitution**: cualquier implementación de un repositorio (ej. `IVacanteRepository`) debe poder sustituirse (mock en tests) sin romper el service que la usa.
- **I — Interface Segregation**: interfaces de repositorio pequeñas y específicas por entidad, no una interfaz gigante genérica.
- **D — Dependency Inversion**: los services reciben sus repositorios por **inyección de dependencias** (constructor), no los instancian directamente. Esto también facilita testing con mocks.

### Estructura de carpetas propuesta

```
backend/
├── src/
│   ├── config/                 # env, swagger config, cors config, db connection
│   │   ├── env.ts
│   │   ├── swagger.ts
│   │   └── database.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.dto.ts        # Zod schemas
│   │   │   └── auth.types.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.routes.ts
│   │   │   └── users.dto.ts
│   │   ├── vacantes/
│   │   │   ├── vacantes.controller.ts
│   │   │   ├── vacantes.service.ts
│   │   │   ├── vacantes.repository.ts
│   │   │   ├── vacantes.routes.ts
│   │   │   └── vacantes.dto.ts
│   │   └── postulaciones/
│   │       ├── postulaciones.controller.ts
│   │       ├── postulaciones.service.ts
│   │       ├── postulaciones.repository.ts
│   │       ├── postulaciones.routes.ts
│   │       └── postulaciones.dto.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts       # verifica JWT
│   │   ├── role.middleware.ts       # verifica rol permitido
│   │   ├── error.middleware.ts      # manejador centralizado de errores
│   │   ├── validate.middleware.ts   # valida body/query con Zod
│   │   └── rateLimiter.middleware.ts
│   ├── shared/
│   │   ├── errors/                  # clases de error custom (AppError, NotFoundError, etc.)
│   │   ├── utils/                   # bcrypt helpers, jwt helpers, slugify, etc.
│   │   └── types/
│   ├── interfaces/                  # contratos de repositorios (para DIP)
│   ├── app.ts                       # configuración de Express (middlewares globales, rutas)
│   └── server.ts                    # punto de entrada, levanta el servidor
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                      # crea usuario admin + datos de prueba
├── tests/
│   ├── auth.test.ts
│   └── vacantes.test.ts
├── docs/
│   └── swagger.yaml                 # opcional si se prefiere spec separado del código
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

**Regla importante**: cada módulo (`auth`, `users`, `vacantes`, `postulaciones`) es autocontenido. No mezclar lógica de un módulo dentro de otro — si `postulaciones` necesita datos de `vacantes`, se comunica a través del service de vacantes, no accediendo directamente a su repositorio.

---

## 5. Modelo de datos (mínimo, cumple "CRUD de mínimo 3 entidades")

Entidades principales:

1. **User** — id, nombre, email, passwordHash, rol (`ADMIN` | `RECLUTADOR` | `POSTULANTE`), createdAt.
2. **Vacante** — id, titulo, slug, descripcion, requisitos, ubicacion, modalidad (remoto/presencial/híbrido), salarioRango, estado (`ABIERTA` | `CERRADA` | `BORRADOR`), reclutadorId (FK a User), createdAt.
3. **Postulacion** — id, vacanteId (FK), postulanteId (FK a User), cvUrl u observaciones, estado (`POSTULADO` | `EN_REVISION` | `ENTREVISTA` | `OFERTA` | `RECHAZADO` | `CONTRATADO`), createdAt, updatedAt.
4. **HistorialEstado** (obligatoria) — id, postulacionId, estadoAnterior, estadoNuevo, cambiadoPor, fecha — implementa la trazabilidad de "Gestión de estados del postulante" exigida explícitamente en el checklist del curso (sección 9). Cada cambio de estado de una `Postulacion` debe generar un registro aquí, nunca sobrescribir el estado sin dejar rastro.

El slug en `Vacante` es clave para que el frontend genere URLs amigables para SEO (`/vacantes/[slug]`).

---

## 6. Autenticación y autorización

- **JWT propio** (no NextAuth): el backend es un servicio independiente consumido por un frontend externo, así que NextAuth no aplica aquí — es una librería pensada para cuando Next.js maneja su propio backend.
- Access token de corta duración (15 min) + refresh token (7 días), refresh token idealmente en cookie `httpOnly`.
- Passwords SIEMPRE hasheadas con bcrypt (salt rounds ≥ 10) — nunca en texto plano, ni siquiera en logs.
- Middleware `auth.middleware.ts`: valida el JWT en rutas protegidas.
- Middleware `role.middleware.ts`: valida que el rol del usuario autenticado tenga permiso sobre la ruta (ej. solo `ADMIN` y `RECLUTADOR` pueden crear vacantes; solo `POSTULANTE` puede postular).
- **La autorización se valida siempre en el backend**, nunca confiar en que el frontend oculte botones — esto es un punto que se revisa en la evaluación de seguridad real.
- Rutas públicas (sin auth): listar vacantes, ver detalle de vacante — necesario para que existan en SSR/SSG del frontend y sean indexables.

---

## 7. Documentación de API (Swagger)

- Usar `swagger-jsdoc` para generar el spec desde comentarios JSDoc en cada archivo de rutas, y `swagger-ui-express` para servirlo en `/api/docs`.
- Cada endpoint debe documentar: método, path, parámetros, request body (schema), posibles respuestas (200, 400, 401, 403, 404, 500) con ejemplos.
- El spec debe incluir la definición de seguridad `bearerAuth` (JWT) para que Swagger UI permita probar endpoints protegidos directamente desde la interfaz.
- Mantener el spec actualizado en cada PR/cambio de endpoint — no dejarlo desincronizado del código real.

---

## 8. Base de datos y despliegue (sin Docker)

**Decisión de proyecto**: no se usa Docker en ningún punto. Tanto desarrollo como producción apuntan al **mismo proyecto de Supabase Postgres**, cambiando únicamente el `DATABASE_URL` si se decide separar un branch/proyecto de dev y otro de prod (opcional; para un proyecto de curso puede ser el mismo).

- El backend corre con `npm run dev` en local, conectado directamente a Supabase — no hace falta instalar ni levantar Postgres localmente.
- **Despliegue en Render** usando su detección nativa de Node.js (`package.json` → `npm install && npm run build && npm start`), sin `Dockerfile` ni imágenes que gestionar.
- Variables de entorno (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, etc.) se configuran directamente en el dashboard de Render, nunca hardcodeadas ni commiteadas.
- `CORS_ORIGIN` admite una **lista separada por comas** (`app.ts` la parsea y valida el origen de cada request contra esa lista) — así se puede tener `http://localhost:3000` (dev) y la URL de producción de Vercel al mismo tiempo, sin tener que alternar el valor cada vez que se prueba localmente contra el backend desplegado.
- Como el frontend (Vercel) y el backend (Render) viven en dominios distintos, la cookie `httpOnly` del refresh token necesita `SameSite=None; Secure` y el frontend debe llamar a `fetch` con `credentials: 'include'` — sin esto el login funciona en Postman/Swagger pero falla en el navegador.

---

## 9. Checklist de requerimientos obligatorios del curso (Backend)

Usa esta lista para verificar cobertura completa antes de dar cualquier entrega por terminada:

- [ ] Registro de usuario (con rol asignado correctamente)
- [ ] Login con JWT
- [ ] Passwords hasheadas con bcrypt
- [ ] Middleware de protección de rutas
- [ ] Middleware de roles y permisos (Admin / Reclutador / Postulante)
- [ ] API REST con CRUD completo de mínimo 3 entidades (Users, Vacantes, Postulaciones)
- [ ] Gestión de estados del postulante (endpoint específico para cambiar estado + trazabilidad)
- [ ] Documentación Swagger accesible en `/api/docs`
- [ ] Manejo de errores centralizado y consistente (formato de respuesta uniforme)
- [ ] Validación de inputs en cada endpoint (Zod)
- [ ] CORS configurado correctamente para el dominio de Vercel
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] Desplegado en Render, con URL pública funcional
- [ ] Seed de base de datos con al menos: 1 usuario ADMIN, 1 RECLUTADOR, 1 POSTULANTE, 2–3 vacantes de ejemplo (para las credenciales de entrega)
- [ ] README.md del repositorio con instrucciones de instalación, variables de entorno necesarias, y cómo correr localmente

---

## 10. Convenciones de código

- Nombres de archivos: `kebab-case` o `camelCase.tipo.ts` (ej. `vacantes.service.ts`), consistente con la estructura ya definida.
- Nombres de variables/funciones en inglés; nombres de dominio de negocio (entidades, roles, estados) en español, ya que reflejan el vocabulario real del caso (`Vacante`, `Postulacion`, `RECLUTADOR`).
- Respuestas de API siempre en un formato consistente, por ejemplo:
```json
{
  "success": true,
  "data": { ... },
  "message": "Vacante creada correctamente"
}
```
y para errores:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo 'titulo' es obligatorio"
  }
}
```
- No exponer `passwordHash` ni ningún dato sensible en ninguna respuesta de la API, nunca.
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`).

---

## 11. Lo que NO hacer

- No mezclar lógica de negocio dentro de los controllers.
- No acceder a Prisma directamente desde un service — siempre a través del repositorio correspondiente.
- No usar NextAuth (no aplica a este backend independiente).
- No usar Axios en el backend (irrelevante aquí, pero recordar que el frontend usará `fetch` nativo, así que la API debe devolver JSON limpio y bien tipado, sin necesidad de transformaciones raras del lado cliente).
- No hardcodear secretos, URLs, ni credenciales en el código — todo vía `.env`.
- No dejar endpoints sin validación de rol si el requerimiento del curso especifica que esa acción es exclusiva de un rol.

---

## 12. Próximos pasos (fuera de este documento)

El frontend en Next.js (con su propio `CLAUDE.md`) se construirá en un proyecto separado más adelante. Ese frontend consumirá esta API vía `fetch`, se desplegará en **Vercel**, y será responsable de: metadata dinámica, sitemap.xml, robots.txt, optimización de imágenes con `next/image`, y alcanzar Lighthouse ≥ 85. Este backend debe estar diseñado para no ser un obstáculo para ninguno de esos objetivos (respuestas rápidas, datos completos, slugs amigables, sin lógica de presentación mezclada en la API).