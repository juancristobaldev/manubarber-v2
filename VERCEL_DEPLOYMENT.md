# Guía de Despliegue en Vercel (Producción) · ManuBarber

Este repositorio contiene dos proyectos preparados para producción en **Vercel**:
1. **`web`**: Aplicación Frontend en **Next.js 15 (App Router)** con React 19 y Apollo Client.
2. **`server`**: API Backend en **NestJS + GraphQL** con adaptador Serverless (`api/index.ts`), CORS dinámico para Vercel y almacenamiento resiliente.

---

## 🚀 Opción 1: Despliegue del Frontend en Vercel (`web`)

Esta es la configuración principal para tener el sitio web y panel de administración en Vercel.

### Pasos en Vercel Dashboard:
1. En [Vercel](https://vercel.com), haz clic en **"Add New..."** -> **"Project"**.
2. Conecta tu repositorio Git (`manubarber`).
3. En la sección **Configure Project**:
   - **Framework Preset**: Selecciona `Next.js`.
   - **Root Directory**: Haz clic en *Edit* y selecciona **`web`**.
   - **Build Command**: `next build` (predeterminado).
   - **Output Directory**: `.next` (predeterminado).
   - **Install Command**: `npm install` (predeterminado).

### Variables de Entorno para `web` en Vercel:
En **Project Settings -> Environment Variables**, añade:

| Variable | Valor de Ejemplo | Descripción |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_GRAPHQL_URL` | `https://api.manubarber.cl/graphql` | URL pública de tu API GraphQL |
| `NEXT_PUBLIC_API_URL` | `https://api.manubarber.cl` | URL pública para subidas multimedia y REST |
| `API_PROXY_URL` *(opcional)* | `https://api.manubarber.cl` | Si deseas proxy local de `/uploads` vía Next.js |

> El archivo de plantilla está disponible en [`web/.env.production.example`](file:///Users/juancristobal/manubarber/web/.env.production.example).

---

## ⚡ Opción 2: Despliegue del Backend API en Vercel (`server`)

El backend cuenta con un adaptador Serverless en [`server/api/index.ts`](file:///Users/juancristobal/manubarber/server/api/index.ts) y [`server/vercel.json`](file:///Users/juancristobal/manubarber/server/vercel.json).

### Pasos en Vercel Dashboard:
1. En [Vercel](https://vercel.com), añade un nuevo proyecto desde el mismo repositorio.
2. Nómbralo (ej. `manubarber-api`).
3. En la sección **Configure Project**:
   - **Root Directory**: Haz clic en *Edit* y selecciona **`server`**.
   - **Build Command**: `npm run build` (ejecuta `prisma generate` y `nest build`).
   - **Output Directory**: Dejar vacío / por defecto.
   - **Install Command**: `npm install`.

### Variables de Entorno para `server` en Vercel:
En **Project Settings -> Environment Variables**, añade:

| Variable | Valor de Ejemplo | Descripción |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Modo producción |
| `JWT_SECRET` | `un-secret-muy-largo-y-seguro-min-32-chars` | Clave secreta para tokens de autenticación |
| `ADMIN_EMAIL` | `admin@manubarber.cl` | Email del administrador principal |
| `ADMIN_PASSWORD` | `TuContraseñaAdminSegura2026!` | Contraseña inicial del administrador |
| `FRONTEND_ORIGIN` | `https://manubarber.cl,https://*.vercel.app` | Dominios frontend permitidos para CORS |
| `API_PUBLIC_URL` | `https://manubarber-api.vercel.app` | URL pública de este backend |
| `WEB_PUBLIC_URL` | `https://manubarber.cl` | URL pública del frontend |
| `FLOW_API_KEY` | *(tu apiKey de Flow)* | Llave pública de Flow |
| `FLOW_SECRET_KEY` | *(tu secretKey de Flow)* | Llave secreta de Flow |
| `FLOW_API_URL` | `https://www.flow.cl/api` | API de Flow (`sandbox.flow.cl` para pruebas) |
| `BOOKING_TIMEZONE` | `America/Santiago` | Zona horaria del agendamiento |

> El archivo de plantilla está disponible en [`server/.env.production.example`](file:///Users/juancristobal/manubarber/server/.env.production.example).

---

## 🛡️ Características de Producción Configuradas

1. **Seguridad y Cabeceras HTTP:**
   - Cabeceras de seguridad activadas en [`web/next.config.ts`](file:///Users/juancristobal/manubarber/web/next.config.ts) y [`web/vercel.json`](file:///Users/juancristobal/manubarber/web/vercel.json) (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`).
   - Soporte para previsualización en vivo en iframe del panel de administración (`SAMEORIGIN`).
   - Caché inmutable (`Cache-Control: public, max-age=31536000, immutable`) para assets estáticos e imágenes.

2. **CORS Inteligente:**
   - La API permite automáticamente orígenes locales de desarrollo, cualquier dominio de preview o producción de Vercel (`*.vercel.app`), y orígenes definidos en `FRONTEND_ORIGIN`.

3. **Compatibilidad Serverless Read-Only:**
   - Apollo Server genera su esquema GraphQL estrictamente en memoria (`autoSchemaFile: true`) al detectar producción o Vercel, evitando errores `EROFS: read-only file system`.
   - La base de datos JSON y directorio de subidas (`/tmp/db.json` y `/tmp/uploads`) son redirigidos de forma transparente a `/tmp` en entornos serverless sin bloquear escrituras.
