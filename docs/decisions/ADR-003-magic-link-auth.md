# ADR-003: Autenticación por Magic Link en lugar de contraseña

## Estado
Aceptada

## Contexto
El sistema es una sede electrónica pública. Los usuarios (administrados) son ciudadanos ocasionales que pueden usar el sistema pocas veces al año. Gestionar contraseñas implica: almacenamiento seguro (bcrypt), recuperación de contraseña olvidada, política de complejidad, y riesgo de reutilización de contraseñas débiles.

## Decisión
Se usa **Magic Link**: el usuario introduce solo su email, recibe un JWT de corta duración (15 min) por email, y al hacer clic obtiene un JWT de sesión de 7 días. No se almacenan contraseñas.

## Consecuencias

**Positivas:**
- Elimina la clase entera de vulnerabilidades relacionadas con contraseñas (fuerza bruta, reutilización, almacenamiento)
- UX simplificada para usuarios ocasionales: sin registro previo ni recordar contraseñas
- No es necesario implementar flujo de "olvidé mi contraseña"
- Los tokens de magic link son de un solo uso (`used: true` tras verificación) y expiran en 15 minutos

**Negativas / Trade-offs:**
- Dependencia del email: si el usuario no tiene acceso al email en el momento, no puede autenticarse
- En producción, requiere un proveedor SMTP fiable (en desarrollo se usa MailHog local)
- El JWT de sesión (7 días) no se puede revocar sin mantener una lista negra en BD; si se filtra, es válido hasta su expiración

## Alternativas Consideradas

| Alternativa | Razón de rechazo |
|---|---|
| Username/password + bcrypt | Añade complejidad de gestión de contraseñas, formulario de registro separado, y riesgo de contraseñas débiles |
| OAuth (Google, DNI electrónico) | Dependencia externa; integración con Cl@ve/DNI-e requiere certificados y burocracia fuera del scope del proyecto |
| OTP por SMS | Coste de proveedor SMS; complejidad de integración; email es suficiente para el contexto |
