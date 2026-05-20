<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Sede Electrónica — Especificación del Sistema

## Descripción General

Sistema SaaS de sede electrónica para la administración pública española. Permite la interacción entre **contribuyentes/administrados** y la **administración**. Cada instancia (ayuntamiento) puede personalizar los datos de su home page.

---

## Dominio y Roles

### Roles
| Rol | Descripción |
|---|---|
| `administrado` | Ciudadano/contribuyente. Puede presentar instancias y consultar sus registros previos. |
| `funcionario` | Empleado público. Puede ver todos los registros presentados, crear expedientes y añadir actuaciones. |

El rol se almacena en el documento del usuario en MongoDB y se incluye en el JWT payload.

---

## Modelos de Datos (`lib/types.ts`)

### User
```typescript
interface User {
  _id: ObjectId;
  email: string;
  name: string;
  role: 'administrado' | 'funcionario';
  createdAt: Date;
}
```

### MagicToken
```typescript
interface MagicToken {
  _id: ObjectId;
  email: string;
  token: string;       // JWT de corta duración (15 min)
  used: boolean;
  createdAt: Date;
  expiresAt: Date;
}
```

### Registro (Instancia General)
```typescript
interface Registro {
  _id: ObjectId;
  numero: string;         // Número de registro generado automáticamente (ej. REG-2026-00001)
  fechaEntrada: Date;
  userId: ObjectId;       // Referencia al administrado
  // Datos del solicitante
  nombreSolicitante: string;
  direccionFiscal: string;
  nombreRepresentante?: string;
  // Contenido
  expone: string;         // Texto libre: qué expone el solicitante
  solicita: string;       // Texto libre: qué solicita
  // Ficheros adjuntos (almacenados en S3/Rustfs)
  adjuntos: Adjunto[];
  estado: 'presentado' | 'en_tramite' | 'resuelto';
}

interface Adjunto {
  nombre: string;
  s3Key: string;
  mimeType: string;
  tamaño: number;         // en bytes
}
```

### Expediente
```typescript
interface Expediente {
  _id: ObjectId;
  codigo: string;         // Código único (ej. EXP-2026-00001)
  fechaCreacion: Date;
  registroId: ObjectId;   // Registro que origina el expediente
  userId: ObjectId;       // Administrado sujeto
  tipoExpediente: string; // Ej: "Licencia de obras", "Reclamación", etc.
  funcionarioId: ObjectId;
  actuaciones: Actuacion[];
}

interface Actuacion {
  _id: ObjectId;
  fecha: Date;
  texto: string;
  funcionarioId: ObjectId;
}
```

### ConfigSede (SaaS — personalización por ayuntamiento)
```typescript
interface ConfigSede {
  _id: ObjectId;
  slug: string;           // Identificador único del ayuntamiento (ej. "ayto-madrid")
  nombreAyuntamiento: string;
  logoUrl?: string;
  colorAccent: string;    // Color primario de la sede (hex)
  bienvenida: string;     // Texto de bienvenida en la home
  emailContacto: string;
  direccion: string;
  telefono: string;
}
```

---

## Flujo de Autenticación — Magic Link

1. El usuario introduce su email en `/login`.
2. La API route `POST /api/auth/magic-link` genera un JWT con payload `{ email, exp: +15min }`, lo guarda en la colección `magic_tokens` y envía un email via MailHog con el enlace `http://localhost:3000/auth/verify?token=<JWT>`.
3. El usuario hace clic en el enlace. La page `/auth/verify` llama a `GET /api/auth/verify?token=<JWT>`.
4. El backend valida el JWT, comprueba que el token no ha sido usado, marca `used: true` y devuelve un **JWT de sesión** de larga duración (7 días) con payload `{ userId, email, role }`.
5. El frontend almacena el JWT de sesión en **localStorage** (clave: `sede_token`) y actualiza el `GlobalContext`.
6. **NO SE USAN COOKIES** en ningún punto del flujo.
7. Todas las API routes protegidas leen el header `Authorization: Bearer <token>` y validan el JWT.

---

## Páginas y Rutas

### Públicas
| Ruta | Descripción |
|---|---|
| `/` | Home de la sede (personalizable por ayuntamiento) |
| `/login` | Formulario de email para solicitar magic link |
| `/auth/verify` | Página de verificación del magic link |

### Administrado (requiere rol `administrado`)
| Ruta | Descripción |
|---|---|
| `/dashboard` | Resumen y acceso rápido |
| `/instancia/nueva` | Formulario instancia general |
| `/mis-registros` | Lista de registros presentados por el usuario |
| `/mis-registros/[id]` | Detalle de un registro |

### Funcionario (requiere rol `funcionario`)
| Ruta | Descripción |
|---|---|
| `/funcionario/registros` | Tabla con todos los registros de todos los administrados |
| `/funcionario/registros/[id]` | Detalle del registro con opción de crear expediente |
| `/funcionario/expedientes` | Lista de todos los expedientes |
| `/funcionario/expedientes/[id]` | Detalle del expediente con actuaciones |
| `/funcionario/expedientes/[id]/actuacion` | Añadir nueva actuación |

### Admin SaaS (funcionario con permiso extra o superadmin)
| Ruta | Descripción |
|---|---|
| `/admin/sede` | Configuración de la sede electrónica (nombre, colores, textos) |

---

## API Routes (`app/api/`)

### Auth
- `POST /api/auth/magic-link` — genera y envía el magic link
- `GET  /api/auth/verify?token=` — verifica el token y devuelve JWT de sesión

### Registros
- `POST /api/registros` — crear nuevo registro (administrado)
- `GET  /api/registros` — listar registros del usuario autenticado (administrado) o todos (funcionario)
- `GET  /api/registros/[id]` — detalle de un registro

### Ficheros
- `POST /api/upload` — subir fichero a S3/Rustfs, devuelve `{ s3Key, url }`

### Expedientes
- `POST /api/expedientes` — crear expediente desde un registro (funcionario)
- `GET  /api/expedientes` — listar expedientes (funcionario)
- `GET  /api/expedientes/[id]` — detalle de expediente
- `POST /api/expedientes/[id]/actuaciones` — añadir actuación (funcionario)

### Sede (SaaS)
- `GET  /api/sede` — obtener configuración de la sede activa
- `PUT  /api/sede` — actualizar configuración (funcionario/admin)

---

## Estructura de Carpetas

```
app/
  (public)/
    page.tsx               # Home
    login/page.tsx
    auth/verify/page.tsx
  (administrado)/
    dashboard/page.tsx
    instancia/nueva/page.tsx
    mis-registros/
      page.tsx
      [id]/page.tsx
  (funcionario)/
    funcionario/
      registros/
        page.tsx
        [id]/page.tsx
      expedientes/
        page.tsx
        [id]/page.tsx
        [id]/actuacion/page.tsx
  admin/
    sede/page.tsx
  api/
    auth/
      magic-link/route.ts
      verify/route.ts
    registros/
      route.ts
      [id]/route.ts
    upload/route.ts
    expedientes/
      route.ts
      [id]/route.ts
      [id]/actuaciones/route.ts
    sede/route.ts
  globals.css
  layout.tsx
  page.tsx

components/
  ui/                      # Componentes reutilizables (Button, Input, Badge, Modal, etc.)
  layout/                  # Header, Sidebar, Footer
  forms/                   # FormInstancia, FormExpediente, FormActuacion
  registros/               # RegistroCard, RegistroTable
  expedientes/             # ExpedienteCard, ActuacionList

lib/
  db.ts                    # Singleton MongoClient
  types.ts                 # Todas las interfaces TypeScript
  auth.ts                  # Helpers JWT (sign, verify, extractFromHeader)
  mail.ts                  # Cliente MailHog (nodemailer)
  s3.ts                    # Cliente AWS S3 apuntando a Rustfs
  registro-numero.ts       # Generador de números de registro correlativos
  expediente-codigo.ts     # Generador de códigos de expediente

context/
  GlobalContext.tsx        # AuthUser, configSede, loading — NO prop drilling

hooks/
  useAuth.ts               # Helpers para leer el GlobalContext de auth
  useSede.ts               # Helpers para leer la config de la sede
```

---

## Variables de Entorno (`.env.local`)

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=sede_electronica

# AWS S3 / Rustfs (docker en puerto 10000)
AWS_USERNAME=minioadmin
AWS_PASSWORD=minioadmin1234
AWS_REGION=us-east-1
AWS_URL=http://localhost:10000
AWS_BUCKET=sede-electronica

# Email — MailHog (docker)
MAILHOG_HOST=localhost
MAIL_PORT=1027

# Next.js
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000

# JWT
JWT_SECRET=magik-link-dev-secret-2026
```

---

## Design Guidelines

- **Tema oscuro** en toda la aplicación.
- **Color de acento único**: definido en `ConfigSede.colorAccent`; por defecto `#3B82F6` (azul).
- Tipografía bold y clara, CTAs visibles.
- Sin imágenes; usar iconos CSS o SVG inline.
- Layouts **mobile-responsive** con Tailwind CSS.
- Aplicar el skill `frontend-design` en cada página y componente nuevo.

---

## Coding Rules

1. Leer los docs de Next.js en `node_modules/next/dist/docs` antes de usar cualquier API.
2. Todo acceso a la base de datos pasa por `lib/db.ts` — nunca crear un `MongoClient` inline.
3. No usar `any` — todas las interfaces en `lib/types.ts`.
4. Las API routes devuelven `{ error: string }` en caso de fallo con el HTTP status code adecuado.
5. Los server components obtienen datos directamente de MongoDB; los client components llaman a las API routes.
6. No usar `middleware.ts`; la protección de rutas se hace con un proxy/wrapper en cada layout o page.
7. Usar `GlobalContext` para el estado global; no hacer prop drilling.
8. El JWT de sesión se almacena en `localStorage` con la clave `sede_token`.
9. **NO USAR COOKIES** para autenticación ni sesión.

---

## Testing Rules

1. **Playwright** para pruebas E2E cubriendo: login magic link, presentar instancia, ver registros, crear expediente, añadir actuación.
2. **Jest** para pruebas unitarias de `lib/auth.ts`, `lib/registro-numero.ts`, `lib/expediente-codigo.ts`.
3. Escribir pruebas antes de implementar nuevas funcionalidades (TDD).
4. Configurar CI para ejecutar las pruebas automáticamente.

---

## Git & Repositorio

- Ramas por feature: `feat/auth-magic-link`, `feat/instancia-general`, `feat/expedientes`, etc.
- Commits siguiendo Conventional Commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.
- Merge a `main` solo cuando la feature esté completa y las pruebas pasen.

---

## Orden de Implementación Recomendado

1. `lib/db.ts`, `lib/types.ts` — base de datos y tipos
2. `lib/auth.ts`, `lib/mail.ts` — autenticación y email
3. `context/GlobalContext.tsx` — estado global
4. API routes de autenticación (`/api/auth/*`)
5. Páginas de login y verificación
6. `lib/s3.ts` + `POST /api/upload`
7. Formulario instancia general + API routes de registros
8. Vistas del administrado (`/mis-registros`)
9. Vistas del funcionario (registros, expedientes, actuaciones)
10. Configuración SaaS de la sede (`/admin/sede`)
11. `npm run build` al finalizar la codificación
12. Usa la skill `session retrospective` y crea la retrospectiva
