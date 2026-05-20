# Retrospectiva de Sesión — 23 de abril de 2026
### Sede Electrónica — Implementación completa del sistema SaaS

---

## Resumen / Overview

Sesión de implementación completa del sistema **Sede Electrónica**, un SaaS de administración pública española para ayuntamientos. Se partió de una especificación técnica generada en AGENTS.md y se implementó la totalidad del sistema: base de datos, autenticación, API REST, páginas de usuario y de funcionario, y configuración SaaS.

El build de producción (`npm run build`) finaliza con **exit code 0** y 22 rutas compiladas sin errores TypeScript.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.4 (App Router, Turbopack) |
| UI | React 19.2.4 + Tailwind CSS 4 |
| Lenguaje | TypeScript 5 |
| Base de datos | MongoDB (driver nativo, sin Mongoose) |
| Autenticación | Magic Link con JWT (jsonwebtoken) |
| Email | MailHog vía Nodemailer |
| Almacenamiento | Rustfs/MinIO (compatible S3, `@aws-sdk/client-s3`) |
| Estado global | React Context (`GlobalContext`) |

---

## Proceso de instalación / Installation

```bash
# 1. Dependencias de producción
npm install mongodb jsonwebtoken nodemailer @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# 2. Dependencias de desarrollo (tipos)
npm install -D @types/jsonwebtoken @types/nodemailer
```

> **Nota Windows / PowerShell:** El uso de `;` como separador de comandos en PowerShell causó errores de exit code. Siempre usar `cmd /c "..."` para encadenar comandos con `&&`.

---

## Archivos creados

### Librería (`lib/`)
| Archivo | Propósito |
|---------|-----------|
| `lib/types.ts` | Todas las interfaces TypeScript (`User`, `MagicToken`, `Registro`, `Adjunto`, `Expediente`, `Actuacion`, `ConfigSede`, payloads JWT) |
| `lib/db.ts` | Singleton `MongoClient` con patrón `global._mongoClientPromise` para hot-reload seguro en dev |
| `lib/auth.ts` | Helpers JWT: `signMagicToken`, `signSessionToken`, `verifyMagicToken`, `verifySessionToken`, `extractTokenFromHeader` |
| `lib/mail.ts` | Cliente Nodemailer para MailHog: `sendMagicLinkEmail(email, token)` |
| `lib/s3.ts` | Cliente AWS SDK v3 apuntando a Rustfs: `uploadFile`, `getPresignedUrl`, `deleteFile`. `forcePathStyle: true` |
| `lib/registro-numero.ts` | Generador correlativo `REG-YYYY-NNNNN` usando colección `counters` con `findOneAndUpdate` + `$inc` |
| `lib/expediente-codigo.ts` | Generador correlativo `EXP-YYYY-NNNNN` con el mismo patrón |

### Contexto y hooks
| Archivo | Propósito |
|---------|-----------|
| `context/GlobalContext.tsx` | Estado global: `user`, `token`, `configSede`, `loading`. Métodos: `setAuth`, `logout`, `refreshSede`. Lee `localStorage.sede_token` al montar. |
| `hooks/useAuth.ts` | `useAuth()` y `useRequireAuth(role?)` — redirige si no está autenticado o rol incorrecto |
| `hooks/useSede.ts` | `useSede()` — acceso a la config de la sede desde el contexto |

### API Routes (`app/api/`)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/auth/magic-link` | POST | Genera JWT de 15 min, guarda en `magic_tokens`, envía email con MailHog |
| `/api/auth/verify` | GET | Valida token, marca `used: true`, hace upsert del usuario, devuelve JWT de sesión (7 días) |
| `/api/registros` | GET / POST | GET: todos (funcionario) o propios (administrado). POST: crea registro con número correlativo |
| `/api/registros/[id]` | GET | Detalle de registro con control de acceso por rol |
| `/api/upload` | POST | Sube fichero a S3/Rustfs (límite 10 MB, tipos permitidos: pdf, jpg, png, gif, webp, doc, docx). Devuelve objeto `Adjunto` |
| `/api/expedientes` | GET / POST | Sólo funcionario. POST crea expediente y actualiza `registro.estado` a `en_tramite` |
| `/api/expedientes/[id]` | GET | Detalle del expediente (funcionario) |
| `/api/expedientes/[id]/actuaciones` | POST | Añade actuación al expediente con `$push` |
| `/api/sede` | GET / PUT | GET público: config de la sede (con defaults). PUT: sólo funcionario |

### Páginas (`app/`)
| Ruta | Rol | Descripción |
|------|-----|-------------|
| `/` | Público | Home con hero, grid de fondo, features, CTAs según rol |
| `/login` | Público | Formulario de email → estado "enlace enviado" |
| `/auth/verify` | Público | Verifica magic link, redirige según rol |
| `/dashboard` | Administrado | Panel de acceso rápido |
| `/instancia/nueva` | Administrado | Formulario completo con subida de adjuntos |
| `/mis-registros` | Administrado | Lista de registros con badges de estado |
| `/mis-registros/[id]` | Administrado | Detalle de registro |
| `/funcionario/registros` | Funcionario | Tabla de todos los registros con filtro por estado |
| `/funcionario/registros/[id]` | Funcionario | Detalle + formulario inline para crear expediente |
| `/funcionario/expedientes` | Funcionario | Lista de expedientes |
| `/funcionario/expedientes/[id]` | Funcionario | Detalle con lista de actuaciones (orden inverso) |
| `/funcionario/expedientes/[id]/actuacion` | Funcionario | Formulario para añadir actuación |
| `/admin/sede` | Funcionario | Editor de configuración SaaS (nombre, color, bienvenida, contacto) |

### Componentes UI (`components/`)
| Componente | Descripción |
|-----------|-------------|
| `ui/Button.tsx` | Variants: primary/secondary/ghost/danger. Sizes: sm/md/lg. Estado loading. |
| `ui/Input.tsx` | Con label, error, hint. `forwardRef`. |
| `ui/Textarea.tsx` | Con label, error, hint. `forwardRef`. `resize-y`. |
| `ui/Badge.tsx` | Variants + helper `estadoBadge(estado)` para colorear estados de registro |
| `ui/Card.tsx` | `Card` (con `hover` prop) + `CardHeader` (con `action` slot) |
| `layout/Header.tsx` | Sticky, nav adaptado a rol, logo con color de acento, logout |
| `layout/Footer.tsx` | Datos de contacto de la sede |

---

## Variables de entorno (`.env.local`)

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=sede_electronica

AWS_USERNAME=minioadmin
AWS_PASSWORD=minioadmin1234
AWS_REGION=us-east-1
AWS_URL=http://localhost:10000
AWS_BUCKET=sede-electronica

MAILHOG_HOST=localhost
MAIL_PORT=1027

NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000

JWT_SECRET=magik-link-dev-secret-2026
```

---

## Levantar la aplicación / Running the App

```bash
# Desarrollo
npm run dev

# Producción (build + start)
npm run build
npm run start
```

Servicios externos requeridos (Docker):
```bash
# MongoDB — puerto 27017
# MailHog — puerto 1025 (SMTP) y 8025 (UI web)
# Rustfs/MinIO — puerto 10000
```

---

## URLs de prueba

| Servicio | URL |
|---------|-----|
| Aplicación (dev) | http://localhost:3000 |
| Aplicación (prod) | http://localhost:3000 |
| MailHog UI (ver emails) | http://localhost:8025 |
| MinIO/Rustfs console | http://localhost:10000 |

---

## Patrones clave de la implementación

### Autenticación sin cookies
- JWT de sesión en `localStorage` con clave `sede_token`
- Todas las API routes protegidas leen `Authorization: Bearer <token>`
- **No se usan cookies en ningún punto**

### Rutas dinámicas Next.js 16
```typescript
// Los params son Promise en Next.js 16
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### MongoDB counter para números correlativos
```typescript
const counter = await db.collection('counters').findOneAndUpdate(
  { _id: `registro-${year}` as unknown as ObjectId },
  { $inc: { seq: 1 }, $setOnInsert: { seq: 0 } },
  { upsert: true, returnDocument: 'after' }
);
```

### `useSearchParams` requiere Suspense
```tsx
// En Next.js 16, cualquier componente que use useSearchParams
// debe estar envuelto en <Suspense>
export default function Page() {
  return <Suspense fallback={<Spinner />}><InnerContent /></Suspense>;
}
```

---

## Problemas encontrados / Problems & Solutions

| Problema | Solución |
|---------|----------|
| PowerShell bloqueaba `npm` con política de ejecución | Usar siempre `cmd /c "..."` como prefijo en PowerShell |
| `app/page.tsx` y `app/layout.tsx` tenían boilerplate de Next.js concatenado al final del código personalizado | Se creó un script Node temporal `fix-page.js` para truncar el archivo en el primer `}` standalone después de la línea 100 |
| Build falla: `useSearchParams() should be wrapped in a suspense boundary` en `/auth/verify` | Separar en `VerifyContent` (usa `useSearchParams`) y `VerifyPage` (exporta con `<Suspense>`) |
| Build falla: Turbopack parsing error en `app/page.tsx` línea 148 | Boilerplate de Next.js mezclado con el código — arreglo con script de truncado |
| `lib/s3.ts` importado en un Client Component causaría error de módulo servidor | Se eliminó el import de `getPresignedUrl` en `app/mis-registros/[id]/page.tsx` |
| CSS warning: `@import` debe preceder a otras reglas | Mover la fuente de `globals.css` a un `<link>` en el `<head>` de `layout.tsx` |

---

## Seed de datos de prueba

### Ejecutar el seed

```bash
node --env-file=.env.local scripts/seed.mjs
```

> Limpia todas las colecciones y regenera los datos desde cero. Seguro ejecutarlo N veces.

### Datos creados por el seed

| Colección | Contenido |
|-----------|-----------|
| `config_sede` | Slug `ayto-demo`, color `#3B82F6`, datos de contacto del Ayuntamiento de Demo |
| `users` | `maria@demo.es` (administrado), `carlos@demo.es` (administrado), `funcionario@ayto-demo.es` (funcionario) |
| `registros` | 4 registros — REG-2026-00001 (`en_tramite`), 00002 (`presentado`), 00003 (`resuelto`), 00004 (`presentado`) |
| `expedientes` | EXP-2026-00001 (Licencia de obras menores, 3 actuaciones), EXP-2026-00002 (Terraza de veladores, 2 actuaciones) |
| `counters` | `registro-2026: seq=4`, `expediente-2026: seq=2` — el siguiente número será correlativo |

### Acceso rápido sin magic link

Pega uno de estos tokens en la consola del navegador y recarga:

```js
// Como administrado (maria@demo.es)
localStorage.setItem('sede_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWVhNmJhY2MzZTQ5Nzk2NmMzYmQ2OGEiLCJlbWFpbCI6Im1hcmlhQGRlbW8uZXMiLCJyb2xlIjoiYWRtaW5pc3RyYWRvIiwiaWF0IjoxNzc2OTcwNjY4LCJleHAiOjE3Nzc1NzU0Njh9.LJ3O1f2XGGnyNMjUNAbPVlCGkuL9ds8P1tkgFYGlTuM')

// Como funcionario (funcionario@ayto-demo.es)
localStorage.setItem('sede_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWVhNmJhY2MzZTQ5Nzk2NmMzYmQ2OGIiLCJlbWFpbCI6ImZ1bmNpb25hcmlvQGF5dG8tZGVtby5lcyIsInJvbGUiOiJmdW5jaW9uYXJpbyIsImlhdCI6MTc3Njk3MDY2OCwiZXhwIjoxNzc3NTc1NDY4fQ.JSZcVhn1Kcc-w-2nNnD4SkqMBJTONvvCjfUmWIpyBIo')
```

> Los tokens del seed tienen validez de 7 días desde la última ejecución. Si expiran, vuelve a ejecutar `seed.mjs` y copia los nuevos tokens que imprime por consola.

### Fix CSS: @import de Google Fonts

El `@import` de Google Fonts en `globals.css` causaba un error de parsing en Tailwind CSS 4 (`@import rules must precede all other rules`). Tailwind genera sus reglas primero y el `@import` quedaba en la línea ~1121 del CSS compilado.

**Solución:** se eliminó el `@import` de `globals.css` y se cargó la fuente como `<link>` en el `<head>` de `app/layout.tsx`:

```tsx
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</head>
```

---

## Resultado del build final

```
✓ Compiled successfully in 15.6s
✓ Finished TypeScript in 4.4s
✓ Collecting page data using 11 workers in 12.7s
✓ Generating static pages using 11 workers (18/18) in 3.2s
✓ Finalizing page optimization in 219ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /admin/sede
├ ƒ /api/auth/magic-link
├ ƒ /api/auth/verify
├ ƒ /api/expedientes
├ ƒ /api/expedientes/[id]
├ ƒ /api/expedientes/[id]/actuaciones
├ ƒ /api/registros
├ ƒ /api/registros/[id]
├ ƒ /api/sede
├ ƒ /api/upload
├ ○ /auth/verify
├ ○ /dashboard
├ ○ /funcionario/expedientes
├ ƒ /funcionario/expedientes/[id]
├ ƒ /funcionario/expedientes/[id]/actuacion
├ ○ /funcionario/registros
├ ƒ /funcionario/registros/[id]
├ ○ /instancia/nueva
├ ○ /login
├ ○ /mis-registros
└ ƒ /mis-registros/[id]

○ (Static)  prerendered as static content
ƒ (Dynamic) server-rendered on demand
```

**Exit code: 0. Cero errores TypeScript.**
