# Sede Electrónica — Ayuntamientos

Sistema **SaaS de sede electrónica** para la administración pública española, construido con **Next.js 16 / React 19 / TypeScript**. Permite a ciudadanos (administrados) presentar instancias generales y consultar sus registros, mientras que los funcionarios gestionan expedientes y actuaciones. Cada instancia (ayuntamiento) puede personalizar su propia sede (nombre, logo, color de acento, textos).

---

## Arquitectura

Diagrama completo en [`docs/architecture.md`](docs/architecture.md).

```mermaid
graph TB
    Browser["🌐 Browser\n(React 19 + GlobalContext)"]
    NextJS["⚡ Next.js 16\n(App Router + API Routes)"]
    MongoDB[("🍃 MongoDB 7")]
    RustFS["📦 RustFS / S3\nficheros adjuntos"]
    MailHog["📧 MailHog\nSMTP (dev)"]

    Browser -->|"fetch + Bearer JWT"| NextJS
    NextJS -->|"mongodb driver"| MongoDB
    NextJS -->|"AWS SDK v3"| RustFS
    NextJS -->|"nodemailer"| MailHog
```

---

## Funcionalidades Implementadas

### Magic Link Authentication
Flujo de autenticación sin contraseña. El usuario introduce su email y recibe un enlace temporal (JWT 15 min) vía MailHog. Al hacer clic, se valida el token, se marca como usado y se emite un JWT de sesión de 7 días almacenado en `localStorage` (`sede_token`). No se usan cookies en ningún punto.

### Gestión de Registros (Instancias Generales)
Los administrados pueden cumplimentar el formulario de instancia general con datos del solicitante, exposición, solicitud y ficheros adjuntos. Los ficheros se suben a un bucket S3/MinIO (Rustfs). Cada registro recibe un número correlativo automático (`REG-YYYY-NNNNN`). Los funcionarios ven todos los registros con filtrado por estado (`presentado`, `en_tramite`, `resuelto`).

### Expedientes y Actuaciones
Los funcionarios pueden crear expedientes vinculados a registros (`EXP-YYYY-NNNNN`) e ir añadiendo actuaciones con fecha y texto libre. La vista de detalle muestra el historial completo de actuaciones ordenado cronológicamente.

### Personalización SaaS de la Sede
Cada ayuntamiento tiene su propio `ConfigSede` (slug, nombre, color de acento, texto de bienvenida, email, dirección, teléfono). Los funcionarios con acceso pueden actualizar la configuración desde `/admin/sede`.

---

## Estructura del Proyecto

```
app/
  page.tsx                              # Home pública (personalizable por ayuntamiento)
  login/page.tsx                        # Formulario de email para magic link
  auth/verify/page.tsx                  # Verificación del magic link
  dashboard/page.tsx                    # Panel del administrado
  instancia/nueva/page.tsx              # Formulario de instancia general
  mis-registros/page.tsx                # Lista de registros del administrado
  mis-registros/[id]/page.tsx           # Detalle de un registro
  funcionario/registros/page.tsx        # Tabla de todos los registros (funcionario)
  funcionario/registros/[id]/page.tsx   # Detalle del registro con acción crear expediente
  funcionario/expedientes/page.tsx      # Lista de expedientes
  funcionario/expedientes/[id]/page.tsx # Detalle del expediente
  funcionario/expedientes/[id]/actuacion/page.tsx  # Añadir actuación
  admin/sede/page.tsx                   # Configuración SaaS de la sede
  api/auth/magic-link/route.ts          # POST — genera y envía el magic link
  api/auth/verify/route.ts              # GET  — valida token y devuelve JWT de sesión
  api/registros/route.ts                # GET (lista) / POST (crear) registros
  api/registros/[id]/route.ts           # GET detalle de un registro
  api/expedientes/route.ts              # GET (lista) / POST (crear) expedientes
  api/expedientes/[id]/route.ts         # GET detalle de un expediente
  api/expedientes/[id]/actuaciones/route.ts  # POST — añadir actuación
  api/upload/route.ts                   # POST — subir fichero a S3/MinIO
  api/sede/route.ts                     # GET / PUT configuración de la sede
  layout.tsx                            # Root layout (GlobalContext provider)
  globals.css                           # Estilos globales Tailwind v4

components/
  ui/Button.tsx                         # Botón reutilizable con variantes
  ui/Input.tsx                          # Input estilizado tema oscuro
  ui/Textarea.tsx                       # Textarea reutilizable
  ui/Badge.tsx                          # Badge de estado (presentado / en_tramite / resuelto)
  ui/Card.tsx                           # Tarjeta contenedora
  layout/Header.tsx                     # Cabecera con navegación según rol
  layout/Footer.tsx                     # Pie de página de la sede

lib/
  db.ts                                 # Singleton MongoClient (evita conexiones múltiples en dev)
  types.ts                              # Interfaces TypeScript: User, Registro, Expediente, ConfigSede…
  auth.ts                               # Helpers JWT: sign, verify, extractFromHeader
  mail.ts                               # Cliente MailHog vía Nodemailer
  s3.ts                                 # Cliente AWS SDK v3 apuntando a MinIO/Rustfs
  registro-numero.ts                    # Generador de números de registro correlativos
  expediente-codigo.ts                  # Generador de códigos de expediente correlativos

context/
  GlobalContext.tsx                     # Estado global: authUser, configSede, loading
```

---

## Patrones y Arquitectura

| Patrón | Implementación |
|---|---|
| **Singleton** | `lib/db.ts` — un único `MongoClient` compartido durante el ciclo de vida del proceso Next.js |
| **Repository / Data Layer** | Las API routes encapsulan todo acceso a MongoDB; los Server Components y Client Components nunca acceden directamente a la base de datos desde el cliente |
| **Context + Custom Hooks** | `GlobalContext.tsx` centraliza el estado de autenticación y configuración de la sede; `useAuth` / `useSede` exponen accesos tipados |
| **JWT Stateless Auth** | Magic token (15 min) + JWT de sesión (7 días) firmados con `jsonwebtoken`; sin cookies, sin sesiones servidor |
| **Role-Based Access Control** | El payload JWT incluye `role` (`administrado` | `funcionario`); cada layout/page valida el rol antes de renderizar |
| **SaaS Multi-tenant** | `ConfigSede` con `slug` único por ayuntamiento; la home y el header se personalizan en tiempo de ejecución |

---

## Cómo Funciona

El usuario solicita un magic link en `/login`. La API genera un JWT de corta duración, lo persiste en MongoDB y lo envía por email (MailHog en desarrollo). Al hacer clic en el enlace, `/auth/verify` valida el token, emite un JWT de sesión y lo guarda en `localStorage`. A partir de ese momento, todas las peticiones a las API routes incluyen `Authorization: Bearer <token>` y el backend extrae el `userId` y `role` del payload para autorizar cada operación.

```typescript
// lib/auth.ts — flujo típico en una API route protegida
import { extractFromHeader, verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const payload = extractFromHeader(request.headers.get('Authorization'));
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 });
  if (payload.role !== 'funcionario') return Response.json({ error: 'Prohibido' }, { status: 403 });
  // ... lógica de negocio
}
```

---

## Puesta en Marcha

### Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20 LTS |
| Docker & Docker Compose | Para MongoDB, MailHog y MinIO/Rustfs |

### Servicios Docker necesarios

```yaml
# Levantar MongoDB, MailHog y MinIO
docker run -d -p 27017:27017 mongo:7
docker run -d -p 8025:8025 -p 1025:1025 mailhog/mailhog
docker run -d -p 10000:9000 -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin1234 minio/minio server /data
```

### Instalación

```bash
git clone https://github.com/Jorgeaapaz/MISEIA_1-4-150-ayuntamientos.git
cd MISEIA_1-4-150-ayuntamientos
npm install
```

### Variables de entorno

```bash
cp .env.example .env.local
# Editar .env.local con los valores reales
```

El archivo `.env.example` en la raíz contiene todas las variables necesarias con valores de ejemplo. Las variables más importantes:

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | Cadena de conexión a MongoDB |
| `JWT_SECRET` | Secreto de firma JWT (mínimo 32 chars) |
| `AWS_URL` | URL de RustFS/MinIO (S3-compatible) |
| `NEXT_PUBLIC_API_URL` | URL base de la app |

### Arrancar en desarrollo

```bash
npm run dev
# Aplicación disponible en http://localhost:3000
# MailHog UI disponible en http://localhost:8025
```

### Build de producción

```bash
npm run build
npm start
```

---

## Testing

```bash
# Tests unitarios (Jest) — lib/auth, registro-numero, expediente-codigo
npm test

# Tests con cobertura
npm run test:coverage

# Tests E2E (Playwright) — requiere app corriendo en localhost:3000
npm run test:e2e
```

---

## Flujo de Ejemplo

### 1. Administrado presenta una instancia

```
POST /api/auth/magic-link   { email: "ciudadano@example.com" }
→ Email con enlace en MailHog (http://localhost:8025)

GET  /api/auth/verify?token=<JWT>
→ { token: "<JWT_sesion_7dias>" }  →  guardado en localStorage

POST /api/registros
  Authorization: Bearer <JWT_sesion>
  Body: { nombreSolicitante, direccionFiscal, expone, solicita, adjuntos: [] }
→ { _id: "...", numero: "REG-2026-00001", estado: "presentado" }
```

### 2. Funcionario crea expediente y añade actuación

```
GET  /api/registros          Authorization: Bearer <JWT_funcionario>
→ [ { numero: "REG-2026-00001", estado: "presentado", ... }, ... ]

POST /api/expedientes
  Body: { registroId, tipoExpediente: "Licencia de obras" }
→ { codigo: "EXP-2026-00001" }

POST /api/expedientes/EXP-2026-00001/actuaciones
  Body: { texto: "Solicitud recibida y en revisión técnica." }
→ { _id: "...", fecha: "2026-05-20T10:00:00Z", texto: "..." }
```

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| Base de datos | MongoDB 7 |
| Almacenamiento ficheros | MinIO / Rustfs (compatible S3) vía AWS SDK v3 |
| Email (dev) | MailHog + Nodemailer |
| Autenticación | JWT (`jsonwebtoken`) — Magic Link, sin cookies |
| Lenguaje | TypeScript 5 |

---

## Decisiones Técnicas

Decisiones clave con trade-offs reales. Ver [`docs/decisions/`](docs/decisions/) para los ADRs completos.

| Decisión | Elegido | Alternativa | Trade-off Principal |
|---|---|---|---|
| Auth storage | JWT en `localStorage` | Cookies `httpOnly` | XSS risk vs CSRF risk; cookies requieren CSRF tokens adicionales |
| Base de datos | MongoDB 7 | PostgreSQL | Flexibilidad de esquema con arrays embebidos vs integridad referencial nativa |
| Autenticación | Magic Link (JWT 15min) | Password + bcrypt | Sin gestión de contraseñas vs dependencia del email del usuario |
| Router Next.js | App Router | Pages Router | Server Components + layouts anidados vs mayor madurez y más ejemplos en comunidad |

---

## Uso de IA y Revisión Crítica

Este proyecto se desarrolló con asistencia de **Claude Code (claude-sonnet-4-6)**. A continuación se documenta qué se revisó y modificó respecto a los borradores generados:

### Correcciones aplicadas
- **Doble verificación del magic link**: el borrador inicial llamaba a `verifyToken` dos veces en la page `/auth/verify` (una en el componente y otra en la API route). Se eliminó la verificación redundante en el componente, dejando solo la de la API route.
- **Configuración del cliente S3 para RustFS**: el borrador usaba la configuración estándar de AWS S3; se corrigió para apuntar al endpoint local de RustFS (`forcePathStyle: true`, `endpoint: AWS_URL`).
- **Tipos TypeScript en API routes**: varios borradores usaban `any` en los handlers. Se sustituyeron por los tipos correctos de `lib/types.ts` y se añadió `extractTokenFromHeader` tipado.
- **Auto-creación del bucket S3**: se añadió lógica de verificación y creación automática del bucket si no existe al iniciar, corrección no presente en el borrador original.

### Lo que se validó manualmente
- Flujo completo de magic link end-to-end con MailHog
- Subida de ficheros a RustFS y verificación en la consola de MinIO
- Transición de estados de registros (presentado → en_tramite → resuelto)

---

## Deploy a Producción

**URL pública:** https://ayuntamientos.deviaaps.com

La app se despliega en una VM de Google Cloud (GCI) usando Docker + Traefik. El pipeline de GitHub Actions gestiona el deploy automático en cada push a `master`.

### Primer deploy manual

```bash
# Conectar a la VM
ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186

# En la VM
git clone https://github.com/Jorgeaapaz/MISEIA_1-4-150-ayuntamientos.git ~/MISEIA150_ayuntamientos
cd ~/MISEIA150_ayuntamientos

# Copiar el archivo de variables de producción (desde local)
# scp env.production gcvmuser@34.174.56.186:~/MISEIA150_ayuntamientos/

# Arrancar con Docker
docker compose -f docker-compose.prod.yml up -d --build
```

### Secrets necesarios en GitHub Actions

Configurar en el repositorio (Settings > Secrets > Actions):
- `SSH_PRIVATE_KEY` — clave privada SSH para conectar a la VM
- `JWT_SECRET_PROD` — secreto JWT de producción (mínimo 32 chars)
- `MONGODB_URI_PROD` — `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`
- `AWS_USERNAME_PROD`, `AWS_PASSWORD_PROD`, `AWS_URL_PROD` — credenciales RustFS

---

## Repositorios

- **GitHub:** https://github.com/Jorgeaapaz/MISEIA_1-4-150-ayuntamientos
- **GitLab:** https://gitlab.codecrypto.academy/jorgeaapaz/MISEIA_1-4-150-ayuntamientos

---

## Updates — 2026-06-27

### Testing
- Added **Jest** unit tests (`__tests__/unit/`) for `lib/auth.ts`, `lib/registro-numero.ts`, `lib/expediente-codigo.ts` — 22 tests, all passing
- Added **Playwright** E2E config (`playwright.config.ts`) and smoke tests (`__tests__/e2e/auth.spec.ts`)
- Added `npm test`, `npm run test:coverage`, `npm run test:e2e` scripts to `package.json`
- Added `jest.config.ts` with ts-jest preset

### CI/CD
- Added **GitHub Actions** workflow (`.github/workflows/ci-deploy.yml`): lint → test → build → deploy to GCI VM on push to `master`
- Added **GitLab CI** pipeline (`.gitlab-ci.yml`): lint → test → build (NODE_ENV=production only here) → deploy

### Infrastructure & Deploy
- Added **Dockerfile** (multi-stage: deps → builder → runner with standalone output)
- Added `docker-compose.prod.yml` for GCI VM deployment behind Traefik (`ayuntamientos.deviaaps.com`)
- Added `env.production` template (excluded from git) with production environment variables
- Updated `next.config.ts` with `output: 'standalone'` for optimized Docker builds

### Environment
- Added `.env.example` with all required variables (placeholder values, safe to commit)
- Fixed `.gitignore` to allow `.env.example` while blocking `.env.local` and `env.production`

### UI Components
- Added `components/ui/Skeleton.tsx` — animated skeleton loader (SkeletonCard, SkeletonList, SkeletonTableRow)
- Added `components/ui/EmptyState.tsx` — empty state with icon, title, description, optional action
- Added `components/ui/ErrorState.tsx` — error display with retry callback
- Updated `app/mis-registros/page.tsx` to use Skeleton on load, ErrorState with retry, EmptyState when no records

### Documentation
- Added `docs/architecture.md` with 4 Mermaid diagrams: component overview, auth sequence, instancia sequence, role/access model
- Added `docs/decisions/ADR-001` through `ADR-004`: JWT/localStorage, MongoDB, Magic Link, App Router — each with context, decision, trade-offs, and rejected alternatives
- Updated README with Architecture section (Mermaid diagram), Decisiones Técnicas table, Testing section, Deploy a Producción section, and Uso de IA y Revisión Crítica section
- Added `docs/compliance/`: compliance_report.md, pert_compliance_plan.md, and 8 individual disciplined prompt files (`001`–`008`)

### Bug Fixes
- Fixed `eslint` errors in `context/GlobalContext.tsx`, `app/admin/sede/page.tsx`, `app/auth/verify/page.tsx` (react-hooks/set-state-in-effect)
