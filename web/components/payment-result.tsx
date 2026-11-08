'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { useSearchParams } from 'next/navigation';
import { BOOKING_PAYMENT_STATUS } from '@/lib/operations';

export function PaymentResult() {
  const params = useSearchParams();
  const id = params.get('id');
  const { data, loading, error } = useQuery(BOOKING_PAYMENT_STATUS, { variables: { id }, skip: !id, fetchPolicy: 'network-only', pollInterval: 5000 });
  const status = data?.bookingPaymentStatus?.status;
  let title = 'Verificando tu pago';
  let message = 'Estamos esperando la confirmación de Flow. No vuelvas a pagar mientras se procesa.';
  if (!id || error) { title = 'No pudimos verificar el pago'; message = 'Si realizaste el pago, contacta a ManuBarber antes de volver a intentar.'; }
  else if (!loading && status === 'PAID') { title = '¡Reserva confirmada!'; message = 'Flow confirmó tu abono y tu hora quedó agendada.'; }
  else if (status === 'REVIEW') { title = 'Pago recibido, reserva en revisión'; message = 'Tu pago fue recibido pero no pudimos confirmar la hora automáticamente. Contacta a ManuBarber para resolverlo.'; }
  else if (status === 'EXPIRED') { title = 'Tiempo de reserva vencido'; message = 'El bloqueo de la hora terminó. Si pagaste, contacta a ManuBarber antes de intentar nuevamente.'; }
  else if (status === 'FAILED' || status === 'CANCELLED') { title = 'Pago no completado'; message = 'Flow no confirmó el pago. Puedes volver a elegir una hora.'; }
  return <main className="payment-result"><div role="status"><h1>{title}</h1><p>{message}</p><Link href="/#reserva" className="club-btn outline">Volver a ManuBarber</Link></div></main>;
}
