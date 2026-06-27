# PERT Compliance Plan — Sede Electrónica Ayuntamientos
**Fecha:** 2026-06-27  
**Proyecto:** MISEIA_1-4-150-ayuntamientos  

---

## PERT Compliance Plan

Lista lógica ordenada de tareas de corrección con dependencias y referencias a prompts.

### Nodo A — Entorno y Configuración Base
**Tarea A1** — Crear `.env.example`  
- Referencia: [`005_env_example_fn_prompt.md`](005_env_example_fn_prompt.md)  
- Dependencias: ninguna  
- Resultado: archivo `.env.example` en raíz con todas las variables sin valores reales  

### Nodo B — Tests Automatizados
**Tarea B1** — Implementar tests unitarios Jest + E2E Playwright  
- Referencia: [`001_tests_jest_playwright_fn_prompt.md`](001_tests_jest_playwright_fn_prompt.md)  
- Dependencias: A1 (variables de entorno conocidas para configurar tests)  
- Resultado: suite de tests Jest para `lib/auth.ts`, `lib/registro-numero.ts`, `lib/expediente-codigo.ts`; suite Playwright para flujos E2E  

### Nodo C — CI/CD Pipelines (paralelo)
**Tarea C1** — Pipeline GitHub Actions (CI + Deploy)  
- Referencia: [`002_ci_github_actions_fn_prompt.md`](002_ci_github_actions_fn_prompt.md)  
- Dependencias: B1 (tests deben existir para que CI los ejecute)  
- Resultado: `.github/workflows/ci-deploy.yml` que lintea, testa y despliega a VM GCI  

**Tarea C2** — Pipeline GitLab CI  
- Referencia: [`003_ci_gitlab_pipeline_fn_prompt.md`](003_ci_gitlab_pipeline_fn_prompt.md)  
- Dependencias: B1 (tests deben existir)  
- Resultado: `.gitlab-ci.yml` con stages lint, test, build, deploy  

### Nodo D — Deploy Producción
**Tarea D1** — Crear `env.production`, Dockerfile y despliegue en GCI VM  
- Referencia: [`004_deploy_gci_docker_fn_prompt.md`](004_deploy_gci_docker_fn_prompt.md)  
- Dependencias: C1 (el pipeline de GitHub gestiona el deploy; D1 crea los artefactos que C1 usa)  
- Resultado: `Dockerfile`, `docker-compose.prod.yml`, `env.production`, app accesible en `ayuntamientos.deviaaps.com`  

### Nodo E — UI Estados de Carga (paralelo con B)
**Tarea E1** — Añadir skeletons, spinners y empty states en todas las páginas  
- Referencia: [`008_ui_loading_states_fn_prompt.md`](008_ui_loading_states_fn_prompt.md)  
- Dependencias: ninguna (independiente)  
- Resultado: estados loading/error/vacío consistentes en todas las vistas  

### Nodo F — Documentación Complementaria (paralelo con B)
**Tarea F1** — Crear `.env.example` y diagrama de arquitectura  
- Referencia: [`006_architecture_diagram_fn_prompt.md`](006_architecture_diagram_fn_prompt.md)  
- Dependencias: A1  
- Resultado: diagrama Mermaid en `docs/architecture.md` e integrado en README  

**Tarea F2** — Documentar decisiones técnicas, ADRs y revisión IA  
- Referencia: [`007_docs_decisions_fn_prompt.md`](007_docs_decisions_fn_prompt.md)  
- Dependencias: F1 (el diagrama fundamenta algunas decisiones)  
- Resultado: sección "Decisiones" en README con trade-offs reales; `docs/decisions/` con ADRs; sección revisión IA  

---

## Execution PERT

Orden de ejecución según dependencias del grafo PERT:

| # | Tarea | Descripción | Dependencias | Archivo Prompt | Prioridad |
|---|---|---|---|---|---|
| 1 | A1 | Crear `.env.example` con todas las variables | — | `005_env_example_fn_prompt.md` | 🔴 Alta |
| 2 | E1 | Añadir estados loading/error/vacío en UI | — | `008_ui_loading_states_fn_prompt.md` | 🟡 Media |
| 3 | B1 | Implementar tests Jest (unitarios) + Playwright (E2E) | A1 | `001_tests_jest_playwright_fn_prompt.md` | 🔴 Alta |
| 4 | F1 | Crear diagrama de arquitectura Mermaid | A1 | `006_architecture_diagram_fn_prompt.md` | 🟡 Media |
| 5 | F2 | Documentar decisiones técnicas, ADRs y revisión IA | F1 | `007_docs_decisions_fn_prompt.md` | 🟡 Media |
| 6 | C1 | Pipeline GitHub Actions (CI lint+test + deploy a GCI) | B1 | `002_ci_github_actions_fn_prompt.md` | 🔴 Alta |
| 7 | C2 | Pipeline GitLab CI (lint + test + build + deploy) | B1 | `003_ci_gitlab_pipeline_fn_prompt.md` | 🔴 Alta |
| 8 | D1 | Dockerfile + docker-compose.prod + env.production + deploy GCI | C1 | `004_deploy_gci_docker_fn_prompt.md` | 🔴 Alta |

> **Camino Crítico:** A1 → B1 → C1 → D1 (duración estimada: 4 iteraciones de trabajo)  
> Las tareas E1, F1, F2, C2 pueden ejecutarse en paralelo con las del camino crítico.
