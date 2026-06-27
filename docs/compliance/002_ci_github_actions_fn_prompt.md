@~/.claude/prompts/new_functionality_prompt_spec.md

# Create a Github CI/CD Pipeline and Deploy App to VM at Google Cloud

## Role
Act as a Software Architect, you are an expert in Github and Google Cloud Services

## Task
Create Github actions that allows to compile and deploy the app to `ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186` in the directory ~/MISEIA150_ayuntamientos. Test and build must be done in a GitHub Actions. The service must be created in the remote ubuntu VM in Docker.

The app must be accessible through Traefik using the domain ayuntamientos.deviaaps.com, port 30001, use the traefik wildcard *.deviaaps.com.

Use /gh and gcloud for all secrets required.

## Context
Proyecto: Sede Electrónica — Next.js 16 / React 19 / TypeScript / MongoDB  
Ruta del proyecto: `D:\Master-IA-Dev\04-Bloque4\1-4-150-ayuntamientos\ayuntamientos`  
Repositorio GitHub: https://github.com/Jorgeaapaz/MISEIA_1-4-150-ayuntamientos  
VM GCI: `gcvmuser@34.174.56.186`  
SSH key local: `C:\ubuntuiso\.ssh\vboxuser`  
App directory en VM: `~/MISEIA150_ayuntamientos`  
Dominio: `ayuntamientos.deviaaps.com`  
Puerto interno app: `3000`, puerto Traefik externo: `30001`  
Red Docker en VM: `miseia-net`  
MongoDB en VM: `mongodb://admin:MongoAdmin2024!@mongodb:27017/?authSource=admin` (contenedor en miseia-net)  
RustFS en VM: URL interna `http://rustfs:9000`  

Variables de entorno de producción (ver `env.production`):
- `MONGODB_URI=mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`
- `MONGODB_DB=sede_electronica`
- `AWS_USERNAME=rustfsadmin`
- `AWS_PASSWORD=RustfsSecret2024!`
- `AWS_REGION=us-east-1`
- `AWS_URL=http://rustfs:9000`
- `AWS_BUCKET=sede-electronica`
- `MAILHOG_HOST=mailhog`
- `MAIL_PORT=1025`
- `JWT_SECRET=<secreto fuerte de producción>`
- `NEXT_PUBLIC_API_URL=https://ayuntamientos.deviaaps.com`
- `NODE_ENV=production`

## GitHub Actions Guidelines
1. Usar `/gh-cli` skill para gestionar secrets en GitHub
2. Crear `.github/workflows/ci-deploy.yml`
3. Stages:
   - **lint**: `npm run lint`
   - **test**: `npm test` (requiere que los tests existan — ver `001_tests_jest_playwright_fn_prompt.md`)
   - **build**: `npm run build` con `NODE_ENV=production` solo en este step
   - **deploy**: SSH a la VM, pull del repo, rebuild contenedor Docker
4. Secrets necesarios en GitHub:
   - `SSH_PRIVATE_KEY` — contenido de `C:\ubuntuiso\.ssh\vboxuser`
   - `VM_HOST` — `34.174.56.186`
   - `VM_USER` — `gcvmuser`
   - `JWT_SECRET_PROD` — secret JWT de producción (mínimo 32 chars)
   - `CF_TOKEN` — Token de API de Cloudflare (obtenido de la cuenta Cloudflare del proyecto)
5. El deploy step debe:
   - Conectarse a la VM via SSH
   - `cd ~/MISEIA150_ayuntamientos && git pull origin master`
   - `docker compose -f docker-compose.prod.yml up -d --build`
6. Traefik labels en `docker-compose.prod.yml`:
   ```yaml
   labels:
     - "traefik.enable=true"
     - "traefik.http.routers.ayuntamientos.rule=Host(`ayuntamientos.deviaaps.com`)"
     - "traefik.http.routers.ayuntamientos.entrypoints=websecure"
     - "traefik.http.routers.ayuntamientos.tls=true"
     - "traefik.http.routers.ayuntamientos.tls.certresolver=cloudflare"
     - "traefik.http.services.ayuntamientos-svc.loadbalancer.server.port=3000"
   networks:
     - miseia-net
   ```

## Output format
- `.github/workflows/ci-deploy.yml`
- `Dockerfile` (multi-stage: builder + runner)
- `docker-compose.prod.yml`
- `env.production` (sin valores secretos reales, usar placeholders para los secrets)
- Comandos `gh secret set` para configurar los secrets en GitHub
- README actualizado con sección "Deploy"

## Examples and Steps to Follow
1. Crear rama `feat/ci-github-actions`
2. Crear `Dockerfile` multi-stage optimizado para Next.js (standalone output)
3. Añadir `output: 'standalone'` en `next.config.ts`
4. Crear `docker-compose.prod.yml` con Traefik labels y red miseia-net
5. Crear `env.production` con variables (secrets como placeholders)
6. Configurar secrets en GitHub con `gh secret set`
7. Crear `.github/workflows/ci-deploy.yml`
8. Push y verificar que el workflow pasa en GitHub Actions
9. Verificar que la app responde en https://ayuntamientos.deviaaps.com

## Output Checklist and Guardrails
- [ ] Workflow pasa en GitHub Actions (verde)
- [ ] `npm run lint` y `npm test` pasan en CI
- [ ] Build de producción exitoso
- [ ] App desplegada y accesible en https://ayuntamientos.deviaaps.com
- [ ] HTTPS funcionando via Traefik + Cloudflare
- [ ] Sin secretos hardcodeados en archivos commiteados
- [ ] `env.production` commiteado sin valores secretos reales
