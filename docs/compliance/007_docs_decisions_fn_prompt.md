@~/.claude/prompts/new_functionality_prompt_spec.md

# Documentar Decisiones Técnicas, ADRs y Revisión IA

## Role
Act as a Software Architect and Technical Writer expert in documenting architectural decisions and trade-offs.

## Context
Proyecto: Sede Electrónica — Next.js 16 / React 19 / TypeScript / MongoDB  
Ruta: `D:\Master-IA-Dev\04-Bloque4\1-4-150-ayuntamientos\ayuntamientos`  

Decisiones técnicas tomadas en el proyecto (identificadas en el código):
1. **JWT stateless vs sesiones con servidor**: Se eligió JWT almacenado en localStorage sobre cookies/sesiones
2. **MongoDB vs PostgreSQL/relacional**: Se eligió MongoDB para el modelo de datos del dominio público
3. **Magic Link vs password**: Se eligió autenticación sin contraseña
4. **Next.js App Router vs Pages Router**: Se eligió App Router (nuevo paradigma)
5. **RustFS vs MinIO vs S3 real**: Se eligió RustFS (S3-compatible) para almacenamiento local

Criterios de evaluación no cumplidos:
- `dc_decisiones_documentadas`: Sección "Patrones" existe pero sin trade-offs explícitos
- `dc_cambios_ia_documentados`: Sin documentación de revisión crítica de borradores IA
- `dc_adrs_o_decision_log`: Sin ADRs estructurados

## Task
Crear documentación de decisiones técnicas en formato ADR, añadir trade-offs reales al README, y documentar la revisión crítica de los borradores generados por IA.

### ADR Guidelines
Crear `docs/decisions/` con archivos ADR individuales:

**Formato ADR:**
```markdown
# ADR-001: [Título]

## Estado
Aceptada

## Contexto
[Por qué se tuvo que tomar esta decisión]

## Decisión
[Qué se decidió]

## Consecuencias
**Positivas:**
- ...

**Negativas / Trade-offs:**
- ...

## Alternativas Consideradas
| Alternativa | Razón de rechazo |
|---|---|
| ... | ... |
```

**ADRs a crear:**
- `docs/decisions/ADR-001-jwt-localstorage-vs-cookies.md`
  - Contexto: necesidad de auth sin servidor de sesiones
  - Trade-off clave: XSS risk en localStorage vs CSRF risk en cookies; se eligió JWT+localStorage por simplicidad de implementación en SPA y ausencia de estado servidor
  
- `docs/decisions/ADR-002-mongodb-vs-sql.md`
  - Contexto: modelo de datos con documentos anidados (adjuntos en registros, actuaciones en expedientes)
  - Trade-off clave: flexibilidad de esquema vs integridad referencial; MongoDB elegido por encajar con documentos anidados de instancias

- `docs/decisions/ADR-003-magic-link-auth.md`
  - Contexto: sistema de administración pública donde la seguridad de cuentas es crítica
  - Trade-off: elimina riesgo de passwords débiles pero requiere acceso al email

- `docs/decisions/ADR-004-nextjs-app-router.md`
  - Contexto: Next.js 16 como framework; elección entre App Router y Pages Router
  - Trade-off: App Router permite Server Components (mejor DX y performance) pero tiene curva de aprendizaje y mayor complejidad en data fetching

### README — Sección "Decisiones Técnicas"
Añadir sección con tabla resumiendo los 4 ADRs con trade-offs principales:

| Decisión | Elegido | Alternativa | Trade-off Principal |
|---|---|---|---|
| Auth storage | JWT en localStorage | Cookies httpOnly | XSS risk vs CSRF risk |
| Base de datos | MongoDB | PostgreSQL | Flexibilidad de esquema vs integridad referencial |
| Autenticación | Magic Link | Password + hash | UX simplificado vs dependencia del email |
| Router Next.js | App Router | Pages Router | Server Components vs madurez/estabilidad |

### README — Sección "Uso de IA y Revisión Crítica"
Añadir sección documentando:
1. Qué partes fueron generadas con asistencia de IA (Claude Code)
2. Qué se cambió/revisó respecto a los borradores:
   - Ejemplo: corrección de tipos TypeScript erróneos en borradores de API routes
   - Ejemplo: ajuste de la lógica de verificación del magic link para evitar doble verificación
   - Ejemplo: corrección de configuración de S3 client para RustFS (endpoint custom)
3. Qué se validó manualmente antes de commitear

## Output format
- `docs/decisions/ADR-001-jwt-localstorage-vs-cookies.md`
- `docs/decisions/ADR-002-mongodb-vs-sql.md`
- `docs/decisions/ADR-003-magic-link-auth.md`
- `docs/decisions/ADR-004-nextjs-app-router.md`
- `README.md` actualizado con sección "Decisiones Técnicas" y sección "Uso de IA"

## Examples and Steps to Follow
1. Crear rama `feat/docs-decisions-adrs`
2. Crear directorio `docs/decisions/`
3. Crear los 4 ADRs con trade-offs reales basados en el código existente
4. Actualizar README con tabla de decisiones y sección de IA
5. Verificar que las decisiones referenciadas existen en el código
6. Commit y PR

## Output Checklist and Guardrails
- [ ] 4 ADRs creados con formato completo (contexto, decisión, consecuencias, alternativas)
- [ ] Los trade-offs son ESPECÍFICOS al proyecto, no genéricos
- [ ] README tiene sección "Decisiones Técnicas" con tabla
- [ ] README tiene sección "Uso de IA y Revisión Crítica" con ejemplos concretos
- [ ] No hay afirmaciones genéricas como "usé MongoDB porque es flexible" sin más detalle
- [ ] Al menos una decisión menciona una alternativa concreta que se descartó
