import { Suspense } from 'react';
import { PaymentResult } from '@/components/payment-result';

export default function ResultPage() {
  return <Suspense fallback={<main className="payment-result">Consultando pago…</main>}><PaymentResult /></Suspense>;
}
