@~/.claude/prompts/new_functionality_prompt_spec.md

# Implementar Tests Automatizados Jest + Playwright

## Role
Act as a Software Developer and QA Engineer expert in TypeScript, Jest, and Playwright testing for Next.js applications.

## Context
Proyecto: Sede Electrónica — Next.js 16 / React 19 / TypeScript / MongoDB  
Ruta del proyecto: `D:\Master-IA-Dev\04-Bloque4\1-4-150-ayuntamientos\ayuntamientos`  
Repositorio GitHub: https://github.com/Jorgeaapaz/MISEIA_1-4-150-ayuntamientos  

Estado actual: Sin ningún test automatizado. El AGENTS.md especifica:
- **Jest** para pruebas unitarias de `lib/auth.ts`, `lib/registro-numero.ts`, `lib/expediente-codigo.ts`
- **Playwright** para pruebas E2E cubriendo: login magic link, presentar instancia, ver registros, crear expediente, añadir actuación

Archivos clave a testear:
- `lib/auth.ts` — helpers JWT: `signToken`, `verifyToken`, `extractFromHeader`
- `lib/registro-numero.ts` — generador de números REG-YYYY-NNNNN
- `lib/expediente-codigo.ts` — generador de códigos EXP-YYYY-NNNNN

## Task
Configurar Jest para tests unitarios y Playwright para tests E2E en el proyecto Next.js. Implementar tests que cubran los flujos críticos.

### Tests Jest Guidelines
1. Instalar dependencias: `jest`, `@types/jest`, `ts-jest`, `jest-environment-node`
2. Crear `jest.config.ts` en la raíz
3. Crear directorio `__tests__/unit/`
4. Tests unitarios requeridos:
   - `__tests__/unit/auth.test.ts`: signToken genera JWT válido, verifyToken valida correctamente, verifyToken rechaza token expirado, verifyToken rechaza firma inválida, extractFromHeader extrae token del header Bearer
   - `__tests__/unit/registro-numero.test.ts`: formato correcto REG-YYYY-NNNNN, incrementa correlativo
   - `__tests__/unit/expediente-codigo.test.ts`: formato correcto EXP-YYYY-NNNNN, incrementa correlativo
5. Añadir script `"test": "jest"` y `"test:coverage": "jest --coverage"` en package.json

### Tests Playwright Guidelines
1. Instalar: `@playwright/test`, `npx playwright install chromium`
2. Crear `playwright.config.ts` apuntando a `http://localhost:3000`
3. Crear directorio `__tests__/e2e/`
4. Tests E2E requeridos:
   - `__tests__/e2e/auth.spec.ts`: navegar a /login, introducir email, verificar que aparece mensaje de "enlace enviado"
   - `__tests__/e2e/registros.spec.ts`: (con mock de auth) navegar a /mis-registros, verificar que carga la lista
   - `__tests__/e2e/instancia.spec.ts`: navegar a /instancia/nueva, rellenar formulario básico, verificar submit
5. Añadir script `"test:e2e": "playwright test"` en package.json
6. Configurar `baseURL`, `timeout: 30000`, `use: { headless: true }`

### README Guidelines
Añadir sección "Testing" con:
```bash
# Tests unitarios
npm test

# Tests con cobertura
npm run test:coverage

# Tests E2E (requiere app corriendo en localhost:3000)
npm run test:e2e
```

## Output format
- `jest.config.ts` en raíz
- `playwright.config.ts` en raíz
- `__tests__/unit/auth.test.ts`
- `__tests__/unit/registro-numero.test.ts`
- `__tests__/unit/expediente-codigo.test.ts`
- `__tests__/e2e/auth.spec.ts`
- `package.json` actualizado con nuevas dependencias y scripts

## Examples and Steps to Follow
1. Crear rama `feat/tests-jest-playwright`
2. Instalar dependencias de test
3. Configurar Jest con ts-jest para TypeScript
4. Escribir tests unitarios (mocking de MongoDB donde sea necesario con `jest.mock`)
5. Configurar Playwright
6. Escribir tests E2E básicos
7. Ejecutar `npm test` y verificar que pasan
8. Ejecutar `npm run test:coverage` y verificar cobertura >40% global
9. Commit y PR

## Output Checklist and Guardrails
- [ ] `npm test` pasa sin errores
- [ ] `npm run test:coverage` muestra cobertura >40% en `lib/`
- [ ] `npm run lint` sigue pasando
- [ ] No hay credenciales hardcodeadas en los tests
- [ ] Los tests unitarios de auth cubren casos positivos Y negativos
- [ ] El JWT_SECRET en tests usa una constante de test, no la de producción
