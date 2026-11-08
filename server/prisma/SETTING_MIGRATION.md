# SiteSetting: inventario y transición relacional

La migración es aditiva: `SiteSetting.value` sigue siendo la fuente de verdad; `SiteSettingNode` es una proyección tipada sincronizada transaccionalmente por trigger al insertar o actualizar. El backfill procesa todas las claves existentes, incluso claves o campos desconocidos. No se elimina ni transforma el JSON original. El seed existente escribe mediante el mismo trigger. La proyección no debe escribirse directamente: será sobrescrita por la próxima actualización del JSON.

## Mapeo exacto

Cada fila tiene `(settingId, path)` como clave primaria y FK a `SiteSetting`. La raíz usa `[]`; cada propiedad agrega un segmento literal a `path`, cada elemento de array agrega su índice decimal desde cero. `type` es `OBJECT`, `ARRAY`, `STRING`, `NUMBER`, `BOOLEAN` o `NULL`; solo el campo escalar correspondiente (`stringValue`, `numberValue` numérico arbitrario de PostgreSQL, `booleanValue`) se rellena. Objetos y arrays vacíos tienen su propia fila; null JSON tiene tipo `NULL`. El tipo del nodo padre distingue un índice de array de una propiedad numérica. No se confunde una propiedad con puntos con varios segmentos. `isPublic` y `updatedAt` permanecen en `SiteSetting`.

Inventario de claves del seed y campos observados (cada campo corresponde a un segmento de ruta):

| Clave | Estructura |
|---|---|
| `business.profile` | name, tagline, timezone, currency, logoUrl: string |
| `business.contact` | address, city, instagram, whatsapp, mapEmbedUrl: string |
| `home.hero` | title, description, imageUrl, ctaLabel: string |
| `home.valueProps` | array de objetos: icon, title, description: string |
| `home.vipBanner` | title, description, ctaLabel, href: string |
| `store.hero` | title, description, imageUrl: string |
| `vip.hero` | eyebrow, title, description, imageUrl: string |
| `vip.comparison` | visits, individualPrice, standardTotal, vipPrice, savings: number |
| `course.finalCta` | title, description, label: string |
| `gallery.pageHeader` | title, description, watermark: string |
| `brand.aesthetic` | japaneseMark, eyebrow, heroSideText, heroJapanese: string; accentColors: array de strings |
| `home.philosophy` | japaneseTitle, title, kicker, quote, imageUrl, imageAlt: string; paragraphs: array de strings; pillars: array de objetos {label, description} |
| `home.experience` | array de objetos {title, description} |
| `home.testimonials` | array de objetos {author, service, text} |
| `vip.theme` | documentada en matriz visual: gold, goldLight; no existe en seed |

Ejemplo: `home.valueProps` elemento 0 título → `path = ['0','title']`, `type = STRING`, `stringValue = 'Experiencia'`. Las formas efectivas de producción pueden diferir: inspeccionar las filas reales antes de definir modelos de dominio con columnas obligatorias.

## Despliegue y límites

Hacer backup y probar `prisma migrate deploy` en una copia aislada de PostgreSQL; comprobar número de raíces (`path = ARRAY[]::text[]`) contra número de settings y comparar tipos y valores, incluidos arrays vacíos y claves desconocidas. La migración toma locks y reescribe cada setting para disparar el backfill; planificar ventana proporcional al volumen. No actualizar la proyección directamente. Lectores y escritores existentes siguen usando JSON: esto **no** completa el cambio de API ni permite retirar `value`. Para finalizar: definir modelos de dominio tras inventario real, migrar lectores/escritores con control de concurrencia, verificar equivalencia y solo después planificar una migración de eliminación independiente. Rollback de aplicación: seguir leyendo JSON; retirar trigger/tabla solo mediante migración explícita tras backup, nunca borrar el original.

## AuditLog

`before` y `after` son JSON nullable; no hay escritores de `auditLog` en `server/src` al momento del inventario. Alternativa propuesta, no activada: `AuditLogChange` con FK a `AuditLog`, `path String[]`, y dos conjuntos tipados `beforeType/beforeString/beforeNumber/beforeBoolean` y `afterType/afterString/afterNumber/afterBoolean`; un tipo nullable representa ausencia, `NULL` representa null JSON. Registrar también nodos contenedores para reconstruir arrays/objetos vacíos. Preservar snapshots originales, actor y timestamp durante backfill y transición; tratar secretos y datos personales con política explícita de redacción y retención antes de activar captura. No borrar snapshots ni afirmar que esta alternativa ya está implementada.
