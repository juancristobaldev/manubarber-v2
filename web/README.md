# Frontend Next.js

Frontend App Router que reemplaza los HTML estáticos. Consulta el contrato GraphQL con Apollo Client y no contiene catálogo, servicios, galería, precios, horarios ni datos de contacto hardcodeados.

```bash
cp .env.example .env.local
npm install
npm run dev -- -p 3001
```

El script de desarrollo usa Turbopack y una caché separada (`.next-dev`) para no mezclarla con el build de producción. Si Next estuvo abierto antes de actualizar, detenlo con `Ctrl+C`, ejecuta `npm run clean` y vuelve a iniciarlo.

Antes de iniciar el sitio, levanta la API y ejecuta su migración/seed. El cliente requiere `NEXT_PUBLIC_GRAPHQL_URL`; por defecto apunta a `http://localhost:3000/graphql`.

Rutas: `/`, `/tienda`, `/vip`, `/capacitacion`, `/galeria` y `/admin`.
