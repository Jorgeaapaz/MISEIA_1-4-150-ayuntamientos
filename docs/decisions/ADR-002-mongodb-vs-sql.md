# ADR-002: MongoDB en lugar de PostgreSQL/SQL relacional

## Estado
Aceptada

## Contexto
El modelo de datos del proyecto incluye documentos con arrays embebidos de longitud variable: `Registro` contiene un array `adjuntos[]`, y `Expediente` contiene un array `actuaciones[]`. Se necesita elegir entre una base de datos documental (MongoDB) y una relacional (PostgreSQL).

## Decisión
Se usa **MongoDB 7** como única base de datos, con documentos que embeben los arrays donde tiene sentido por cardinalidad y patrón de acceso.

## Consecuencias

**Positivas:**
- Los arrays `adjuntos` y `actuaciones` se leen siempre junto al documento padre → un único `findOne` devuelve todo; con SQL se necesitarían JOINs o queries adicionales
- Esquema flexible: añadir campos a `Registro` o `Expediente` no requiere migraciones de tabla
- El driver oficial `mongodb` para Node.js tiene tipado TypeScript completo y se integra bien con Next.js (singleton de `MongoClient`)
- Coherente con el patrón documental: una instancia general es un "documento" en el sentido administrativo y en el técnico

**Negativas / Trade-offs:**
- Sin integridad referencial nativa: si se elimina un `User`, sus `Registro` huérfanos no se borran automáticamente (se requiere lógica de aplicación)
- Sin transacciones multi-documento sin configuración adicional (replica set o `mongos`); en desarrollo single-node no hay transacciones ACID entre colecciones
- Consultas complejas tipo "todos los expedientes de registros en estado X" requieren `$lookup` (agregación) en lugar de JOIN SQL

## Alternativas Consideradas

| Alternativa | Razón de rechazo |
|---|---|
| PostgreSQL con JSONB para adjuntos | La mezcla de relacional + JSONB añade complejidad sin beneficio claro para este dominio; el esquema no tiene relaciones complejas M:N |
| PostgreSQL con tablas para adjuntos y actuaciones | Requiere 2 tablas adicionales + JOINs en cada lectura; el patrón de acceso es siempre "dame el registro con todos sus adjuntos" |
| SQLite | No apto para producción multi-usuario concurrente ni para deployment en Docker con volúmenes compartidos |
