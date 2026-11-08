# ManuBarber API

API de contenido y operación para el sitio, construida con NestJS, GraphQL code-first, Prisma y PostgreSQL.

## Arranque local

```bash
cp .env.example .env
# Configura DATABASE_URL, JWT_SECRET, ADMIN_EMAIL y ADMIN_PASSWORD
npm install
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run start:dev
```

GraphQL queda disponible en `http://localhost:3000/graphql`. Las mutaciones administrativas necesitan el header `Authorization: Bearer <accessToken>` obtenido con `adminLogin`.

Los medios se registran mediante URL con `createMediaAsset`; la carga binaria debe conectarse a un proveedor de almacenamiento (S3/R2/Cloudinary) antes de publicar el panel administrativo.

El contrato de contenido y operaciones está documentado en [`docs/HARDCODED_DATA_AUDIT.md`](docs/HARDCODED_DATA_AUDIT.md).

## Agenda y pagos Flow

La web consulta `availableSlots(serviceId, date)` y envía `createBookingCheckout` con servicio, fecha, hora y datos del cliente. El servidor calcula el abono como el 50 % del precio vigente, redondeado hacia arriba al peso, y bloquea el intervalo durante 15 minutos. La duración proviene del servicio; si no está configurada, se usa `BOOKING_DEFAULT_DURATION_MINUTES` (60 minutos por defecto). Configura las duraciones reales desde `/admin`. Los inicios se ofrecen cada 30 minutos por defecto, configurable mediante `BOOKING_SLOT_INTERVAL_MINUTES`. Los horarios se interpretan en `America/Santiago` (configurable en `BOOKING_TIMEZONE`).

El cobro se crea en Flow con vencimiento ligeramente anterior al fin del bloqueo. La notificación POST de Flow a `/payments/flow/confirmation` consulta `payment/getStatus` de servidor a servidor y comprueba orden, monto y moneda antes de confirmar. `/payments/flow/return` verifica el estado y redirige al resultado web; volver del checkout por sí solo no confirma la reserva. Los pagos posteriores al vencimiento que ya no pueden agendarse quedan en estado `REVIEW`, visibles en `/admin`: requieren contactar al cliente y gestionar manualmente una nueva hora o la devolución en Flow. No hay reembolso automático.

1. Aplica las migraciones con `npm run prisma:deploy` y configura las variables de `server/.env.example` en el entorno de la API. No publiques las credenciales ni las pongas en variables `NEXT_PUBLIC_*`.
2. Usa las credenciales de sandbox, `FLOW_API_URL=https://sandbox.flow.cl/api`, y configura `API_PUBLIC_URL` como una URL HTTPS pública que Flow pueda alcanzar (un túnel HTTPS para desarrollo). `WEB_PUBLIC_URL` apunta a la web de retorno. Reinicia la API tras modificar su entorno.
3. Antes de producción, prueba pagos aprobados, rechazados, cancelados y notificaciones tardías en el sandbox con tus credenciales y un túnel. Para producción usa las credenciales correspondientes y `https://www.flow.cl/api`; verifica que ambas URLs públicas sean HTTPS. Si Flow no está configurado, no se crea una reserva ni un pago.

Para pruebas de integración, usa exclusivamente una base PostgreSQL aislada cuyo nombre contenga `_test_`, aplica las migraciones en esa base y ejecuta `TEST_DATABASE_URL=... npm run test:booking`. Se utiliza PostgreSQL real y Flow simulado como frontera externa. Con una API de prueba activa, `TEST_GRAPHQL_URL=http://localhost:3189/graphql npm run test:booking-contract` valida los documentos web contra el esquema GraphQL activo.

## Panel de administración

En `/admin`, inicia sesión con la cuenta administradora configurada en la base. El panel permite gestionar servicios, productos y variantes, planes y beneficios, cursos y módulos, categorías y trabajos de galería, medios por URL, navegación, horarios y ajustes de contenido. Incluye borradores y archivados, solicitudes recibidas y cambios de estado de reservas. Los ajustes de contenido avanzados se editan como JSON y deben conservar su estructura. Las imágenes se registran por URL o ruta; no hay carga binaria de archivos ni alojamiento de imágenes integrado. Las operaciones con registros relacionados pueden impedir una eliminación; en ese caso archiva el contenido. Cancelar una cita no inicia un reembolso de Flow.

La prueba `TEST_DATABASE_URL=... TEST_GRAPHQL_URL=... npm run test:admin` usa una base aislada y la API de prueba activa para comprobar autenticación, permisos, borradores, cambios publicados, variantes, horarios y solicitudes.
