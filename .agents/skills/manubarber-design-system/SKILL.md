---
name: manubarber-design-system
description: >-
  Sistema oficial de diseño UI/UX y arquitectura visual de ManuBarber (Street Craft · Japanese Discipline).
  Establece a web/ui-kit.html como la ÚNICA FUENTE DE VERDAD (Single Source of Truth).
  Contiene la paleta exacta de tokens oscuros (#0A0A0A, #141414, #2A2A2A, #D91E18), la jerarquía tipográfica
  (Oswald para titulares, botones y mayúsculas con tracking expandido; Inter para cuerpo de texto; Noto Sans JP
  para acentos decorativos), el catálogo canónico de componentes (botones, inputs con tooltip de error flotante,
  tarjetas interactivas con card-hover, dashboard admin con KPIs y acordeones, y wizard de reservas con calendario),
  así como las 7 reglas duras y el script de auditoría visual. Usar SIEMPRE que se diseñe, modifique o audite
  cualquier vista o componente en ManuBarber (web, admin, agendamiento, tienda, servicios).
---

# ManuBarber Design System & UI/UX Guidelines
**Street Craft · Japanese Discipline (己を磨け)**

> [!IMPORTANT]
> **REGLA FUNDAMENTAL**: El archivo [`web/ui-kit.html`](file:///Users/juancristobal/manubarber/web/ui-kit.html) es la **ÚNICA FUENTE DE VERDAD** para cualquier decisión de diseño, estructura visual, tokens de color, tipografía, radios de borde, efectos de hover y jerarquía de componentes.
> Ningún componente, pantalla o refactorización puede contradecir lo establecido en `web/ui-kit.html`.

---

## 1. Filosofía Visual y ADN de Marca

ManuBarber fusiona el **brutalismo callejero premium** con la **disciplina y precisión milimétrica japonesa**:
- **Atmósfera**: Oscura, pulcra, quirúrgica y de alto impacto visual. No es un sitio genérico de barbería de barrio ni una plantilla brillante con colores neón descontrolados.
- **Micro-detalles de identidad**:
  - Acentos y marcas de agua japonesas en baja opacidad (ej. `己を磨け` — *Pule tu propia persona*, `哲学`, `予約`).
  - Textos de navegación y botones siempre en **mayúsculas con tracking expandido** (`font-oswald tracking-widest uppercase`).
  - Bordes suavizados pero precisos (`rounded-xl` y `rounded-2xl` para tarjetas; `rounded-lg` para controles e inputs).
  - Efectos de profundidad controlada mediante superficies `#141414`, `#161616` y `#111` sobre canvas `#0a0a0a`.
  - Tratamiento fotográfico: imágenes en escala de grises con opacidad al 80% que transicionan suavemente a color y zoom sutil (`scale-105`) al hacer hover (`.card-hover`).

---

## 2. Paleta Oficial de Tokens de Color

Está estrictamente prohibido usar paletas genéricas de Tailwind (`bg-gray-800`, `bg-zinc-900`, `text-slate-400`, `bg-blue-600`, etc.) o inventar colores hexadecimales arbitrarios.

| Token | Valor Hex / RGBA | Clase Tailwind / Uso Exclusivo |
| :--- | :--- | :--- |
| `brand-dark` | `#0A0A0A` | Fondo principal (Canvas negro obsidiana del body y vistas). |
| `brand-surface` | `#141414` | Superficie estándar de tarjetas, paneles KPI y cajas base. |
| `brand-surface-nested` | `#111111` / `#161616` | Superficie para contenedores anidados, cuerpos de acordeón y modales. |
| `brand-surfaceHover` | `#1F1F1F` | Hover en elementos de lista y superficies interactivas secundarias. |
| `brand-border` | `#2A2A2A` | Bordes estándar, divisores de sección y separadores de tarjeta. |
| `brand-border-subtle` | `#222222` / `#2A2A2A80` | Bordes sutiles de KPIs y divisores internos secundarios. |
| `brand-border-input` | `#333333` | Bordes de inputs inactivos, botones outline y secondary. |
| `brand-border-hover` | `#3F3F3F` | Borde al hacer hover en tarjetas y tooltips de error. |
| `brand-red` | `#D91E18` | Rojo de acción principal (CTAs primarios, badges destacados, acentos). |
| `brand-redHover` | `#B81914` | Estado hover / active del botón primario. |
| `brand-text` | `#F5F5F5` | Texto principal de lectura y titulares. |
| `brand-muted` | `#888888` | Metadatos, etiquetas secundarias, placeholders y subtítulos. |
| `brand-status-online` | `#10B981` / `green-400` | Badges de trabajos "Publicado", estados activos en admin. |
| `brand-alert-icon` | `#F97316` | Naranja de alerta para el icono `!` en `.error-tooltip`. |
| `brand-gold-promo` | `#DFA43A` | Badge de promociones y ofertas destacadas de producto. |

### Halos y Sombras Canónicas
- **Glow rojo primario**: `shadow-[0_4px_14px_rgba(217,30,24,0.3)]` (en botones primarios).
- **Glow rojo sutil**: `shadow-[0_0_15px_rgba(217,30,24,0.15)]` o `shadow-[0_0_8px_rgba(217,30,24,0.15)]` (en inputs con error o cards destacadas).
- **Sombra profunda de tarjeta**: `box-shadow: 0 10px 40px -10px rgba(0,0,0,0.8);` (incorporada en `.card-hover`).

---

## 3. Jerarquía Tipográfica

Se compone de un sistema de 3 familias tipográficas definidas en `web/ui-kit.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Oswald:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;700;900&display=swap" rel="stylesheet">
```

### 1. `Oswald` (`font-oswald`) — Titulares, Controles y Metadatos
- **Uso obligatorio en**:
  - Titulares `h1`, `h2`, `h3`, `h4`, `h5`.
  - Botones (`<button>`, links estilo botón, CTAs).
  - Etiquetas de formulario superiores (`label text-[10px] font-oswald uppercase tracking-widest text-brand-muted`).
  - Precios, números de paso, valores KPI y badges.
- **Transformación**: **SIEMPRE `uppercase`**.
- **Tracking**: `tracking-widest` (`0.25em`) o `tracking-wide` / `tracking-wider`.
- **Prohibido**: Usar `Anton`, `Syne` u otras fuentes display heredadas de prototipos obsoletos.

### 2. `Inter` (`font-sans`) — Lectura y Formularios
- **Uso obligatorio en**:
  - Cuerpo de texto, descripciones de servicio, artículos, notas legales.
  - Valores introducidos por el usuario dentro de inputs y textareas.
  - Textos de mensajes de validación y tooltips.
- **Pesos recomendados**: `font-light` (300) y `font-normal` (400) para descripciones; `font-medium` (500) para selecciones activas.

### 3. `Noto Sans JP` (`font-jp`) — Acentos Culturales Japoneses
- **Uso exclusivo en**:
  - Marcas de agua verticales `.jp-bg-text`:
    ```css
    .jp-bg-text {
      writing-mode: vertical-rl;
      text-orientation: upright;
      opacity: 0.03;
      font-size: 8rem;
      line-height: 1;
      position: absolute;
      right: 2rem;
      top: 0;
      user-select: none;
      pointer-events: none;
    }
    ```
  - Subtítulos de sección decorativos en fondo (`font-jp text-brand-muted/20 font-black tracking-widest`).

---

## 4. Catálogo Canónico de Componentes

### 4.1. Botones

#### A. Primario (Action / Reserva)
```html
<button class="bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3.5 px-6 text-sm transition-all duration-300 transform hover:scale-[1.01] rounded-lg shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center justify-center gap-2">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
  Reservar Hora
</button>
```

#### B. Outline / Neutral
```html
<button class="bg-[#1a1a1a] border border-[#333] hover:border-brand-red hover:text-brand-red text-brand-text font-oswald uppercase tracking-widest py-3.5 px-6 text-sm transition-all duration-300 rounded-lg flex items-center justify-center gap-2">
  Explorar Servicios
</button>
```

#### C. Secundario / Volver
```html
<button class="bg-transparent hover:bg-[#1a1a1a] border border-[#333] text-brand-muted hover:text-white font-oswald uppercase tracking-widest py-3.5 px-6 text-sm transition-all duration-300 rounded-lg">
  Volver
</button>
```

#### D. Acción Compacta en Admin
```html
<!-- Primario Compacto -->
<button class="bg-brand-red hover:bg-brand-redHover text-white text-xs font-oswald uppercase tracking-widest px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-md">
  Crear nueva categoría
</button>

<!-- Secundario Compacto -->
<button class="bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-brand-text text-xs font-oswald uppercase tracking-widest px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
  Subir nuevo trabajo
</button>
```

---

### 4.2. Formularios, Inputs y Tooltip Canónico de Error

#### Estructura Estándar de Campo
```html
<div class="relative">
  <label class="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
    Nombre Completo
  </label>
  <input 
    type="text" 
    class="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-3 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/50 shadow-inner" 
    placeholder="Ingresa tu nombre..." 
  />
</div>
```

#### Estado de Error con Tooltip Canónico
> [!IMPORTANT]
> Los errores en campos **NO** se muestran como textos rojos desalineados debajo del input. Usan la clase canónica `.error-tooltip` posicionada arriba a la izquierda del campo con flecha indicadora y el icono naranja `.error-icon`.

```html
<div class="relative mt-6">
  <label class="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
    Teléfono / WhatsApp
  </label>
  <input 
    type="text" 
    class="w-full bg-[#1a1a1a] border border-brand-red text-brand-text py-3 px-4 focus:outline-none transition-colors rounded-lg text-sm shadow-[0_0_8px_rgba(217,30,24,0.15)]" 
  />
  
  <!-- Tooltip de Error Flotante -->
  <div class="error-tooltip left-4 bottom-full mb-2 rounded-md">
    <span class="error-icon rounded">!</span>
    Completa este campo
  </div>
</div>
```

**CSS canónico del tooltip (extraído de `ui-kit.html`):**
```css
.error-tooltip {
  position: absolute;
  bottom: 100%;
  left: 0;
  background-color: #2a2a2a;
  border: 1px solid #3f3f3f;
  color: #fff;
  padding: 6px 12px;
  font-size: 0.75rem;
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  animation: fadeIn 0.2s ease-out forwards;
}
.error-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 16px;
  border-width: 6px;
  border-style: solid;
  border-color: #2a2a2a transparent transparent transparent;
}
.error-icon {
  background-color: #f97316;
  color: white;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  font-weight: bold;
  font-size: 10px;
}
```

---

### 4.3. Tarjetas de Servicio y Productos

- Contenedor con `rounded-2xl`, borde `#2a2a2a`, fondo `#111` o `#141414`, sombra `shadow-lg` y clase `.card-hover`.
- Imagen con contenedor `rounded-xl aspect-video overflow-hidden relative group`:
  - `img`: `filter grayscale opacity-80 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700`.
  - Overlay: `absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-60`.

```html
<article class="bg-[#111] border border-[#2a2a2a] p-5 flex flex-col h-full card-hover rounded-2xl shadow-lg">
  <div class="w-full aspect-video bg-[#1a1a1a] mb-5 overflow-hidden rounded-xl relative group">
    <img src="foto.jpg" alt="Servicio" class="w-full h-full object-cover filter grayscale opacity-80 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
    <div class="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-60"></div>
  </div>
  <h4 class="text-xl font-oswald uppercase text-brand-text mb-2 tracking-wide">Corte + Barba</h4>
  <p class="text-sm text-brand-muted font-light leading-relaxed mb-6 flex-grow">Corte premium + perfilado de barba al detalle.</p>
  
  <div class="flex items-center justify-between mb-5 border-t border-brand-border/50 pt-4">
    <span class="text-xs font-oswald tracking-widest text-brand-muted uppercase">Consultar</span>
    <span class="text-lg font-oswald text-brand-red font-bold">$16.000</span>
  </div>
  <button class="w-full bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3 text-sm transition-colors rounded-lg shadow-md">
    Reservar
  </button>
</article>
```

---

### 4.4. Dashboard Admin: KPIs y Acordeones

#### Tarjeta KPI Canónica
```html
<div class="bg-[#141414] border border-[#222] rounded-xl p-4 flex items-center gap-4">
  <div class="w-10 h-10 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center text-xl">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
  </div>
  <div>
    <div class="text-xl font-oswald font-bold leading-none mb-1">10</div>
    <div class="text-[9px] text-brand-muted uppercase tracking-widest font-oswald">Publicados Web</div>
  </div>
</div>
```

#### Acordeón de Categoría y Cards de Galería
```html
<div class="bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden mb-6 shadow-lg">
  <!-- Cabecera -->
  <div class="bg-[#161616] p-4 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#2a2a2a] gap-4">
    <div class="flex items-center gap-4">
      <div class="w-8 h-8 rounded bg-brand-red text-white flex items-center justify-center font-oswald font-bold text-sm shadow-inner">#1</div>
      <div>
        <h4 class="font-oswald text-lg font-bold tracking-wide uppercase">Corte con Diseño</h4>
        <div class="flex flex-wrap gap-2 text-[10px] mt-1.5 font-oswald tracking-widest uppercase">
          <span class="bg-[#222] text-brand-muted px-2 py-0.5 rounded-md border border-[#333]">/design</span>
          <span class="bg-green-500/10 text-green-400 px-2 py-0.5 rounded-md border border-green-500/20 flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full bg-green-400"></div> 5 Publicados
          </span>
        </div>
      </div>
    </div>
    <!-- Botones de Acción de Fila -->
    <div class="flex flex-wrap gap-2">
      <button class="px-3 py-2 border border-brand-red/30 bg-brand-red/5 text-brand-red rounded-lg text-[10px] uppercase font-oswald tracking-widest hover:bg-brand-red hover:text-white transition flex items-center gap-1.5">
        + Agregar trabajo
      </button>
      <button class="px-3 py-2 border border-[#333] bg-[#1a1a1a] text-brand-text rounded-lg text-[10px] uppercase font-oswald tracking-widest hover:bg-[#222] transition">
        Editar
      </button>
    </div>
  </div>

  <!-- Cuerpo: Grid de Cards Cuadradas (Aspect 1:1) -->
  <div class="p-6 bg-[#111]">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <article class="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden flex flex-col group card-hover shadow-md">
        <div class="relative aspect-square overflow-hidden">
          <img src="foto.jpg" alt="Trabajo" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <span class="absolute top-2 left-2 bg-green-500/90 backdrop-blur-sm text-black font-bold text-[8px] px-2 py-1 rounded shadow-sm uppercase tracking-wider">Publicado</span>
          <span class="absolute top-2 right-2 bg-black/80 backdrop-blur-sm text-white font-bold text-[9px] px-2 py-1 rounded shadow-sm">#0</span>
        </div>
        <div class="p-4 flex-grow border-b border-[#2a2a2a]">
          <h5 class="font-oswald font-bold text-[13px] tracking-wide mb-1 uppercase truncate">Mid Fade en V con Diseño</h5>
          <p class="text-[9px] text-brand-muted uppercase tracking-wider truncate">Mid fade en V con diseño</p>
        </div>
        <!-- Barra de 3 Acciones Canónicas -->
        <div class="grid grid-cols-3 bg-[#111]">
          <button class="py-3 flex items-center justify-center gap-1.5 text-[10px] uppercase font-oswald tracking-widest text-brand-muted hover:text-white hover:bg-[#1a1a1a] transition border-r border-[#2a2a2a]">Previa</button>
          <button class="py-3 flex items-center justify-center gap-1.5 text-[10px] uppercase font-oswald tracking-widest text-brand-muted hover:text-white hover:bg-[#1a1a1a] transition border-r border-[#2a2a2a]">Editar</button>
          <button class="py-3 flex items-center justify-center text-brand-muted hover:text-brand-red hover:bg-brand-red/10 transition">Eliminar</button>
        </div>
      </article>
    </div>
  </div>
</div>
```

---

### 4.5. Flujo de Reserva (Wizard)

1. **Stepper**: Círculos `w-8 h-8 rounded-full` con números en `font-oswald text-xs font-bold`.
   - Activos/Completados: `bg-brand-red text-white shadow-[0_0_15px_rgba(217,30,24,0.4)]`.
   - Pendientes: `bg-[#161616] border-2 border-[#333] text-brand-muted`.
   - Conector: Línea `.step-line::after` de 1px en `#2a2a2a`.
2. **Calendario**:
   - Cabecera con selector de mes y botones circulares/cuadrados en `bg-[#222] border border-[#333]`.
   - Grilla de 7 columnas (`Lun` a `Dom`).
   - Día activo seleccionado: `bg-brand-red text-white font-bold rounded-lg shadow-[0_2px_10px_rgba(217,30,24,0.4)] transform scale-110`.
3. **Selector de Horas**:
   - Inactivo: `py-2.5 px-2 border border-[#333] text-brand-muted text-xs hover:border-brand-red hover:text-brand-red bg-[#111] rounded-lg`.
   - Seleccionado: `border border-brand-red bg-brand-red/10 text-white text-xs rounded-lg shadow-[0_0_8px_rgba(217,30,24,0.2)]`.
   - Deshabilitado: `border border-[#222] text-brand-muted/30 text-xs bg-[#0a0a0a] cursor-not-allowed rounded-lg` con atributo `disabled`.

---

## 5. Las 7 Reglas Duras de ManuBarber

Cada una de estas reglas es inviolable y verificable:

1. **`ui-kit.html` Manda sobre Todo**: No inventar variantes no contempladas en `ui-kit.html`. Si una vista necesita un elemento nuevo, debe construirse respetando los tokens, radios y estados de `ui-kit.html`.
2. **Cero Colores Fuera de Paleta**: No usar grises fríos o azules de Tailwind (`slate`, `zinc`, `neutral`, `blue`, etc.). La escala es estrictamente `#0a0a0a` -> `#111111` -> `#141414` -> `#161616` -> `#1a1a1a` -> `#1f1f1f` con bordes `#2a2a2a`, `#333333` y `#3f3f3f`.
3. **Rojo de Acción Unificado**: El rojo es `#d91e18` (`brand-red`), hover `#b81914` (`brand-redHover`). No usar `#ff0022` ni otros rojos estridentes sin control de contraste.
4. **Tipografía Oswald con Mayúsculas y Tracking Obligatorio**: Todo botón, badge, titular, métrica y horario usa `font-oswald uppercase tracking-widest` o `tracking-wide`.
5. **Validación de Formularios Exclusiva con `.error-tooltip`**: No renderizar alertas rojas expansivas que rompan el layout vertical. Usar el tooltip canónico absoluto con flecha e icono naranja.
6. **Radios de Borde Estandarizados**:
   - `rounded-2xl`: Tarjetas principales de producto/servicio, modales y acordeones.
   - `rounded-xl`: KPIs, previews de medios y cards de acordeón admin.
   - `rounded-lg`: Botones, inputs, celdas de calendario y botones de hora.
   - `rounded-full`: Solo para píldoras VIP, stepper circles y dots de estado.
7. **Efecto `.card-hover` y Desaturación Fotográfica**: Toda tarjeta interactiva debe incorporar el hover suave con elevación de 4px, borde a `#3f3f3f` y transición de escala en imágenes.

---

## 6. Script de Auditoría Visual

Para verificar el cumplimiento en cualquier archivo o módulo, ejecutar el script de auditoría provisto en esta skill:

```bash
node .agents/skills/manubarber-design-system/scripts/ui-kit-audit.js
```

O desde la configuración global:
```bash
node ~/.gemini/config/skills/manubarber-design-system/scripts/ui-kit-audit.js
```
