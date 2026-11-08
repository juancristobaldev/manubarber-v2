# Matriz de paridad visual: HTML legado → Next.js

Objetivo: la migración en `web/` debe conservar el diseño **pixel-equivalente** del sitio estático y reemplazar solamente el origen de datos por Apollo/GraphQL. La versión Next actual tiene paridad funcional parcial, no visual; esta matriz define la reconstrucción pendiente.

## Regla de implementación

- Conservar: tipografías Anton/Oswald, paleta, breakpoints, tamaños, espaciados, overlays, sombras, animaciones y copy del HTML hasta que el CMS entregue el equivalente.
- Reemplazar: arrays, textos, precios, URLs, imágenes, número WhatsApp y horarios hardcodeados por datos GraphQL.
- No usar `next/image` en esta fase: los HTML usan `<img>` sin optimización y el objetivo es paridad visual exacta.

## Matriz global

| Elemento | Fuente antigua | Contrato GraphQL | Estado actual Next | Criterio de aceptación |
|---|---|---|---|---|
| Fuentes Anton + Oswald | 5 HTML | Estático de presentación | Parcial | Mismas familias, pesos y rendering |
| Paleta negro/gris/rojo | Tailwind CDN | Estático de presentación | Parcial | `#0a0a0a`, `#1c1c1c`, `#ff0022`, mismos glows |
| Navbar desktop | Todos | `navigation` + `business.profile` | No equivalente | Fijo, logo 75px, 7 enlaces, espaciado y hover originales |
| Navbar móvil | Todos | `navigation` | No implementado | Botón hamburger, overlay fullscreen blur, cierre al navegar |
| Footer | Todos | `business.profile`, `business.contact` | No equivalente | Logo, 2 redes, copyright y texto decorativo correctos |
| Scroll navbar | Todos | N/A | No implementado | Al superar 50px: fondo, borde, glow y padding idénticos |
| Reveal on scroll | Todos | N/A | No implementado | `IntersectionObserver`, transiciones y umbrales originales |
| Accesibilidad | Mejorado respecto al legado | N/A | Parcial | Mantener teclado, foco visible y labels sin alterar el layout |

## Inicio (`index.html` → `app/page.tsx`)

| Bloque | Datos GraphQL | Paridad requerida | Estado |
|---|---|---|---|
| Hero viewport completo | `home.hero` | Imagen fija, doble gradiente, título 7xl→9xl, CTA con icono/flecha | Pendiente |
| Badge horario flotante | `businessHours` | Panel glass, borde rojo izquierdo, desplazamiento `-mt-8` | Pendiente |
| “Mi Valor” | `home.valueProps` (nuevo setting) | Tres cards con iconos, delay 0/100/200ms, borde superior hover | Pendiente contrato/implementación |
| Galería preview | `galleryItems` | Grid 2→4, aspect 4:5, overlay al hover y CTA “Ver más” | Parcial |
| Servicios | `services` | Tres cards, la central elevada/destacada, iconos y modal de reserva | Parcial; falta modal fiel |
| Banner VIP | `home.vipBanner` (nuevo setting) | Gradiente horizontal, corona, copy y CTA | Pendiente |
| Contacto/mapa | `business.contact`, `businessHours` | Dos columnas, iconos cuadrados skewed, iframe mapa 450px | Pendiente |
| Modal reserva | `createBooking` | Backdrop blur, escala, Escape, servicio readonly; enviar mutation y luego WhatsApp opcional | Pendiente |

## Tienda (`src/store.html` → `app/tienda/page.tsx`)

| Bloque | Datos GraphQL | Paridad requerida | Estado |
|---|---|---|---|
| Header Hero | `store.hero` | Fondo `PERFUMES.png`, gradiente obsidiana, marca de agua japonesa `厳選`, eyebrow y 4 trust pills | Completado (UI Kit) |
| Grid catálogo | `products`/`variants` | 1→2→3→4 columnas, filtro por promos/búsqueda, delay escalonado | Completado (UI Kit) |
| Producto | `Product`, `ProductVariant`, `MediaAsset` | Aspect 1:1 `#161616`, badge `#dfa43a` / `#d91e18`, hover zoom 110%, selector de formato | Completado (UI Kit) |
| Reserva WhatsApp | `createProductReservation`, `business.contact` | Modal canónico, valida campos con `.error-tooltip`, registra lead en GraphQL y coordina vía WhatsApp | Completado (UI Kit) |

## VIP (`src/vip.html` → `app/vip/page.tsx`)

| Bloque | Datos GraphQL | Paridad requerida | Estado |
|---|---|---|---|
| Tema oro | `vip.theme` (setting) | Colores oro, scrollbar y glow exclusivos | Parcial |
| Hero VIP | `vip.hero` (setting) | Hero 70vh, hero grayscale 30%, pills y gradientes | Pendiente |
| Comparativa | `vip.comparison` (setting) | Dos panels: Sin Membresía / Con Tarjeta VIP, cifras configurables | Pendiente contrato/implementación |
| Planes | `membershipPlans`, `benefits` | Dos cards, plan popular, precio tachado, border/gold shadows | Parcial |
| Modal VIP | `createMembershipLead` | Form modal exacto, escala, Escape y confirmación | Pendiente |

## Capacitación (`src/capacitacion.html` → `app/capacitacion/page.tsx`)

| Bloque | Datos GraphQL | Paridad requerida | Estado |
|---|---|---|---|
| Hero curso | `courses`, `heroImage` | Altura 85vh, glow central, badge, gradiente fuego y delays | Parcial |
| Banner de precio | `Course` | Gradiente gris/rojo, icono dinero y layout horizontal | Pendiente |
| Temario | `CourseModule` | Grid 1→2→3, seis cards con icono y delays escalonados | Parcial |
| CTA final | `course.finalCta` (setting) | Fondo/panel rojo, texto y botón blanco | Pendiente contrato/implementación |
| Solicitud cupo | `createCourseLead` | Persistir lead y abrir WhatsApp configurable | Parcial |

## Galería (`src/galeria.html` → `app/galeria/page.tsx`)

| Bloque | Datos GraphQL | Paridad requerida | Estado |
|---|---|---|---|
| Header portafolio | `gallery.pageHeader` (setting) | Marca de agua 25vw, tipografía 7xl→9xl | Pendiente |
| Filtros | `galleryCategories` | Botones rojo/blanco con animación de opacidad/escala | Parcial |
| Grid | `galleryItems`/`media` | 2→3 columnas, aspect 4:5, lupa hover, 10 piezas | Parcial |
| Lightbox | `galleryItems` | Overlay negro 95%, blur, max 90%/85vh, Escape/click cierre | Pendiente |
| CTA agenda | `services` | Botón borde rojo original al final del grid | Pendiente |

## Matriz de datos adicionales necesarios

| Key en `SiteSetting` | Tipo esperado | Consumidor |
|---|---|---|
| `home.valueProps` | `{ icon, title, description }[]` | Inicio |
| `home.vipBanner` | `{ title, description, ctaLabel, href }` | Inicio |
| `store.hero` | `{ title, description, imageUrl }` | Tienda |
| `vip.theme` | `{ gold, goldLight }` | VIP |
| `vip.hero` | `{ eyebrow, title, description, imageUrl }` | VIP |
| `vip.comparison` | `{ visits, individualPrice, vipPrice, ... }` | VIP |
| `course.finalCta` | `{ title, description, label }` | Capacitación |
| `gallery.pageHeader` | `{ title, description, watermark }` | Galería |

## Validación final por viewport

| Página | 375px | 768px | 1024px | 1440px | Interacciones |
|---|---:|---:|---:|---:|---:|
| Inicio | Obligatorio | Obligatorio | Obligatorio | Obligatorio | Menú, reveal, modal, reserva |
| Tienda | Obligatorio | Obligatorio | Obligatorio | Obligatorio | Menú, reveal, reserva |
| VIP | Obligatorio | Obligatorio | Obligatorio | Obligatorio | Menú, reveal, modal VIP |
| Curso | Obligatorio | Obligatorio | Obligatorio | Obligatorio | Menú, reveal, solicitud |
| Galería | Obligatorio | Obligatorio | Obligatorio | Obligatorio | Menú, filtros, lightbox |

La paridad se considera completada sólo con capturas de referencia lado a lado en los cuatro viewports y sin regresiones en las mutaciones Apollo.
