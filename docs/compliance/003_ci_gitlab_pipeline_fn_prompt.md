@~/.claude/prompts/new_functionality_prompt_spec.md

# Crear Pipeline GitLab CI — Sede Electrónica Ayuntamientos

## Role
Act as a Software Architect and DevOps Engineer expert in GitLab CI/CD and Docker deployments.

## Context
Proyecto: Sede Electrónica — Next.js 16 / React 19 / TypeScript / MongoDB  
Ruta del proyecto: `D:\Master-IA-Dev\04-Bloque4\1-4-150-ayuntamientos\ayuntamientos`  
Repositorio GitLab: https://gitlab.codecrypto.academy/jorgeaapaz/MISEIA_1-4-150-ayuntamientos  
VM GCI: `gcvmuser@34.174.56.186`  
SSH key local: `C:\ubuntuiso\.ssh\vboxuser`  
App directory en VM: `~/MISEIA150_ayuntamientos`  
Dominio: `ayuntamientos.deviaaps.com`  
Red Docker en VM: `miseia-net`  

## Task
Crear `.gitlab-ci.yml` con pipeline de CI que ejecute lint, tests, build y deploy. Usar /glab para configurar variables de CI en GitLab.

### GitLab CI Guidelines
1. Usar `/glab` skill para gestionar variables CI/CD en GitLab
2. Crear `.gitlab-ci.yml` en la raíz del proyecto
3. Stages en orden: `lint`, `test`, `build`, `deploy`
4. **IMPORTANTE**: `NODE_ENV=production` solo como variable del step `build`, NO como variable de nivel de job
5. Imagen base: `node:20-alpine`
6. Caché de `node_modules/` entre jobs con key basada en `package-lock.json`

### Definición de stages:

```yaml
stages:
  - lint
  - test
  - build
  - deploy

variables:
  # NO poner NODE_ENV aquí

lint:
  stage: lint
  image: node:20-alpine
  cache: { ... }
  script:
    - npm ci
    - npm run lint

test:
  stage: test
  image: node:20-alpine
  cache: { ... }
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: node:20-alpine
  variables:
    NODE_ENV: production   # Solo aquí
  cache: { ... }
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - .next/

deploy:
  stage: deploy
  image: alpine:latest
  only:
    - master
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | ssh-add -
    - mkdir -p ~/.ssh
    - ssh-keyscan -H 34.174.56.186 >> ~/.ssh/known_hosts
  script:
    - ssh gcvmuser@34.174.56.186 "cd ~/MISEIA150_ayuntamientos && git pull origin master && docker compose -f docker-compose.prod.yml up -d --build"
```

### Variables CI/CD requeridas en GitLab:
Configurar con `glab variable set` o desde GitLab UI (Settings > CI/CD > Variables):
- `SSH_PRIVATE_KEY` — contenido del archivo `C:\ubuntuiso\.ssh\vboxuser` (tipo: File, Masked)
- `JWT_SECRET_PROD` — secreto JWT de producción (tipo: Variable, Masked)

## Output format
- `.gitlab-ci.yml` completo y funcional
- Comandos `glab variable set` para configurar las variables
- README actualizado mencionando el pipeline de GitLab

## Examples and Steps to Follow
1. Crear rama `feat/ci-gitlab-pipeline`
2. Verificar que los tests existen (requiere `001_tests_jest_playwright_fn_prompt.md` completado)
3. Verificar que el Dockerfile y `docker-compose.prod.yml` existen (requiere `002_ci_github_actions_fn_prompt.md` completado)
4. Configurar variables en GitLab con `glab variable set`
5. Crear `.gitlab-ci.yml`
6. Push a GitLab y verificar que el pipeline pasa
7. Verificar el badge de pipeline en el README

## Output Checklist and Guardrails
- [ ] Pipeline GitLab pasa (verde) en todos los stages
- [ ] `NODE_ENV=production` solo en el stage `build`, no como variable global
- [ ] SSH_PRIVATE_KEY configurada como variable Masked en GitLab
- [ ] Sin credenciales en `.gitlab-ci.yml`
- [ ] Deploy solo se ejecuta en push a `master`
- [ ] Badge de pipeline añadido al README
