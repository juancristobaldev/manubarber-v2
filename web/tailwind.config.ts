import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './ui-kit.html',
  ],
  theme: {
    extend: {
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
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
        jp: ['Noto Sans JP', 'sans-serif'],
      },
      letterSpacing: {
        widest: '.25em',
      },
    },
  },
  plugins: [],
};

export default config;
