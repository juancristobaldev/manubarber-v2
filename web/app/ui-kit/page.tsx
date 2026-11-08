import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ManuBarber | UI Kit & Design System',
  description: 'Single Source of Truth del Sistema de Diseño Oficial de ManuBarber (Street Craft · Japanese Discipline)',
};

export default function UiKitPage() {
  return (
    <main className="w-screen h-screen m-0 p-0 overflow-hidden bg-[#0a0a0a]">
      <iframe
        src="/ui-kit.html"
        title="ManuBarber UI Kit & Design System"
        className="w-full h-full border-none block"
      />
    </main>
  );
}
