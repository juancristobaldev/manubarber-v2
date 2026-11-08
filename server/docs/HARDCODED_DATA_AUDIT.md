# Inventario de datos hardcodeados

Fecha de auditoría: 30 de octubre de 2026. Alcance: los cinco HTML existentes. Se excluyen clases Tailwind, animaciones y estilos: son presentación, no contenido administrable.

| Área | Archivos | Datos que hoy están fijos | Modelo propuesto |
|---|---|---|---|
| Marca, SEO y home | `index.html` | Nombre, títulos, hero, descripción, CTA, logo, imagen de portada, textos de valor, banner VIP y copyright | `SiteSetting`, `MediaAsset` |
| Contacto | `index.html` + footers | Andrés Bello con General Mackenna, Temuco, mapa embebido, Instagram, WhatsApp `56936355068`, horario 12:30–21:30, zona horaria | `SiteSetting`, `BusinessHour` |
| Navegación | los 5 HTML | 7 enlaces, etiquetas y rutas, duplicados para desktop/móvil | `NavigationItem` |
| Servicios | `index.html` | Corte + Cejas ($10.000), Corte + Barba ($16.000), Corte con Diseño ($12.000); descripciones, iconos, badge “Full Service” y orden | `Service` |
| Agenda | `index.html` | Mensaje y teléfono de WhatsApp; actualmente no persiste nombre ni solicitud | `Customer`, `Booking`, `Service` |
| Galería | `index.html`, `src/galeria.html` | 4 destacados y 10 imágenes (5 diseño, 5 normal), títulos, alt, categorías y orden | `MediaAsset`, `GalleryCategory`, `GalleryItem` |
| Tienda | `src/store.html` | 6 perfumes, imágenes, badges, formato/variantes y precios ($6.000/$12.000) | `Product`, `ProductVariant`, `MediaAsset`, `ProductReservation` |
| VIP | `src/vip.html` | Comparativa 4 cortes/$40.000 vs $35.000, 2 planes ($35.000 y $50.000), beneficios, badges y ahorro | `MembershipPlan`, `MembershipBenefit`, `MembershipLead` |
| Curso | `src/capacitacion.html` | Curso Básico, $35.000/clase, copy, 6 módulos, CTA y WhatsApp `56971405996` | `Course`, `CourseModule`, `CourseLead` |
| Administración | inexistente | No hay usuarios, permisos, estados de publicación ni trazabilidad | `User`, `AuditLog`, enums de rol/estado |

## Hallazgos funcionales

1. Las reservas, compras y solicitudes VIP/curso sólo abren WhatsApp; se pierden para seguimiento y métricas.
2. Hay dos números de WhatsApp distintos según flujo. El teléfono pasa al contenido configurable de cada curso y a `business.contact`.
3. Los mismos datos de navegación, redes, footer y marca se repiten en los cinco HTML. El frontend debe consultarlos una vez desde GraphQL.
4. Los precios se expresan como texto y no sirven para cálculos. Se guardan como enteros CLP para evitar errores de punto flotante.

## Funciones GraphQL implementadas

**Públicas:** `publicSettings`, `navigation`, `businessHours`, `services`, `products`, `membershipPlans`, `courses`, `galleryCategories`, `galleryItems`; y las mutaciones `createBooking`, `createProductReservation`, `createMembershipLead`, `createCourseLead`.

**Administrador (Bearer JWT):** login con `adminLogin`; CRUD de configuración, navegación, horarios, media, servicios, productos con variantes, planes con beneficios, cursos con módulos, categorías/ítems de galería; lectura de reservas/leads y cambio de estado de una reserva.

## Pendiente de conectar en frontend

El backend está aislado en `server/` para no romper los HTML actuales. La siguiente entrega debe reemplazar las tarjetas y textos estáticos por las consultas públicas, y sustituir las aperturas de WhatsApp por las mutaciones de lead/reserva (WhatsApp puede mantenerse como notificación posterior).
