# ManuBarber UI Kit Reference: Tokens & Components Dictionary

Este documento contiene los fragmentos de referencia rápida para copiar y pegar directamente en componentes React / Next.js o plantillas HTML respetando `web/ui-kit.html`.

---

## 1. Clases Tailwind y Variables CSS

### En `tailwind.config` / `globals.css`:
```javascript
colors: {
  brand: {
    dark: '#0a0a0a',        // Fondo principal oscuro
    surface: '#141414',     // Fondo de tarjetas
    surfaceHover: '#1f1f1f',
    border: '#2a2a2a',      // Bordes sutiles
    red: '#d91e18',         // Rojo principal (action)
    redHover: '#b81914',
    text: '#f5f5f5',        // Texto principal
    muted: '#888888',       // Texto secundario
  }
},
fontFamily: {
  sans: ['Inter', 'sans-serif'],
  oswald: ['Oswald', 'sans-serif'],
  jp: ['Noto Sans JP', 'sans-serif'],
},
letterSpacing: {
  widest: '.25em',
}
```

---

## 2. Snippets de Componentes React

### Botón Primario
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function PrimaryButton({ children, icon, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3.5 px-6 text-sm transition-all duration-300 transform hover:scale-[1.01] rounded-lg shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center justify-center gap-2 ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
```

### Input con Tooltip de Error
```tsx
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormInput({ label, error, className = '', ...props }: FormInputProps) {
  return (
    <div className="relative">
      <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
        {label}
      </label>
      <input
        className={`w-full bg-[#1a1a1a] text-brand-text py-3 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/50 shadow-inner ${
          error
            ? 'border border-brand-red shadow-[0_0_8px_rgba(217,30,24,0.15)]'
            : 'border border-[#333] focus:border-white'
        } ${className}`}
        {...props}
      />
      {error && (
        <div className="error-tooltip left-4 bottom-full mb-2 rounded-md">
          <span className="error-icon rounded">!</span>
          {error}
        </div>
      )}
    </div>
  );
}
```

### Card de KPI (Admin)
```tsx
interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
}

export function KpiCard({ label, value, icon, highlight = false }: KpiCardProps) {
  return (
    <div className="bg-[#141414] border border-[#222] rounded-xl p-4 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
          highlight ? 'bg-brand-red/10 text-brand-red' : 'bg-[#222] text-brand-text'
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="text-xl font-oswald font-bold leading-none mb-1">{value}</div>
        <div className="text-[9px] text-brand-muted uppercase tracking-widest font-oswald">{label}</div>
      </div>
    </div>
  );
}
```
