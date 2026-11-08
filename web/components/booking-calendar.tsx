'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { AVAILABLE_SLOTS, CREATE_BOOKING_CHECKOUT } from '@/lib/operations';
import { clp } from '@/components/site';

type Service = { id: string; name: string; price: number; durationMinutes?: number | null };
type Hours = { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean };
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function BookingCalendar({
  services,
  hours,
  selected,
  onSelect,
}: {
  services: Service[];
  hours: Hours[];
  selected?: Service;
  onSelect: (service: Service) => void;
}) {
  const [step, setStep] = useState(1);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const [send, { loading, error }] = useMutation(CREATE_BOOKING_CHECKOUT);
  const slots = useQuery<{ availableSlots: { time: string; available: boolean }[] }>(AVAILABLE_SLOTS, {
    variables: { serviceId: selected?.id, date },
    skip: !selected || !date || step < 3,
    fetchPolicy: 'no-cache',
    pollInterval: step === 3 ? 15000 : 0,
  });

  useEffect(() => {
    if (selected) setStep(1);
  }, [selected]);

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const firstDay = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const dayHours = (day: Date) => hours.find((h) => h.dayOfWeek === (day.getDay() || 7));
  const validTime = !!time && !!slots.data?.availableSlots.some((slot) => slot.time === time && slot.available);

  function validateStep4() {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) errors.name = 'Completa tu nombre completo';
    if (!phone.trim()) errors.phone = 'Ingresa tu teléfono o WhatsApp';
    if (!email.trim()) errors.email = 'Ingresa tu correo electrónico';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validateStep4()) return;
    if (!selected || !validTime) return;
    try {
      const response = await send({
        variables: {
          input: {
            serviceId: selected.id,
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            date,
            time,
            notes: notes.trim() || undefined,
          },
        },
      });
      window.location.assign(response.data.createBookingCheckout.checkoutUrl);
    } catch {
      await slots.refetch().catch(() => undefined);
    }
  }

  return (
    <div className="bg-[#111] border border-[#2a2a2a] p-6 md:p-12 rounded-3xl relative overflow-hidden shadow-2xl max-w-4xl mx-auto">
      {/* Kanji de fondo decorativo */}
      <div className="jp-bg-text">予約</div>

      {/* Progress Steps Canónico */}
      <div className="flex items-center justify-center max-w-md mx-auto mb-12 relative z-10">
        <div className="flex items-center w-full justify-between relative">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="step-item relative flex flex-col items-center flex-1">
              <div className="step-line w-full" />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-oswald z-10 transition-all ${
                  n <= step
                    ? 'bg-brand-red text-white shadow-[0_0_15px_rgba(217,30,24,0.4)]'
                    : 'bg-[#161616] border-2 border-[#333] text-brand-muted'
                }`}
              >
                {n}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contenedor Interior del Step */}
      <div className="max-w-2xl mx-auto relative z-10 bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 md:p-8 shadow-inner">
        {/* STEP 1: Selecciona Servicio */}
        {step === 1 && (
          <div>
            <h3 className="text-2xl font-oswald text-center mb-8 tracking-wide uppercase text-brand-text">
              01. Selecciona un Servicio
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((item) => {
                const isSelected = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      setTime('');
                    }}
                    className={`p-4 rounded-xl border text-left transition-all duration-300 card-hover ${
                      isSelected
                        ? 'border-brand-red bg-brand-red/10 shadow-[0_0_12px_rgba(217,30,24,0.25)] text-white'
                        : 'border-[#333] bg-[#111] text-brand-text hover:border-brand-red/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-oswald uppercase tracking-wide text-base font-semibold">{item.name}</h4>
                      <span className="font-oswald text-brand-red font-bold text-base whitespace-nowrap">
                        {clp(item.price)}
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted font-light">
                      {item.durationMinutes ? `${item.durationMinutes} minutos de sesión` : 'Duración a consultar'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Selecciona Fecha (Calendario Canónico) */}
        {step === 2 && (
          <div>
            <h3 className="text-2xl font-oswald text-center mb-6 tracking-wide uppercase text-brand-text">
              02. Selecciona la Fecha
            </h3>

            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  aria-label="Mes anterior"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  className="w-8 h-8 bg-[#222] border border-[#333] flex items-center justify-center hover:bg-white hover:text-black transition-colors rounded-lg shadow-sm text-xs"
                >
                  &lt;
                </button>
                <span className="text-sm font-oswald uppercase tracking-wider text-brand-text">
                  {month.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  aria-label="Mes siguiente"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  className="w-8 h-8 bg-[#222] border border-[#333] flex items-center justify-center hover:bg-white hover:text-black transition-colors rounded-lg shadow-sm text-xs"
                >
                  &gt;
                </button>
              </div>

              <div className="grid grid-cols-7 gap-y-3 gap-x-2 text-center text-xs">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                  <div key={d} className="text-brand-muted mb-2 font-light text-[11px] uppercase font-oswald">
                    {d}
                  </div>
                ))}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}
                {Array.from({ length: days }, (_, i) => {
                  const day = new Date(month.getFullYear(), month.getMonth(), i + 1);
                  const key = dateKey(day);
                  const h = dayHours(day);
                  const isPastOrClosed = key < today || !h || h.isClosed;
                  const isSelected = date === key;

                  if (isPastOrClosed) {
                    return (
                      <div key={key} className="p-2 text-brand-muted/30 text-xs rounded-lg cursor-not-allowed">
                        {i + 1}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setDate(key);
                        setTime('');
                      }}
                      className={`p-2 transition-all rounded-lg text-xs ${
                        isSelected
                          ? 'bg-brand-red text-white font-bold shadow-[0_2px_10px_rgba(217,30,24,0.4)] transform scale-110'
                          : 'hover:text-brand-red hover:bg-brand-red/10 text-brand-text'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-brand-muted text-center mt-6 font-light">
                {date ? `Fecha elegida: ${date}` : 'Selecciona un día habilitado para ver los horarios.'}
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: Selecciona Hora */}
        {step === 3 && (
          <div>
            <h3 className="text-2xl font-oswald text-center mb-4 tracking-wide uppercase text-brand-text">
              03. Elige una Hora
            </h3>
            <p className="text-xs text-brand-muted text-center mb-6 font-light">
              Horarios de Chile · Tu hora se bloqueará durante 15 minutos al iniciar el pago.
            </p>

            {slots.loading && !slots.data && (
              <div className="text-center py-8 text-sm text-brand-muted font-light">
                Consultando disponibilidad en tiempo real…
              </div>
            )}

            {slots.error && (
              <div className="relative mb-6">
                <div className="error-tooltip left-1/2 -translate-x-1/2 static inline-flex">
                  <span className="error-icon">!</span>
                  No se pudo consultar la disponibilidad. Vuelve a intentarlo.
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
              {slots.data?.availableSlots.map((slot) => {
                const isSelected = time === slot.time;
                if (!slot.available) {
                  return (
                    <button
                      key={slot.time}
                      disabled
                      type="button"
                      className="py-2.5 px-2 border border-[#222] text-brand-muted/30 text-xs bg-[#0a0a0a] cursor-not-allowed rounded-lg font-oswald"
                    >
                      {slot.time}
                    </button>
                  );
                }

                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setTime(slot.time)}
                    className={`py-2.5 px-2 text-xs transition-colors rounded-lg font-oswald ${
                      isSelected
                        ? 'border border-brand-red bg-brand-red/10 text-white shadow-[0_0_8px_rgba(217,30,24,0.2)] font-bold'
                        : 'border border-[#333] text-brand-muted hover:border-brand-red hover:text-brand-red bg-[#111] shadow-sm'
                    }`}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>

            {slots.data && !slots.data.availableSlots.some((slot) => slot.available) && (
              <p className="text-sm text-brand-muted text-center mt-6 font-light">
                No quedan horas disponibles para esta fecha. Por favor, selecciona otro día.
              </p>
            )}
          </div>
        )}

        {/* STEP 4: Formulario de Datos & Checkout */}
        {step === 4 && (
          <form id="calendar-booking-form" onSubmit={submit} className="space-y-6">
            <h3 className="text-2xl font-oswald text-center mb-4 tracking-wide uppercase text-brand-text">
              04. Tus Datos de Contacto
            </h3>

            {/* Resumen del servicio */}
            <div className="p-4 bg-[#111] border border-[#2a2a2a] rounded-xl flex items-center justify-between text-xs font-oswald uppercase tracking-wider mb-6">
              <div>
                <span className="text-brand-muted block text-[10px]">Servicio & Horario</span>
                <span className="text-brand-text font-bold">
                  {selected?.name} · {date} · {time}
                </span>
              </div>
              <div className="text-right">
                <span className="text-brand-muted block text-[10px]">Abono Requerido</span>
                <span className="text-brand-red font-bold text-sm">
                  {selected && clp(Math.ceil(selected.price / 2))}
                </span>
              </div>
            </div>

            {/* Input Nombre */}
            <div className="relative">
              <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                Nombre Completo
              </label>
              <input
                required
                maxLength={120}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                }}
                className={`w-full bg-[#1a1a1a] text-brand-text py-3 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/50 shadow-inner ${
                  fieldErrors.name
                    ? 'border border-brand-red shadow-[0_0_8px_rgba(217,30,24,0.15)]'
                    : 'border border-[#333] focus:border-white'
                }`}
                placeholder="Ingresa tu nombre..."
              />
              {fieldErrors.name && (
                <div className="error-tooltip left-4 bottom-full mb-2 rounded-md">
                  <span className="error-icon rounded">!</span>
                  {fieldErrors.name}
                </div>
              )}
            </div>

            {/* Input Teléfono */}
            <div className="relative">
              <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                Teléfono / WhatsApp
              </label>
              <input
                required
                maxLength={40}
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                }}
                className={`w-full bg-[#1a1a1a] text-brand-text py-3 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/50 shadow-inner ${
                  fieldErrors.phone
                    ? 'border border-brand-red shadow-[0_0_8px_rgba(217,30,24,0.15)]'
                    : 'border border-[#333] focus:border-white'
                }`}
                placeholder="+56 9 1234 5678"
              />
              {fieldErrors.phone && (
                <div className="error-tooltip left-4 bottom-full mb-2 rounded-md">
                  <span className="error-icon rounded">!</span>
                  {fieldErrors.phone}
                </div>
              )}
            </div>

            {/* Input Correo */}
            <div className="relative">
              <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                Correo Electrónico
              </label>
              <input
                required
                maxLength={254}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                }}
                className={`w-full bg-[#1a1a1a] text-brand-text py-3 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/50 shadow-inner ${
                  fieldErrors.email
                    ? 'border border-brand-red shadow-[0_0_8px_rgba(217,30,24,0.15)]'
                    : 'border border-[#333] focus:border-white'
                }`}
                placeholder="tu@email.com"
              />
              {fieldErrors.email && (
                <div className="error-tooltip left-4 bottom-full mb-2 rounded-md">
                  <span className="error-icon rounded">!</span>
                  {fieldErrors.email}
                </div>
              )}
            </div>

            {/* Textarea Comentarios */}
            <div className="relative">
              <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                Comentarios o Preferencias (Opcional)
              </label>
              <textarea
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-3 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light resize-none placeholder-brand-muted/50 shadow-inner"
                placeholder="Escribe alguna nota sobre tu estilo o corte..."
              />
            </div>

            {error && (
              <div className="p-3 bg-brand-red/10 border border-brand-red text-white text-xs rounded-lg flex items-center gap-2">
                <span className="error-icon">!</span>
                {error.message || 'No se pudo iniciar el pago. Intenta nuevamente.'}
              </div>
            )}
          </form>
        )}

        {/* Acciones del Stepper (Volver / Siguiente) */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#333]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="bg-[#111] border border-[#333] text-brand-text font-oswald uppercase tracking-widest py-3 px-8 text-sm hover:bg-white hover:text-black hover:border-white transition-colors rounded-lg shadow-sm"
            >
              Volver
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              disabled={step === 1 ? !selected : step === 2 ? !date : !validTime}
              onClick={() => setStep(step + 1)}
              className="bg-brand-red text-white font-oswald uppercase tracking-widest py-3 px-8 text-sm hover:bg-brand-redHover transition-colors rounded-lg shadow-[0_4px_15px_rgba(217,30,24,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              form="calendar-booking-form"
              disabled={loading || !validTime}
              className="bg-brand-red text-white font-oswald uppercase tracking-widest py-3 px-8 text-sm hover:bg-brand-redHover transition-colors rounded-lg shadow-[0_4px_15px_rgba(217,30,24,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Conectando con Flow…' : 'Pagar Abono con Flow'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
