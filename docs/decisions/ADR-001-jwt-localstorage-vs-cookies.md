# ADR-001: JWT en localStorage en lugar de cookies httpOnly

## Estado
Aceptada

## Contexto
El sistema requiere autenticación stateless para las API routes de Next.js. Se necesita un mecanismo para que el cliente envíe credenciales en cada petición. Las dos opciones estándar son: JWT en `localStorage` enviado como `Authorization: Bearer` header, o cookies `httpOnly` gestionadas automáticamente por el navegador.

## Decisión
Se usa **JWT almacenado en `localStorage`** bajo la clave `sede_token`, enviado en el header `Authorization: Bearer <token>` en cada petición a las API routes.

## Consecuencias

**Positivas:**
- Implementación más simple: sin gestión de cookies en el servidor, sin CSRF tokens
- Funciona con cualquier cliente (SPA, apps móviles, herramientas CLI) sin configuración especial
- El JWT incluye el `role` en el payload, eliminando una consulta extra a BD en cada petición
- No hay dependencia de comportamiento de cookies entre subdominios (relevante para el modelo SaaS multi-tenant)

**Negativas / Trade-offs:**
- **XSS risk**: código JavaScript malicioso inyectado en la página puede leer `localStorage` y robar el token. Con cookies `httpOnly`, este ataque es imposible.
- Requiere limpiar `localStorage` en logout explícitamente (no expira automáticamente como una cookie de sesión)
- No funciona en contextos sin JavaScript (SSR puro, crawlers)

## Alternativas Consideradas

| Alternativa | Razón de rechazo |
|---|---|
| Cookies `httpOnly` + CSRF tokens | Mayor complejidad de implementación; requiere gestionar SameSite, CORS, y protección CSRF; el enunciado del proyecto indica explícitamente "NO SE USAN COOKIES" |
| Sesiones en servidor (Redis) | Añade infraestructura con estado; rompe el modelo stateless; complejidad de escalado horizontal |
| Refresh tokens en cookie + access token en memoria | Complejidad adicional no justificada para el alcance del proyecto |
