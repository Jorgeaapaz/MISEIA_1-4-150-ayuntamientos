# Arquitectura — Sede Electrónica Ayuntamientos

## Diagrama de Componentes (C4 Container Level)

```mermaid
graph TB
    subgraph Browser["🌐 Browser (React 19)"]
        UI["Páginas Next.js\n(Client Components)"]
        LS["localStorage\nsede_token (JWT 7d)"]
        CTX["GlobalContext\n(authUser, configSede)"]
    end

    subgraph NextJS["⚡ Next.js 16 App Router"]
        SC["Server Components\n(data fetching directo)"]
        AR["API Routes\n/api/**"]
    end

    subgraph Storage["Persistencia"]
        MongoDB[("🍃 MongoDB 7\ncolecciones:\nusers, magic_tokens\nregistros, expedientes\nconfig_sede, counters")]
        RustFS["📦 RustFS / MinIO\nS3-compatible\nficheros adjuntos"]
    end

    MailHog["📧 MailHog\nSMTP (dev)"]

    UI -->|"fetch + Authorization: Bearer"| AR
    AR -->|"mongodb driver"| MongoDB
    AR -->|"AWS SDK v3"| RustFS
    AR -->|"nodemailer"| MailHog
    UI <-->|"React Context"| CTX
    LS -->|"token leído al iniciar"| CTX
```

## Flujo de Autenticación — Magic Link

```mermaid
sequenceDiagram
    actor U as Usuario
    participant L as /login
    participant A as API /api/auth
    participant DB as MongoDB
    participant M as MailHog

    U->>L: introduce email
    L->>A: POST /magic-link {email}
    A->>DB: insertOne magic_tokens (JWT 15min, used:false)
    A->>M: send email con enlace /auth/verify?token=JWT
    A-->>L: {message: "enlace enviado"}
    M-->>U: email con enlace

    U->>A: GET /verify?token=JWT
    A->>DB: findOne magic_tokens {token, used:false}
    A->>DB: updateOne {used: true}
    A->>DB: findOne o insertOne users {email}
    A-->>U: {token: JWT_sesion_7dias}
    U->>U: localStorage.setItem('sede_token', token)
```

## Flujo de Presentación de Instancia

```mermaid
sequenceDiagram
    actor A as Administrado
    participant F as /instancia/nueva
    participant API as API Routes
    participant S3 as RustFS/S3
    participant DB as MongoDB

    A->>F: rellena formulario
    opt adjuntos
        F->>API: POST /upload (multipart, Bearer token)
        API->>S3: putObject(file)
        API-->>F: {s3Key, url}
    end
    F->>API: POST /registros {datos + adjuntos[], Bearer token}
    API->>DB: findOneAndUpdate counters (seq++)
    API->>DB: insertOne registros (numero: REG-2026-XXXXX)
    API-->>F: {_id, numero, estado: "presentado"}
    F->>F: redirect /mis-registros
```

## Modelo de Roles y Acceso

```mermaid
graph LR
    JWT["JWT Sesión\n{userId, email, role}"] --> R{role}
    R -->|administrado| PA["Páginas:\n/dashboard\n/instancia/nueva\n/mis-registros/**"]
    R -->|funcionario| PF["Páginas:\n/funcionario/registros/**\n/funcionario/expedientes/**\n/admin/sede"]
    PA --> API_A["API:\nGET /registros (propios)\nPOST /registros\nPOST /upload"]
    PF --> API_F["API:\nGET /registros (todos)\nPOST /expedientes\nPOST /expedientes/:id/actuaciones\nPUT /sede"]
```

## Estructura de Capas

| Capa | Responsabilidad | Archivos |
|---|---|---|
| **UI / Presentación** | Renderizado, interacción usuario | `app/**/page.tsx`, `components/` |
| **Estado Global** | Auth + configSede compartidos | `context/GlobalContext.tsx`, `hooks/` |
| **API / Controladores** | Validación, autorización, coordinación | `app/api/**/route.ts` |
| **Dominio / Lógica** | JWT, numeración, tipos | `lib/auth.ts`, `lib/registro-numero.ts`, `lib/expediente-codigo.ts`, `lib/types.ts` |
| **Infraestructura** | Acceso a servicios externos | `lib/db.ts`, `lib/s3.ts`, `lib/mail.ts` |
