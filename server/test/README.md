# Pruebas y límites

Desde `server`, `npx tsx test/auth.unit.ts` ejecuta autenticación sin red ni base de datos: usa búsqueda de usuario simulada y JWT/argon2 reales. No prueba el endpoint GraphQL ni la persistencia.

`npm run test:booking-contract` necesita `TEST_GRAPHQL_URL` apuntando a una API de prueba con introspección habilitada. Valida los documentos exportados por `web/lib/operations.ts` contra su esquema activo; no ejecuta las operaciones ni prueba autorización. La API debe estar aislada y configurada con su propia base de pruebas. No hay generación de tipos GraphQL ni validación contractual desconectada.

`test:booking` y `test:admin` requieren PostgreSQL exclusivamente dedicado y migrado, con `_test_` en el nombre, y crean o modifican registros sin limpiarlos. El primero modifica horarios y simula Flow; el segundo además requiere una API conectada a esa misma base. El marcador en el nombre no garantiza aislamiento: verifica ambos destinos antes de ejecutarlos y descarta la base dedicada después. La prueba admin espera Flow sin configurar.

La simulación de Flow no verifica credenciales, disponibilidad, checkout real, notificaciones o retornos HTTPS. Antes de publicar se requiere sandbox con credenciales y URL HTTPS pública, probando aprobación, rechazo, cancelación y notificación tardía. No hay pruebas E2E de navegador que cubran interfaz, navegación, checkout externo y retorno; tampoco hay infraestructura de pruebas de componentes en `web`.
