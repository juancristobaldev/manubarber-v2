import type { Metadata } from 'next';
import { ApolloProvider } from '@/components/apollo-provider';
import './globals.css';
import './admin-editor.css';
export const metadata: Metadata = {
  title: 'ManuBarber | Street Craft · Japanese Discipline',
  description: 'Barbería de autor inspirada en la disciplina japonesa y la autenticidad urbana. Cortes precisos, perfilado al detalle y cuidado premium.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
    ],
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><head><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" /></head><body><ApolloProvider>{children}</ApolloProvider></body></html>; }
