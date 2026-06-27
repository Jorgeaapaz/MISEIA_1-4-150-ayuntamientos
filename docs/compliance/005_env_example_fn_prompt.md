@~/.claude/prompts/new_functionality_prompt_spec.md

# Crear .env.example — Sede Electrónica Ayuntamientos

## Role
Act as a Software Developer following best practices for environment variable management and project documentation.

## Context
Proyecto: Sede Electrónica — Next.js 16 / React 19 / TypeScript  
Ruta: `D:\Master-IA-Dev\04-Bloque4\1-4-150-ayuntamientos\ayuntamientos`  

Variables de entorno actualmente documentadas inline en README pero sin archivo `.env.example`:
- MONGODB_URI, MONGODB_DB
- AWS_USERNAME, AWS_PASSWORD, AWS_REGION, AWS_URL, AWS_BUCKET
- MAILHOG_HOST, MAIL_PORT
- NEXT_PUBLIC_API_URL
- JWT_SECRET
- NODE_ENV (solo producción)

## Task
Crear el archivo `.env.example` en la raíz del proyecto con todas las variables de entorno requeridas, sin valores reales, con comentarios explicativos. Actualizar el README para referenciar el archivo.

### .env.example Guidelines
1. El archivo debe incluir TODAS las variables necesarias para ejecutar el proyecto
2. Los valores deben ser placeholders descriptivos (no reales): `<valor>`, `your-secret-here`, etc.
3. Comentarios explicativos para cada grupo de variables
4. El archivo se commitea al repositorio (es una plantilla, sin secretos reales)
5. El `.gitignore` debe ignorar `.env.local` y `.env.production` pero NO `.env.example`

Contenido esperado:
```env
# ============================================================
# .env.example — Plantilla de variables de entorno
# Copia este archivo a .env.local y rellena los valores reales
# NUNCA commitear .env.local ni .env.production
# ============================================================

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=sede_electronica

# AWS S3 / Rustfs (S3-compatible object storage)
AWS_USERNAME=<access-key>
AWS_PASSWORD=<secret-key>
AWS_REGION=us-east-1
AWS_URL=http://localhost:10000
AWS_BUCKET=sede-electronica

# Email — MailHog (desarrollo) o SMTP real (producción)
MAILHOG_HOST=localhost
MAIL_PORT=1025

# Next.js — URL base de la API
NEXT_PUBLIC_API_URL=http://localhost:3000

# JWT — Secreto de firma (mínimo 32 caracteres, aleatorio y fuerte)
JWT_SECRET=<cambiar-por-secreto-aleatorio-32-chars>
```

### .gitignore Guidelines
Verificar que `.gitignore` incluye:
```
.env.local
.env.production
.env*.local
```
Y NO ignora `.env.example`.

### README Guidelines
En la sección "Variables de entorno" del README, cambiar las instrucciones inline por:
```bash
cp .env.example .env.local
# Editar .env.local con los valores reales
```

## Output format
- `.env.example` en la raíz del proyecto
- `.gitignore` verificado/actualizado
- README.md sección "Variables de entorno" actualizada

## Examples and Steps to Follow
1. Crear rama `feat/env-example`
2. Crear `.env.example` con todos los campos
3. Verificar `.gitignore` no expone secretos
4. Actualizar README
5. `npm run lint` para verificar que no hay errores
6. Commit y PR

## Output Checklist and Guardrails
- [ ] `.env.example` existe en la raíz
- [ ] Sin valores reales en `.env.example`
- [ ] `.env.local` en `.gitignore`
- [ ] README referencia `.env.example` con `cp .env.example .env.local`
- [ ] Todas las variables del proyecto están listadas
