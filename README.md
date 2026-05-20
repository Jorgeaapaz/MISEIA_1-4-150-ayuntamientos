# Sede Electrónica — Ayuntamientos

Sistema **SaaS de sede electrónica** para la administración pública española, construido con **Next.js 16 / React 19 / TypeScript**. Permite a ciudadanos (administrados) presentar instancias generales y consultar sus registros, mientras que los funcionarios gestionan expedientes y actuaciones. Cada instancia (ayuntamiento) puede personalizar su propia sede (nombre, logo, color de acento, textos).

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

Crea `.env.local` en la raíz del proyecto:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=sede_electronica

AWS_USERNAME=minioadmin
AWS_PASSWORD=minioadmin1234
AWS_REGION=us-east-1
AWS_URL=http://localhost:10000
AWS_BUCKET=sede-electronica

MAILHOG_HOST=localhost
MAIL_PORT=1025

NEXT_PUBLIC_API_URL=http://localhost:3000
JWT_SECRET=magik-link-dev-secret-2026
```

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

## Repositorios

- **GitHub:** https://github.com/Jorgeaapaz/MISEIA_1-4-150-ayuntamientos
- **GitLab:** https://gitlab.codecrypto.academy/jorgeaapaz/MISEIA_1-4-150-ayuntamientos
