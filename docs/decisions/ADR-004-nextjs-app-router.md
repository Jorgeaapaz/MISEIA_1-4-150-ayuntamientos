# ADR-004: Next.js 16 App Router en lugar de Pages Router

## Estado
Aceptada

## Contexto
Next.js 16 ofrece dos paradigmas de routing: el **App Router** (nuevo, basado en React Server Components) y el **Pages Router** (legacy, basado en `getServerSideProps`/`getStaticProps`). El proyecto arranca desde cero, lo que permite elegir sin deuda técnica.

## Decisión
Se usa el **App Router** con la convención `app/` directory, React Server Components por defecto, y `'use client'` explícito donde se necesita interactividad.

## Consecuencias

**Positivas:**
- **Server Components** permiten que los componentes accedan directamente a MongoDB sin pasar por una API route, reduciendo la latencia en páginas de solo lectura
- `layout.tsx` anidados permiten compartir `Header`/`Footer` sin duplicación entre rutas del mismo grupo
- `loading.tsx` y `error.tsx` por convención de Next.js gestionan estados de carga/error sin código adicional
- Alineado con el futuro de Next.js: Pages Router está en modo mantenimiento

**Negativas / Trade-offs:**
- Mayor complejidad conceptual: la distinción "client" vs "server" es implícita y requiere atención al usar hooks o acceder a `window`/`localStorage`
- `GlobalContext` con `localStorage` (auth) debe estar en un Client Component con `'use client'`, lo que implica envolver toda la app en un provider cliente
- Algunos errores de "hydration mismatch" menos obvios que en Pages Router cuando se mezclan server y client incorrectamente
- La documentación de la comunidad tiene más ejemplos de Pages Router; algunos paquetes de terceros aún no son compatibles con Server Components

## Alternativas Consideradas

| Alternativa | Razón de rechazo |
|---|---|
| Pages Router (Next.js legacy) | En modo mantenimiento; perdería beneficios de Server Components; menos alineado con la dirección del ecosistema |
| Remix | Ecosistema más pequeño; convenciones distintas que aumentan la curva de aprendizaje sin ventaja clara para este dominio |
| SvelteKit | Cambio de framework completo; React 19 es el requisito del stack del proyecto |
