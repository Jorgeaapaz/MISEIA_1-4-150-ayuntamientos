@~/.claude/prompts/new_functionality_prompt_spec.md

# Deploy Sede Electrónica en GCI VM con Docker y Traefik

## Role
Act as a Software Architect and IT Infrastructure Engineer expert in Docker, Traefik, and Google Cloud Infrastructure.

## Context
VM GCI: `gcvmuser@34.174.56.186`  
SSH: `ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186`  
App directory en VM: `~/MISEIA150_ayuntamientos`  
Dominio de la app: `ayuntamientos.deviaaps.com`  
Puerto interno Next.js: `3000`  
Puerto Traefik externo: `30001` (redirigido desde 443 vía wildcard `*.deviaaps.com`)  
Red Docker existente en VM: `miseia-net` (definida en `docker-compose.yml` de infraestructura)  
Traefik ya corriendo en VM con certresolver `cloudflare` y wildcard `*.deviaaps.com`  

Servicios en VM disponibles en red miseia-net:
- MongoDB: `mongodb:27017` (usuario: admin, password: MongoAdmin2024!)
- RustFS: `rustfs:9000` (accessKey: rustfsadmin, secretKey: RustfsSecret2024!)
- MailHog: `mailhog:1025` (SMTP)

MongoDB connection string de producción:
`mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`

## Task
Crear los artefactos de infraestructura para desplegar la aplicación Next.js en la VM GCI usando Docker y Traefik. La app debe ser accesible en `https://ayuntamientos.deviaaps.com`.

### Artefactos a crear:

**1. `Dockerfile`** (multi-stage, optimizado para Next.js standalone):
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Requiere añadir `output: 'standalone'` en `next.config.ts`.

**2. `docker-compose.prod.yml`**:
```yaml
services:
  ayuntamientos:
    build: .
    container_name: ayuntamientos
    restart: unless-stopped
    env_file:
      - env.production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.ayuntamientos.rule=Host(`ayuntamientos.deviaaps.com`)"
      - "traefik.http.routers.ayuntamientos.entrypoints=websecure"
      - "traefik.http.routers.ayuntamientos.tls=true"
      - "traefik.http.routers.ayuntamientos.tls.certresolver=cloudflare"
      - "traefik.http.services.ayuntamientos-svc.loadbalancer.server.port=3000"
    networks:
      - miseia-net

networks:
  miseia-net:
    external: true
```

**3. `env.production`**:
```env
MONGODB_URI=mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin
MONGODB_DB=sede_electronica
AWS_USERNAME=rustfsadmin
AWS_PASSWORD=RustfsSecret2024!
AWS_REGION=us-east-1
AWS_URL=http://rustfs:9000
AWS_BUCKET=sede-electronica
MAILHOG_HOST=mailhog
MAIL_PORT=1025
JWT_SECRET=<CAMBIAR_POR_SECRET_FUERTE_32_CHARS>
NEXT_PUBLIC_API_URL=https://ayuntamientos.deviaaps.com
NODE_ENV=production
```

**IMPORTANTE**: `env.production` NO se commitea al repositorio (añadir a `.gitignore`). Se sube manualmente a la VM.

### Steps de deploy en VM:
```bash
ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186

# Primera vez:
git clone https://github.com/Jorgeaapaz/MISEIA_1-4-150-ayuntamientos.git ~/MISEIA150_ayuntamientos
cd ~/MISEIA150_ayuntamientos
# Copiar env.production manualmente (scp o nano)
docker compose -f docker-compose.prod.yml up -d --build

# Actualizaciones posteriores (gestionadas por CI/CD):
cd ~/MISEIA150_ayuntamientos && git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
```

### README Guidelines:
Añadir sección "Deploy a Producción" con:
- URL pública: `https://ayuntamientos.deviaaps.com`
- Pasos de primer deploy
- Pasos de actualización via CI/CD

## Output format
- `Dockerfile` en raíz del proyecto
- `docker-compose.prod.yml` en raíz del proyecto
- `env.production` en raíz (sin secretos reales si se commitea; con secretos reales solo en VM)
- `next.config.ts` actualizado con `output: 'standalone'`
- `.gitignore` actualizado para excluir `env.production`
- Sección "Deploy" en README con URL pública documentada

## Examples and Steps to Follow
1. Crear rama `feat/docker-deploy`
2. Añadir `output: 'standalone'` en `next.config.ts`
3. Crear `Dockerfile` multi-stage
4. Crear `docker-compose.prod.yml` con Traefik labels
5. Crear `env.production` con valores de producción
6. Añadir `env.production` al `.gitignore`
7. Verificar build local: `docker build -t ayuntamientos .`
8. Subir `env.production` a la VM via scp
9. Deploy en VM y verificar que https://ayuntamientos.deviaaps.com responde
10. Actualizar README con URL pública

## Output Checklist and Guardrails
- [ ] `docker build` exitoso localmente
- [ ] `env.production` en `.gitignore`
- [ ] App accesible en https://ayuntamientos.deviaaps.com
- [ ] HTTPS con certificado válido (Traefik + Cloudflare)
- [ ] MongoDB conecta correctamente en producción
- [ ] S3/RustFS opera correctamente
- [ ] MailHog accesible desde el contenedor
- [ ] README documenta la URL pública
- [ ] `next.config.ts` tiene `output: 'standalone'`
