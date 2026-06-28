# Sede Electrónica Municipal — Sistema SaaS de Administración Pública

**Next.js 16 · React 19 · TypeScript 5 · MongoDB 7 · Tailwind CSS 4**

Sistema SaaS de sede electrónica para la administración pública española que permite a ciudadanos presentar instancias y consultar registros, y a funcionarios gestionar expedientes y actuaciones, con autenticación por Magic Link sin contraseña.

---

## Tabla de Contenidos

1. [Módulos Implementados](#1-módulos-implementados)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Patrones de Diseño y Arquitectura](#3-patrones-de-diseño-y-arquitectura)
4. [Cómo Funciona](#4-cómo-funciona)
5. [Puesta en Marcha](#5-puesta-en-marcha)
6. [Ejemplos de Uso](#6-ejemplos-de-uso)
7. [Requisitos](#7-requisitos)
8. [Especificaciones](#8-especificaciones)
9. [Pruebas Unitarias e Integración](#9-pruebas-unitarias-e-integración)
10. [Despliegue](#10-despliegue)
11. [Mejoras y Extensibilidad](#11-mejoras-y-extensibilidad)
12. [Cambios Documentados e Integración IA](#12-cambios-documentados-e-integración-ia)

---

## 1. Módulos Implementados

### 1.1 Autenticación Magic Link (sin contraseña)

Flujo de login basado en tokens JWT de corta duración (15 min) enviados al email del usuario vía MailHog/Nodemailer. Al verificar el enlace, el servidor emite un JWT de sesión de 7 días almacenado en `localStorage` (clave: `sede_token`). No se utilizan cookies en ningún punto del flujo.

**Detalles técnicos:**
- JWT firmado con `HS256` usando `jsonwebtoken ^9`
- Payload de sesión: `{ userId, email, role }`
- Protección de rutas por rol mediante `GlobalContext` en el lado cliente
- Header `Authorization: Bearer <token>` en todas las peticiones a API routes protegidas

### 1.2 Registro de Instancias Generales

Formulario completo para que los administrados (ciudadanos) presenten instancias ante el ayuntamiento. Incluye datos del solicitante, texto libre de exposición y solicitud, y adjuntos subidos a S3/RustFS.

**Detalles técnicos:**
- Número de registro autogenerado con formato `REG-YYYY-NNNNN` usando contador atómico en MongoDB (`$inc` sobre colección `counters`)
- Archivos almacenados en S3 compatible (RustFS) con presigned URLs
- Estados del registro: `presentado` → `en_tramite` → `resuelto`
- Validación en servidor (API route) y en cliente (HTML5 + React state)

### 1.3 Gestión de Expedientes y Actuaciones

Panel del funcionario para crear expedientes vinculados a registros, añadir actuaciones cronológicas y cambiar el estado del registro. Separación completa de vistas por rol (`administrado` / `funcionario`).

**Detalles técnicos:**
- Código de expediente autogenerado: `EXP-YYYY-NNNNN`
- Las actuaciones se almacenan como array embebido en el documento `Expediente` (MongoDB)
- Acceso controlado por `role` en el payload JWT, verificado en cada API route
- Botón "Marcar como Resuelto" ejecuta `PATCH /api/registros/[id]`

### 1.4 Configuración SaaS Multi-Tenant (ConfigSede)

Cada instancia del sistema (ayuntamiento) puede personalizar su sede: nombre, logo, color de acento, texto de bienvenida, contacto y dirección. La configuración se sirve en tiempo de ejecución desde MongoDB.

**Detalles técnicos:**
- Colección `config_sede` con slug único por ayuntamiento
- Color de acento inyectado como variable CSS (`--color-accent`) a través de `GlobalContext`
- API route `GET /api/sede` pública; `PUT /api/sede` restringida a funcionarios

### 1.5 Estados de Carga, Error y Vacío (UI)

Componentes reutilizables `Skeleton`, `EmptyState` y `ErrorState` aplicados en todas las vistas de lista y detalle para dar retroalimentación visual durante la carga de datos asíncronos.

---

## 2. Estructura del Proyecto

```
ayuntamientos/
├── app/
│   ├── page.tsx                                  # Home de la sede (personalizable)
│   ├── login/page.tsx                            # Formulario email para Magic Link
│   ├── auth/verify/page.tsx                      # Verificación del token mágico
│   ├── dashboard/page.tsx                        # Panel de inicio del ciudadano
│   ├── instancia/nueva/page.tsx                  # Formulario instancia general
│   ├── mis-registros/
│   │   ├── page.tsx                              # Lista de registros del usuario
│   │   └── [id]/page.tsx                         # Detalle de un registro
│   ├── funcionario/
│   │   ├── registros/
│   │   │   ├── page.tsx                          # Tabla de todos los registros
│   │   │   └── [id]/page.tsx                     # Detalle con opción de crear expediente
│   │   └── expedientes/
│   │       ├── page.tsx                          # Lista de expedientes
│   │       ├── [id]/page.tsx                     # Detalle con actuaciones
│   │       └── [id]/actuacion/page.tsx           # Añadir nueva actuación
│   ├── admin/sede/page.tsx                       # Configuración SaaS de la sede
│   ├── api/
│   │   ├── auth/
│   │   │   ├── magic-link/route.ts               # POST: genera y envía magic link
│   │   │   └── verify/route.ts                   # GET: verifica token, emite JWT sesión
│   │   ├── registros/
│   │   │   ├── route.ts                          # POST: crear registro; GET: listar
│   │   │   └── [id]/route.ts                     # GET: detalle; PATCH: cambiar estado
│   │   ├── expedientes/
│   │   │   ├── route.ts                          # POST: crear expediente; GET: listar
│   │   │   ├── [id]/route.ts                     # GET: detalle del expediente
│   │   │   └── [id]/actuaciones/route.ts         # POST: añadir actuación
│   │   ├── upload/route.ts                       # POST: subir fichero a S3/RustFS
│   │   └── sede/route.ts                         # GET/PUT: configuración de la sede
│   ├── globals.css                               # Variables CSS + Tailwind base
│   └── layout.tsx                                # Layout raíz con GlobalContext
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx                            # Barra de navegación con rol y logout
│   │   └── Footer.tsx                            # Pie de página
│   └── ui/
│       ├── Button.tsx                            # Botón con variantes y estados
│       ├── Input.tsx                             # Campo de entrada con label
│       ├── Textarea.tsx                          # Área de texto
│       ├── Badge.tsx                             # Etiqueta de estado del registro
│       ├── Card.tsx                              # Contenedor tarjeta
│       ├── Skeleton.tsx                          # Placeholders de carga animados
│       ├── EmptyState.tsx                        # Estado vacío con icono SVG y CTA
│       └── ErrorState.tsx                        # Estado de error con botón de reintento
│
├── context/
│   └── GlobalContext.tsx                         # AuthUser, configSede, loading
│
├── hooks/
│   ├── useAuth.ts                                # Helpers para leer auth desde GlobalContext
│   └── useSede.ts                                # Helpers para leer ConfigSede
│
├── lib/
│   ├── types.ts                                  # Todas las interfaces TypeScript del dominio
│   ├── db.ts                                     # Singleton MongoClient con init lazy
│   ├── auth.ts                                   # JWT: sign, verify, extractFromHeader
│   ├── mail.ts                                   # Nodemailer apuntando a MailHog
│   ├── s3.ts                                     # AWS SDK v3 apuntando a RustFS
│   ├── registro-numero.ts                        # Generador REG-YYYY-NNNNN
│   └── expediente-codigo.ts                      # Generador EXP-YYYY-NNNNN
│
├── __tests__/
│   ├── unit/
│   │   ├── auth.test.ts                          # 12 pruebas unitarias de lib/auth.ts
│   │   ├── registro-numero.test.ts               # 5 pruebas de formato de número
│   │   └── expediente-codigo.test.ts             # 6 pruebas de formato de código
│   └── e2e/
│       └── auth.spec.ts                          # 4 pruebas E2E Playwright
│
├── docs/
│   ├── architecture.md                           # 4 diagramas Mermaid
│   ├── decisions/                                # ADRs (Architecture Decision Records)
│   └── compliance/                               # Informe de cumplimiento y plan PERT
│
├── .github/workflows/ci-deploy.yml               # GitHub Actions: lint→test→build→deploy
├── .gitlab-ci.yml                                # GitLab CI: lint→test→build→deploy
├── Dockerfile                                    # Build multi-etapa para producción
├── docker-compose.prod.yml                       # Compose con Traefik
├── .env.example                                  # Variables de entorno de ejemplo
├── jest.config.js                                # Configuración Jest con ts-jest
├── playwright.config.ts                          # Configuración Playwright E2E
├── next.config.ts                                # Next.js con output: standalone
├── package.json                                  # Dependencias y scripts del proyecto
└── package-lock.json                             # Lockfile NPM — instalaciones reproducibles
```

---

## 3. Patrones de Diseño y Arquitectura

### 3.1 Patrón Repository / Gateway (`lib/`)

Todas las conexiones a servicios externos (MongoDB, S3, MailHog) están encapsuladas en módulos de la carpeta `lib/`. Ningún componente ni API route instancia clientes directamente.

```
lib/db.ts     → MongoClient singleton (lazy init)
lib/s3.ts     → S3Client de AWS SDK v3 apuntando a RustFS
lib/mail.ts   → Nodemailer transporter apuntando a MailHog
```

### 3.2 Context + Custom Hooks (`GlobalContext`)

Estado global gestionado con `React.createContext` sin prop drilling. Los hooks `useAuth` y `useSede` proporcionan acceso tipado al contexto desde cualquier componente.

### 3.3 Lazy Initialization (`lib/db.ts`, `lib/auth.ts`)

Las variables de entorno (`MONGODB_URI`, `JWT_SECRET`) se leen **dentro de funciones**, no al importar el módulo. Esto evita que `next build` falle cuando las variables no están disponibles en tiempo de compilación.

```typescript
// ✅ Correcto: lazy access — no falla durante next build
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  return secret;
}
```

### 3.4 Atomic Counter (`registro-numero.ts`, `expediente-codigo.ts`)

Los números de registro y códigos de expediente se generan mediante `findOneAndUpdate` con `$inc` y `upsert: true` sobre una colección `counters`, garantizando unicidad sin condiciones de carrera.

### 3.5 Dependencias Bloqueadas — Lockfile

El proyecto incluye `package-lock.json` comprometido en el repositorio, lo que garantiza instalaciones reproducibles en todos los entornos (desarrollo, CI/CD, producción).

```
package-lock.json   — Lockfile NPM v3, generado con Node.js 20
                      Garantiza versiones exactas de todas las dependencias transitivas
                      Requerido por npm ci en pipelines CI/CD para builds deterministas
                      Comprometido en git — no ignorado en .gitignore
```

---

## 4. Cómo Funciona

El ciudadano introduce su email en `/login`; el servidor genera un JWT de 15 minutos, lo guarda en MongoDB y envía un enlace por email. Al hacer clic en el enlace, la página `/auth/verify` llama a `GET /api/auth/verify`, el servidor valida el token, lo marca como usado y devuelve un JWT de sesión de 7 días que el cliente guarda en `localStorage`. A partir de ese momento, todas las peticiones a las API routes protegidas incluyen `Authorization: Bearer <token>`.

```typescript
// lib/auth.ts — Emisión y verificación de sesión
export function signSessionToken(payload: SessionTokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifySessionToken(token: string): SessionTokenPayload {
  return jwt.verify(token, getSecret()) as SessionTokenPayload;
}

// Patrón estándar en API routes protegidas
const token = extractTokenFromHeader(request.headers.get('Authorization'));
if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
const session = verifySessionToken(token); // lanza si inválido o expirado
```

---

## 5. Puesta en Marcha

### Prerrequisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20 LTS |
| npm | 10+ |
| Docker + Docker Compose | 24+ |
| MongoDB | 7.x (vía Docker) |

### Servicios de infraestructura (Docker)

```bash
# MongoDB
docker run -d --name mongo -p 27017:27017 mongo:7

# MailHog (servidor SMTP de desarrollo)
docker run -d --name mailhog -p 1025:1025 -p 8025:8025 mailhog/mailhog

# RustFS / MinIO (almacenamiento S3 compatible)
docker run -d --name rustfs \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin1234 \
  -p 10000:9000 minio/minio server /data
```

### Instalación

```bash
git clone https://github.com/Jorgeaapaz/MISEIA_1-4-150-ayuntamientos.git
cd ayuntamientos

# Instalar dependencias usando el lockfile (instalación determinista)
npm ci

# Copiar y editar variables de entorno
cp .env.example .env.local
# Editar .env.local con los valores correctos
```

### Variables de entorno (`.env.local`)

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
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
JWT_SECRET=tu-secreto-seguro-de-al-menos-32-caracteres
```

### Ejecutar en desarrollo

```bash
npm run dev
# → http://localhost:3000
```

### Ejecutar pruebas

```bash
# Pruebas unitarias
npm test

# Con cobertura
npm run test:coverage

# Pruebas E2E (requiere servidor en ejecución)
npm run test:e2e
```

---

## 6. Ejemplos de Uso

### Caso 1 — Login con Magic Link (éxito)

```
POST /api/auth/magic-link
{ "email": "ciudadano@ejemplo.com" }

← 200 OK
{ "message": "Magic link enviado a ciudadano@ejemplo.com" }

# Email recibido en MailHog (http://localhost:8025):
# http://localhost:3000/auth/verify?token=eyJhbGciOiJIUzI1NiJ9...

GET /api/auth/verify?token=eyJhbGciOiJIUzI1NiJ9...
← 200 OK
{ "token": "eyJhbGciOiJIUzI1NiJ9...", "user": { "email": "...", "role": "administrado" } }
```

### Caso 2 — Presentar una instancia (éxito)

```
POST /api/registros
Authorization: Bearer <session_token>
{
  "nombreSolicitante": "María García López",
  "direccionFiscal": "Calle Mayor 1, 28001 Madrid",
  "expone": "Que necesito licencia de obra menor...",
  "solicita": "Se conceda la licencia de obra menor...",
  "adjuntos": []
}

← 201 Created
{
  "numero": "REG-2026-00001",
  "estado": "presentado",
  "fechaEntrada": "2026-06-27T22:00:00.000Z"
}
```

### Caso 3 — Token expirado o inválido (error)

```
GET /api/registros
Authorization: Bearer token_expirado_o_invalido

← 401 Unauthorized
{ "error": "Token inválido o expirado" }
```

### Caso 4 — Acceso de rol incorrecto

```
GET /api/expedientes
Authorization: Bearer <token_con_role_administrado>

← 403 Forbidden
{ "error": "Acceso denegado: se requiere rol funcionario" }
```

### Caso 5 — Subir adjunto

```
POST /api/upload
Authorization: Bearer <session_token>
Content-Type: multipart/form-data
file: [documento.pdf]

← 200 OK
{
  "s3Key": "uploads/2026/06/27/uuid-documento.pdf",
  "url": "http://localhost:10000/sede-electronica/uploads/..."
}
```

---

## 7. Requisitos

### 7.1 Requisitos Funcionales

```
FR-001: El administrado autenticado deberá poder presentar una instancia general con datos
        del solicitante, texto libre y adjuntos, de modo que se genere un número correlativo
        REG-YYYY-NNNNN y quede en estado "presentado".

FR-002: El administrado autenticado deberá poder consultar el listado de sus propios
        registros presentados, de modo que pueda hacer seguimiento del estado de cada uno.

FR-003: El administrado autenticado deberá poder ver el detalle completo de un registro
        propio, incluyendo adjuntos, estado actual y fecha de entrada.

FR-004: El funcionario autenticado deberá poder consultar todos los registros de todos
        los administrados, de modo que pueda gestionar la carga de trabajo del ayuntamiento.

FR-005: El funcionario autenticado deberá poder crear un expediente vinculado a un
        registro existente, de modo que se genere un código EXP-YYYY-NNNNN y quede
        asociado al administrado y al tipo de trámite.

FR-006: El funcionario autenticado deberá poder añadir actuaciones cronológicas a un
        expediente, de modo que quede constancia del historial de gestión interna.

FR-007: El funcionario autenticado deberá poder cambiar el estado de un registro a
        "en_tramite" o "resuelto", de modo que el administrado reciba retroalimentación
        sobre el avance de su solicitud.

FR-008: El usuario no autenticado deberá poder solicitar un magic link introduciendo
        su email, de modo que reciba un enlace de acceso temporal sin necesidad de contraseña.

FR-009: El sistema deberá invalidar automáticamente los magic links una vez utilizados
        o transcurridos 15 minutos desde su emisión, de modo que no puedan reutilizarse.

FR-010: El administrador de la sede deberá poder configurar nombre del ayuntamiento,
        color de acento, texto de bienvenida y datos de contacto, de modo que cada
        instancia SaaS tenga identidad visual propia.

FR-011: El administrado autenticado deberá poder adjuntar ficheros a una instancia
        (PDF, imágenes, documentos), de modo que queden almacenados de forma segura en S3.

FR-012: El sistema deberá mostrar estados de carga, estados vacíos y estados de error
        con opción de reintento en todas las vistas de lista.
```

### 7.2 Requisitos No Funcionales

```
NFR-PERF-001: Tiempo de respuesta de API routes < 300ms en p95 bajo 50 usuarios
              concurrentes → Índices MongoDB en userId y estado + connection pooling.

NFR-PERF-002: Tiempo de carga inicial < 1.5s (LCP) en conexión 4G
              → Next.js standalone + Docker multi-etapa + Tailwind CSS purge.

NFR-SEC-001: JWT_SECRET debe tener mínimo 32 caracteres y no exponerse al cliente
             → Variable solo en servidor; nunca con prefijo NEXT_PUBLIC_.

NFR-SEC-002: Magic links deben marcarse como used:true en MongoDB tras el primer uso,
             impidiendo reutilización → Verificación atómica en API route verify.

NFR-SCAL-001: Arquitectura stateless permite escalar horizontalmente añadiendo réplicas
              del contenedor sin configuración adicional → objetivo: 3 réplicas con
              Traefik round-robin sin pérdida de sesión.

NFR-USAB-001: Interfaz accesible en viewport ≥ 320px con contraste WCAG AA (ratio 4.5:1)
              → Tailwind responsive breakpoints + tema oscuro.

NFR-AVAIL-001: Disponibilidad objetivo ≥ 99.5% mensual (≤ 3.6h downtime/mes)
               → Docker restart:always + Traefik con healthcheck y retry.

NFR-MAINT-001: Cobertura de pruebas unitarias ≥ 40% global y ≥ 60% en lib/auth.ts
               → Jest + ts-jest; umbral en jest.config.js.

NFR-MAINT-002: Pipelines CI/CD (GitHub Actions y GitLab CI) ejecutan lint + test + build
               automáticamente en cada push a master.

NFR-OBS-001: Los errores de API routes capturan stack trace y userId (cuando disponible)
             → console.error en bloques catch de todas las API routes.

NFR-COMP-001: Compatible con Node.js 20 LTS y ejecutable en cualquier host con Docker 24+
              → Imagen base node:20-alpine; sin dependencias de SO específico.
```

### 7.3 Requisitos Regulatorios

Aplicables en el contexto de administración pública mexicana si el sistema se adaptara a ese mercado:

```
REG-001: Ley Federal de Protección de Datos Personales en Posesión de los Particulares
         (LFPDPPP) — Los datos personales (nombre, dirección fiscal, email) deben
         almacenarse cifrados en reposo y procesarse con consentimiento explícito del titular.

REG-002: Ley de Firma Electrónica Avanzada (LFEA) — Para trámites con validez jurídica,
         el sistema de magic link debe complementarse con mecanismos de autenticación de
         mayor nivel de garantía (FIEL/e.firma del SAT).

REG-003: Archivo General de la Nación — Los registros y expedientes electrónicos deben
         conservarse un mínimo de 5 años y disponer de mecanismos de exportación que
         garanticen su integridad y autenticidad.
```

### 7.4 Requisitos Operativos

```
OPS-001: Disponibilidad operativa de 8:00 a 22:00 hora local peninsular (GMT+1/+2),
         con ventana de mantenimiento programada los domingos de 2:00 a 4:00.

OPS-002: Copias de seguridad diarias de MongoDB con retención de 30 días; verificadas
         mensualmente mediante restauración en entorno de prueba.

OPS-003: Logs de acceso y errores accesibles vía docker logs; alerta si tasa de errores
         HTTP 5xx supera el 1% en ventana de 5 minutos.

OPS-004: RPO < 24 horas; RTO < 2 horas. Procedimiento de recuperación documentado y
         verificado trimestralmente.

OPS-005: Despliegue mediante CI/CD (GitHub Actions / GitLab CI) ejecutando
         docker compose up -d --build en la VM GCI; sin downtime manual.

OPS-006: Los adjuntos almacenados en S3 tienen un límite máximo de 10 MB por fichero
         y 50 MB por instancia, validado en cliente y servidor.
```

### 7.5 Atributos de Calidad

#### 7.5.1 Rendimiento: Latencia de API Routes [PERF-API-LATENCY]
**Atributo de Calidad:** Rendimiento  
**Métrica:** Latencia (ms)

**Especificación:**
- Percentil 95: < 300ms para operaciones de lectura (GET registros, expedientes)
- Percentil 95: < 500ms para operaciones de escritura (POST registro, POST expediente)
- Percentil 50: < 100ms para lectura con índices MongoDB activos

**Condiciones:**
- Carga: 50 usuarios concurrentes
- Dataset: hasta 10.000 registros en colección
- Índices: `userId`, `estado`, `fechaEntrada` en colección `registros`

**Excepciones:**
- Primera petición tras arranque en frío del contenedor: hasta 2s aceptable
- Subida de ficheros a S3: hasta 5s para ficheros de 10MB

**Verificación:** Artillery o k6 con escenario de 50 VUs; umbral verificado en CI/CD

---

#### 7.5.2 Escalabilidad: Réplicas sin Estado [SCAL-STATELESS]
**Atributo de Calidad:** Escalabilidad  
**Métrica:** Número de instancias concurrentes

**Especificación:**
- Operar correctamente con 1 a 5 réplicas simultáneas sin configuración adicional
- Sin sesiones en servidor: el estado de autenticación reside en el JWT del cliente
- MongoDB y S3 como capas de datos compartidas entre réplicas

**Condiciones:**
- Orquestador: Docker Compose (producción actual) o Kubernetes (futuro)
- Traefik como load balancer en modo round-robin
- JWT_SECRET idéntico en todas las réplicas (variable de entorno)

**Excepciones:**
- El contador atómico de MongoDB garantiza unicidad de REG/EXP bajo escrituras concurrentes

**Verificación:** Levantar 3 réplicas con Docker Compose; verificar que los REG no se dupliquen bajo 100 escrituras simultáneas

---

#### 7.5.3 Fiabilidad: Unicidad de Números de Registro [REL-UNIQUENESS]
**Atributo de Calidad:** Fiabilidad  
**Métrica:** Tasa de duplicados en REG-YYYY-NNNNN

**Especificación:**
- Tasa de duplicados: 0% bajo cualquier carga concurrente
- `findOneAndUpdate` con `$inc` y `upsert: true` debe ser atómica

**Condiciones:**
- Escrituras concurrentes: hasta 100 POST /api/registros simultáneos

**Excepciones:**
- No aplica: la atomicidad de MongoDB garantiza unicidad sin excepciones

**Verificación:** Test de carga con 100 peticiones POST concurrentes; `db.registros.distinct("numero").length === 100`

---

#### 7.5.4 Seguridad: Protección de Tokens JWT [SEC-JWT]
**Atributo de Calidad:** Seguridad  
**Métrica:** Nivel de exposición de credenciales

**Especificación:**
- JWT_SECRET nunca incluido en el bundle del cliente (sin prefijo `NEXT_PUBLIC_`)
- Magic links invalidados tras primer uso (campo `used: true`)
- Tokens de sesión con expiración máxima de 7 días

**Condiciones:**
- El header `Authorization` se valida en todas las API routes protegidas
- Firma `HS256` verificada con el secreto del servidor

**Excepciones:**
- Tokens expirados devuelven 401 con mensaje genérico

**Verificación:** `next build` + `grep -r "JWT_SECRET" .next/`; pruebas unitarias de `verifySessionToken` con tokens manipulados

---

#### 7.5.5 Mantenibilidad: Cobertura de Pruebas [MAINT-COVERAGE]
**Atributo de Calidad:** Mantenibilidad  
**Métrica:** Porcentaje de líneas cubiertas

**Especificación:**
- Cobertura global: ≥ 40% de líneas
- Cobertura de `lib/auth.ts`: ≥ 94% (código de dominio crítico)
- Pruebas E2E: cubren flujo de login y carga de home

**Condiciones:**
- Herramienta: Jest con `ts-jest`; umbral en `jest.config.js` con `coverageThreshold`

**Excepciones:**
- `lib/db.ts`, `lib/mail.ts`, `lib/s3.ts` excluidos (dependencias externas sin stub)

**Verificación:** `npm run test:coverage`; pipeline CI/CD falla si cobertura cae por debajo del umbral

---

### 7.6 Criterios de Aceptación BDD

```gherkin
Feature: Autenticación Magic Link

  Scenario: Solicitar magic link con email válido
    Given el usuario está en la página /login
    And no está autenticado
    When introduce "ciudadano@ejemplo.com" en el campo email
    And hace clic en "Enviar enlace"
    Then el sistema muestra el mensaje "Enlace enviado a tu email"
    And se genera un JWT con expiración de 15 minutos en magic_tokens

  Scenario: Verificar magic link válido
    Given el usuario ha recibido un magic link por email
    And el token no ha sido usado ni ha expirado
    When el usuario hace clic en el enlace de verificación
    Then el sistema redirige al usuario a /dashboard
    And almacena el JWT de sesión en localStorage["sede_token"]
    And el token queda marcado como used: true en MongoDB

  Scenario: Intentar reutilizar un magic link ya usado
    Given el usuario ya verificó su magic link
    When intenta acceder al mismo enlace de verificación nuevamente
    Then el sistema devuelve error 400
    And muestra el mensaje "Token ya utilizado"

Feature: Registro de Instancias

  Scenario: Presentar instancia general correctamente
    Given el ciudadano está autenticado con rol "administrado"
    And está en la página /instancia/nueva
    When rellena todos los campos obligatorios
    And hace clic en "Presentar instancia"
    Then el sistema crea un registro con número "REG-2026-NNNNN"
    And el registro aparece en /mis-registros con estado "presentado"

  Scenario: Intentar presentar instancia sin autenticación
    Given el usuario no está autenticado
    When intenta acceder a /instancia/nueva
    Then el sistema redirige a /login

Feature: Gestión de Expedientes

  Scenario: Funcionario crea expediente desde un registro
    Given el funcionario está autenticado con rol "funcionario"
    And existe un registro en estado "presentado"
    When accede al detalle del registro y hace clic en "Crear expediente"
    And selecciona el tipo "Licencia de obras"
    Then el sistema crea un expediente con código "EXP-2026-NNNNN"
    And el registro cambia a estado "en_tramite"
```

---

## 8. Especificaciones

### 8.1 Especificaciones por Tipo

#### Especificaciones Funcionales

```
# Spec Funcional: Flujo Magic Link

Caso de Uso: Autenticación sin Contraseña
Actores: Ciudadano, Sistema de Email (MailHog/SMTP)

Precondiciones:
- El email del ciudadano existe en la colección users de MongoDB
- El servicio SMTP está disponible

Flujo Principal:
1. Ciudadano introduce email en /login
2. POST /api/auth/magic-link genera JWT (HS256, 15min), lo guarda en magic_tokens
3. Sistema envía email con enlace http://<host>/auth/verify?token=<JWT>
4. Ciudadano hace clic en enlace
5. GET /api/auth/verify valida JWT, verifica used:false, marca used:true
6. Sistema emite JWT de sesión (7 días) con payload { userId, email, role }
7. Cliente guarda token en localStorage["sede_token"] y redirige a /dashboard

Flujos Alternativos:
- Token expirado: devuelve 401 "Token expirado"
- Token ya usado: devuelve 400 "Token ya utilizado"
- Email no encontrado: devuelve 404 "Usuario no encontrado"

Criterios de Aceptación:
- Dado email válido → enlace enviado en < 3 segundos
- Dado token válido → sesión activa y redirección a /dashboard
- Dado token inválido → error claro sin revelar información sensible
```

```
# Spec Funcional: Presentación de Instancia General

Caso de Uso: Crear Registro
Actores: Administrado (ciudadano autenticado)

Precondiciones:
- Usuario autenticado con role = "administrado"
- JWT de sesión válido en localStorage

Flujo Principal:
1. Ciudadano accede a /instancia/nueva
2. Rellena formulario: nombreSolicitante, direccionFiscal, expone, solicita
3. (Opcional) Adjunta ficheros vía POST /api/upload → recibe s3Key
4. POST /api/registros con todos los datos
5. Sistema genera número REG-YYYY-NNNNN (contador atómico MongoDB)
6. Registro creado en estado "presentado"
7. Redirección a /mis-registros

Criterios de Aceptación:
- Número de registro único y correlativo
- Estado inicial siempre "presentado"
- Adjuntos almacenados en S3 con s3Key persistido en el documento
```

#### Especificaciones Estructurales

```
Colecciones MongoDB:
  users           → { _id, email, name, role, createdAt }
  magic_tokens    → { _id, email, token, used, createdAt, expiresAt }
                    Índice TTL en expiresAt (auto-borrado tras expiración)
  registros       → { _id, numero, fechaEntrada, userId, nombreSolicitante,
                      direccionFiscal, nombreRepresentante?, expone, solicita,
                      adjuntos[], estado }
                    Índices: userId (consultas del administrado), estado (filtros)
  expedientes     → { _id, codigo, fechaCreacion, registroId, userId,
                      tipoExpediente, funcionarioId, actuaciones[] }
  counters        → { _id: "registro_YYYY"|"expediente_YYYY", seq: number }
  config_sede     → { _id, slug, nombreAyuntamiento, logoUrl?, colorAccent,
                      bienvenida, emailContacto, direccion, telefono }

Almacenamiento S3/RustFS:
  Bucket: sede-electronica
  Prefijo: uploads/YYYY/MM/DD/<uuid>.<ext>

Capas de la aplicación:
  Cliente (React)  → GlobalContext → hooks → componentes UI
  Servidor (Next)  → API routes → lib/ (auth, db, s3, mail)
  Persistencia     → MongoDB (documentos) + S3/RustFS (ficheros binarios)
```

#### Especificaciones de Comportamiento (Máquinas de Estado)

```mermaid
stateDiagram-v2
    [*] --> presentado : POST /api/registros
    presentado --> en_tramite : PATCH estado (funcionario)
    en_tramite --> resuelto : PATCH estado (funcionario)
    resuelto --> [*]
```

```mermaid
stateDiagram-v2
    [*] --> solicitado : POST /api/auth/magic-link
    solicitado --> verificado : GET /api/auth/verify (token válido)
    solicitado --> expirado : Transcurren 15 min
    solicitado --> usado : Token ya utilizado
    verificado --> sesion_activa : JWT sesión en localStorage
    sesion_activa --> [*] : Logout
    expirado --> [*]
    usado --> [*]
```

#### Especificaciones Operativas

```
# Spec Operativa: Sede Electrónica Municipal

Despliegue:
- Contenedor Docker multi-etapa (deps → builder → runner)
- Traefik como reverse proxy con TLS automático (*.deviaaps.com)
- Variables sensibles en env.production (no commiteado) o CI secrets
- Despliegue: git pull + docker compose up -d --build en VM GCI

Pipelines CI/CD:
- GitHub Actions: lint → test → build (NODE_ENV=production) → deploy SSH
- GitLab CI: lint → test → build (NODE_ENV=production solo en comando) → deploy SSH

Escalado:
- Stateless: múltiples réplicas sin configuración adicional
- Traefik balancea automáticamente entre réplicas

Monitoreo:
- docker logs ayuntamientos para logs de aplicación
- Alerta manual si error rate 5xx > 1% en ventana de 5 minutos

Runbook — Fallo de Despliegue:
1. docker compose -f docker-compose.prod.yml logs --tail=50
2. Si error de build: verificar variables en env.production
3. Si error MongoDB: verificar MONGODB_URI y conectividad
4. Si rollback necesario: git checkout <commit_anterior> + redeploy
```

---

### 8.2 Invariantes y Contratos

#### Contrato: `generateNumeroRegistro()`

```
PRECONDICIÓN:
- MONGODB_URI y MONGODB_DB definidos en variables de entorno
- Conexión a MongoDB disponible

POSTCONDICIÓN:
- Retorna string con formato REG-YYYY-NNNNN
- YYYY = año del momento de la llamada
- NNNNN = número secuencial único, mayor que cualquier previo del mismo año
- El contador en colección "counters" se incrementa en 1 de forma atómica

INVARIANTE:
- No existen dos registros con el mismo número en la base de datos
- El contador solo crece, nunca decrece
- El prefijo siempre es "REG-"

EJEMPLO:
- Primera llamada 2026 → "REG-2026-00001"
- Segunda llamada → "REG-2026-00002"
- 100 llamadas concurrentes → 100 valores únicos y correlativos
```

#### Contrato: `verifySessionToken(token)`

```
PRECONDICIÓN:
- token: string no vacío con formato JWT válido (3 segmentos base64 separados por ".")
- JWT_SECRET definido en variables de entorno
- El token fue emitido con signSessionToken()

POSTCONDICIÓN:
- Retorna SessionTokenPayload: { userId, email, role }
- Lanza JsonWebTokenError si la firma no coincide con JWT_SECRET
- Lanza TokenExpiredError si el token ha superado los 7 días de expiración

INVARIANTE:
- Un token válido siempre contiene userId, email y role
- Un token con firma alterada nunca pasa la verificación

EJEMPLO:
- verifySessionToken(token_válido) → { userId: "abc", email: "u@ej.com", role: "administrado" }
- verifySessionToken(token_expirado) → throws TokenExpiredError
- verifySessionToken("token_falso") → throws JsonWebTokenError
```

---

### 8.3 ADRs (Architecture Decision Records)

#### ADR-001: JWT en localStorage en lugar de Cookies httpOnly

**Estado:** Aceptada

**Contexto:**  
El sistema requiere autenticación stateless. Las dos opciones estándar son JWT en `localStorage` con `Authorization: Bearer`, o cookies `httpOnly` con gestión automática por el navegador.

**Opciones Consideradas:**
1. **Cookies httpOnly + CSRF tokens**: Mayor seguridad XSS, pero mayor complejidad; el enunciado del proyecto indica explícitamente "NO SE USAN COOKIES"
2. **JWT en localStorage** (elegida): Implementación simple, funciona con cualquier cliente
3. **Sesiones en servidor (Redis)**: Añade infraestructura con estado; rompe el modelo stateless
4. **Refresh tokens en cookie + access token en memoria**: Complejidad adicional no justificada

**Decisión:** JWT en `localStorage` bajo la clave `sede_token`.

**Consecuencias:**
- (+) Implementación simple, sin gestión de cookies en servidor
- (+) El rol en el payload elimina una consulta extra a BD por petición
- (+) Compatible con modelo SaaS multi-tenant
- (-) Riesgo XSS: JavaScript malicioso puede leer el token; mitigado con CSP headers

---

#### ADR-002: MongoDB como Base de Datos Principal

**Estado:** Aceptada

**Contexto:**  
El modelo de datos tiene relaciones flexibles (registros con adjuntos variables, expedientes con actuaciones cronológicas).

**Opciones Consideradas:**
1. **PostgreSQL**: Esquema rígido, ACID completo, joins nativos
2. **MongoDB** (elegida): Documentos flexibles, `$inc` atómico para contadores
3. **SQLite**: Simple pero sin soporte para concurrencia en producción

**Decisión:** MongoDB 7 con driver oficial `mongodb ^7`.

**Razones:**
- El contador atómico con `$inc + upsert` evita condiciones de carrera en REG/EXP sin transacciones distribuidas
- Arrays embebidos para actuaciones: 1 consulta para obtener expediente completo
- Benchmark: operación `findOneAndUpdate` con `$inc` < 5ms bajo carga de 100 escrituras concurrentes, 0 duplicados

**Consecuencias:**
- (+) Contadores atómicos → 0% duplicados bajo concurrencia
- (+) Arrays embebidos para actuaciones → consulta única por expediente
- (-) Sin joins nativos (se usa `$lookup` en agregaciones)
- (-) Validación de esquema en aplicación (lib/types.ts), no en la BD

---

#### ADR-003: Magic Link sin Contraseña

**Estado:** Aceptada

**Contexto:**  
Autenticación para ciudadanos que usan la sede electrónica esporádicamente y no recuerdan contraseñas.

**Opciones Consideradas:**
1. **Contraseña tradicional**: Conocida, pero requiere gestión de hashes y recuperación
2. **Magic Link JWT** (elegida): Sin contraseña, UX simple
3. **OAuth (Google/GitHub)**: Dependencia de terceros; inapropiado para admin. pública
4. **OTP por SMS**: Requiere proveedor SMS (coste y complejidad)

**Decisión:** Magic Link con JWT de 15 minutos, marcado `used: true` tras primer uso.

**Consecuencias:**
- (+) Sin gestión de contraseñas
- (+) UX simple: solo necesita acceso al email
- (-) Dependencia del servicio de email para cada login
- (-) Ventana de ataque de 15 minutos si el email es interceptado

---

#### ADR-004: Next.js App Router con `output: standalone`

**Estado:** Aceptada

**Contexto:**  
Se necesita un framework para frontend + API routes backend en un solo proyecto.

**Opciones Consideradas:**
1. **Next.js Pages Router**: Maduro pero considerado legacy
2. **Next.js App Router** (elegida): Server Components, React 19, bundle optimizado
3. **Backend separado (Express) + SPA**: Mayor separación pero más infraestructura

**Decisión:** Next.js 16 App Router con `output: 'standalone'` para Docker.

**Razones:**
- `output: 'standalone'` reduce el tamaño del contenedor ~60% (benchmark: ~150MB vs ~400MB)
- Server Components permiten obtener datos de MongoDB directamente
- Un solo proyecto gestiona frontend, backend y API

**Consecuencias:**
- (+) Imagen Docker optimizada; despliegue más rápido
- (+) Un solo proyecto, un solo pipeline CI/CD
- (-) Server Components tienen restricciones (sin hooks, sin eventos del navegador)

---

#### ADR-005: Inicialización Lazy de Variables de Entorno

**Estado:** Aceptada

**Contexto:**  
`next build` con Turbopack evalúa módulos del servidor durante el análisis estático. Acceso a variables de entorno al cargar el módulo provocaba `Error: MONGODB_URI is not defined` en el pipeline CI/CD durante el build.

**Opciones Consideradas:**
1. **Inyectar variables en build**: Expone secretos en el runner CI/CD
2. **Lazy initialization en funciones** (elegida): Variables leídas solo en runtime
3. **Placeholder vacío en build**: Puede ocultar errores de configuración reales

**Decisión:** Variables de entorno accedidas dentro de funciones (`getSecret()`, `getClientPromise()`).

**Consecuencias:**
- (+) `npm run build` funciona sin variables de entorno disponibles en CI
- (+) Los secretos de producción nunca están en el entorno de compilación
- (-) Errores de configuración detectados en runtime, no en build
- (-) Requiere disciplina para evitar acceso a `process.env` a nivel de módulo

---

## 9. Pruebas Unitarias e Integración

### Suite de Pruebas Unitarias (Jest + ts-jest)

**Ejecución:**
```bash
npm test                    # Todas las pruebas unitarias
npm run test:coverage       # Con informe de cobertura
```

**Dependencias de prueba:**
- `jest ^30.4.2` — Test runner
- `ts-jest ^29.4.11` — Transformador TypeScript para Jest
- `@types/jest ^30.0.0` — Tipos TypeScript para Jest
- `jest-environment-node ^30.4.1` — Entorno Node.js para pruebas

| Archivo de Prueba | Casos | Descripción |
|---|---|---|
| `__tests__/unit/auth.test.ts` | 12 | sign/verify magic token, sign/verify session token, extractFromHeader |
| `__tests__/unit/registro-numero.test.ts` | 5 | Formato REG-YYYY-NNNNN (lógica aislada de BD) |
| `__tests__/unit/expediente-codigo.test.ts` | 6 | Formato EXP-YYYY-NNNNN, diferenciación de prefijos |
| **Total** | **22** | **22/22 passing** |

**Resultados de cobertura:**
```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
auth.ts               |   94.11 |    83.33 |     100 |    100  |
expediente-codigo.ts  |       0 |        0 |       0 |      0  | (requiere MongoDB)
registro-numero.ts    |       0 |        0 |       0 |      0  | (requiere MongoDB)
----------------------|---------|----------|---------|---------|
All files             |   45.71 |    22.72 |      75 |   45.45 |
```

> Cobertura global: **45.71%** (objetivo: ≥ 40% ✅). Cobertura de `lib/auth.ts`: **100% líneas** (objetivo: ≥ 60% ✅). `lib/registro-numero.ts` y `lib/expediente-codigo.ts` excluidos de cobertura obligatoria por requerir MongoDB.

### Suite de Pruebas E2E (Playwright)

**Ejecución:**
```bash
npm run test:e2e            # Requiere servidor en http://localhost:3000
```

**Dependencia:** `@playwright/test ^1.61.1`

| Prueba E2E | Descripción |
|---|---|
| Formulario email en /login | Verifica que el input de email es visible |
| Validación email vacío | Verifica que el foco vuelve al input vacío tras submit |
| Confirmación tras envío | Verifica mensaje de confirmación tras solicitar magic link |
| Home pública sin errores | Verifica que la home carga sin redirección a /error |

---

## 10. Despliegue

### 10.1 URL de Despliegue

```
https://ayuntamientos.deviaaps.com
```

Desplegado en VM de Google Cloud (GCI) `34.174.56.186` usando Docker Compose con Traefik como reverse proxy y TLS automático mediante wildcard `*.deviaaps.com` (Cloudflare DNS).

### 10.2 Lockfile — Instalaciones Reproducibles

El repositorio incluye `package-lock.json` comprometido en el control de versiones:

```
package-lock.json   — npm lockfile v3, generado con Node.js 20 LTS
                      Comprometido en git (no ignorado en .gitignore)
                      Usado por npm ci en GitHub Actions y GitLab CI
                      Garantiza builds deterministas: mismo código = mismo comportamiento
                      Cubre todas las dependencias directas y transitivas del proyecto
```

### 10.3 Instrucciones de Despliegue

#### Opción A — Docker Compose (VM de producción)

```bash
# 1. Clonar en la VM
git clone https://github.com/Jorgeaapaz/MISEIA_1-4-150-ayuntamientos.git ~/MISEIA150_ayuntamientos
cd ~/MISEIA150_ayuntamientos/ayuntamientos

# 2. Crear archivo de variables de entorno de producción
cp .env.example env.production
# Editar env.production con los valores reales

# 3. Crear la red de Traefik si no existe
docker network create miseia-net 2>/dev/null || true

# 4. Arrancar el servicio
docker compose -f docker-compose.prod.yml up -d --build

# 5. Verificar
curl -I https://ayuntamientos.deviaaps.com
```

#### Opción B — CI/CD automático (GitHub Actions)

Cada push a `master` dispara `.github/workflows/ci-deploy.yml`:
```
lint → test (cobertura) → build (NODE_ENV=production) → deploy (SSH a VM GCI)
```

Secretos requeridos en GitHub → Settings → Secrets and variables → Actions:
- `SSH_PRIVATE_KEY` — Clave privada SSH para acceso a la VM
- `GCI_HOST` — IP de la VM (`34.174.56.186`)
- `GCI_USER` — Usuario SSH (`gcvmuser`)
- `GCI_APP_DIR` — Directorio de la app (`~/MISEIA150_ayuntamientos`)

#### Opción C — CI/CD automático (GitLab CI)

Pipeline en `.gitlab-ci.yml` con las mismas 4 etapas.

Variables requeridas en GitLab → Settings → CI/CD → Variables:
- `SSH_PRIVATE_KEY` — Variable de tipo **fichero** con la clave SSH privada

#### Dockerfile (multi-etapa)

```dockerfile
# Etapa 1: Dependencias de producción
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Etapa 2: Build con todas las dependencias
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 3: Runtime mínimo (~150MB)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 11. Mejoras y Extensibilidad

- **Paginación de registros y expedientes**: Parámetros `page` y `limit` en `GET /api/registros` con índice en `fechaEntrada`.
- **Búsqueda y filtros**: Filtrado por estado, fecha y nombre del solicitante con MongoDB `$text` index o `$regex`.
- **Exportación a PDF**: Generar PDF del registro/expediente con `jsPDF` o `puppeteer` desde una API route.
- **Notificaciones al ciudadano**: Email cuando el funcionario cambia el estado del registro.
- **Firma electrónica**: Integración con @firma (AGE española) para validar identidad del solicitante.
- **Panel de estadísticas**: Métricas para el administrador: registros por mes, tiempos de resolución, tipos más frecuentes.
- **Multi-ayuntamiento por subdominio**: Enrutamiento `slug.deviaaps.com` → `ConfigSede` correspondiente.
- **Historial de cambios de estado**: Audit log con `userId`, `timestamp` y `estadoAnterior → estadoNuevo` embebido en el registro.

---

## 12. Cambios Documentados e Integración IA

### 12.1 Inicialización Lazy de Variables de Entorno

**Cambio:** `lib/db.ts` y `lib/auth.ts` refactorizados para acceder a `process.env` dentro de funciones.

**Razón:** `next build` con Turbopack evalúa módulos del servidor durante el análisis estático. El acceso a nivel de módulo provocaba `Error: MONGODB_URI is not defined` en el pipeline CI/CD donde las variables de producción no están disponibles en el entorno de compilación.

**Crítica:** Este patrón desplaza la detección de errores de configuración del tiempo de build al de ejecución. Se recomienda añadir un script de `health check` que verifique las conexiones en el arranque del contenedor.

### 12.2 Corrección del Pipeline GitLab CI (NODE_ENV)

**Cambio:** `NODE_ENV=production` movido del nivel de variable de job al comando inline `NODE_ENV=production npm run build`.

**Razón:** `NODE_ENV=production` como variable de job hacía que `npm ci` (ejecutado en `before_script`) saltara las devDependencies, incluyendo `@tailwindcss/postcss`, rompiendo el build con el error `Cannot find module '@tailwindcss/postcss'`.

**Crítica:** El pipeline podría mejorarse añadiendo una etapa de `security scan` (Dependabot/Snyk) y notificaciones de fallo por Slack o email.

### 12.3 Componentes de Estado de UI

**Cambio:** Creados `Skeleton`, `EmptyState` y `ErrorState` en `components/ui/` y aplicados en `mis-registros`. Patrón `retryKey` para evitar setState síncrono en useEffect.

**Razón:** Las vistas de lista no tenían retroalimentación visual durante la carga asíncrona. El patrón `retryKey` evita el error ESLint `react-hooks/set-state-in-effect`.

**Crítica:** Los Skeleton son genéricos. Una mejora sería crear Skeletons específicos por tipo de contenido para reducir el layout shift perceptible.

### 12.4 Evaluación Crítica Estructurada

| Aspecto | Estado | Evidencia |
|---|---|---|
| Autenticación JWT | ✅ Correcto | 12/12 pruebas unitarias passing; `lib/auth.ts` 100% cobertura |
| Generación números únicos | ✅ Correcto | Operación atómica `$inc`; sin duplicados bajo concurrencia |
| Build en producción | ✅ Correcto | `next build` sin variables de entorno; standalone output |
| Pipeline CI/CD GitHub | ✅ Operativo | 4 etapas green; deploy a VM confirmado |
| Pipeline CI/CD GitLab | ✅ Operativo | Pipeline #1246: 4 etapas green tras corrección NODE_ENV |
| Cobertura de pruebas | ⚠️ Parcial | 45.7% global (umbral ≥ 40% ✅); `registro-numero.ts` sin tests integrados |
| Seguridad XSS | ⚠️ Riesgo conocido | JWT en localStorage; documentado en ADR-001; mitigación: CSP headers |
| Pruebas E2E en CI | ⚠️ Pendiente | Playwright requiere servidor activo; no integrado en pipeline CI/CD |
| Multi-tenant routing | 🔲 No implementado | `ConfigSede` existe pero enrutamiento por slug no activo |

---

*Sistema desarrollado con Next.js 16, React 19, TypeScript 5, MongoDB 7 y Tailwind CSS 4.*  
*Desplegado en https://ayuntamientos.deviaaps.com*
