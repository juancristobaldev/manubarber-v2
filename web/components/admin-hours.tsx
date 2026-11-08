'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ADMIN_OPERATIONS } from '@/lib/operations';
import { AdminStatsBar, AdminToast } from './admin-common';

export interface BusinessHourData {
  id?: string;
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
}

interface AdminBusinessHoursProps {
  token: string;
  hours: BusinessHourData[];
  onRefetch: () => Promise<any>;
}

const WEEKDAYS = [
  { dayOfWeek: 1, name: 'Lunes', short: 'LUN', jp: '月曜日' },
  { dayOfWeek: 2, name: 'Martes', short: 'MAR', jp: '火曜日' },
  { dayOfWeek: 3, name: 'Miércoles', short: 'MIÉ', jp: '水曜日' },
  { dayOfWeek: 4, name: 'Jueves', short: 'JUE', jp: '木曜日' },
  { dayOfWeek: 5, name: 'Viernes', short: 'VIE', jp: '金曜日' },
  { dayOfWeek: 6, name: 'Sábado', short: 'SÁB', jp: '土曜日' },
  { dayOfWeek: 7, name: 'Domingo', short: 'DOM', jp: '日曜日' },
];

const PRESET_HOURS = [
  { label: '10:00 – 20:00 (Estándar)', opensAt: '10:00', closesAt: '20:00' },
  { label: '09:00 – 19:00 (Matutino)', opensAt: '09:00', closesAt: '19:00' },
  { label: '11:00 – 21:00 (Tardío)', opensAt: '11:00', closesAt: '21:00' },
  { label: '10:00 – 15:00 (Medio Día)', opensAt: '10:00', closesAt: '15:00' },
];

function calculateDurationHours(opensAt: string, closesAt: string): number {
  const [oh, om] = opensAt.split(':').map(Number);
  const [ch, cm] = closesAt.split(':').map(Number);
  if (isNaN(oh) || isNaN(om) || isNaN(ch) || isNaN(cm)) return 0;
  const diffMinutes = ch * 60 + cm - (oh * 60 + om);
  return diffMinutes > 0 ? Number((diffMinutes / 60).toFixed(1)) : 0;
}

export function AdminBusinessHours({ token, hours = [], onRefetch }: AdminBusinessHoursProps) {
  const client = useApolloClient();
  const context = useMemo(() => ({ headers: { authorization: `Bearer ${token}` } }), [token]);

  // Merge loaded hours with the full 7-day map to guarantee every day exists
  const fullWeekHours = useMemo(() => {
    return WEEKDAYS.map((w) => {
      const match = hours.find((h) => h.dayOfWeek === w.dayOfWeek);
      if (match) return match;
      return {
        dayOfWeek: w.dayOfWeek,
        opensAt: '10:00',
        closesAt: '20:00',
        isClosed: w.dayOfWeek === 7, // Domingo default cerrado
      };
    });
  }, [hours]);

  // Edit Modal State
  const [editingDay, setEditingDay] = useState<BusinessHourData | null>(null);
  const [opensAt, setOpensAt] = useState('10:00');
  const [closesAt, setClosesAt] = useState('20:00');
  const [isClosed, setIsClosed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Busy & Toast Feedback
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const notify = (text: string, error = false) => {
    setToast({ text, error });
    setTimeout(() => setToast(null), 4000);
  };

  // Open edit modal for a day
  const openEditModal = (day: BusinessHourData) => {
    setEditingDay(day);
    setOpensAt(day.opensAt || '10:00');
    setClosesAt(day.closesAt || '20:00');
    setIsClosed(!!day.isClosed);
    setFormError(null);
  };

  // Quick toggle open / closed
  const handleQuickToggleClosed = async (day: BusinessHourData) => {
    setBusy(true);
    const newIsClosed = !day.isClosed;
    const input = {
      dayOfWeek: day.dayOfWeek,
      opensAt: day.opensAt || '10:00',
      closesAt: day.closesAt || '20:00',
      isClosed: newIsClosed,
    };

    try {
      await client.mutate({
        mutation: ADMIN_OPERATIONS.upsertBusinessHour,
        variables: { input },
        context,
      });
      await onRefetch();
      const dayName = WEEKDAYS.find((w) => w.dayOfWeek === day.dayOfWeek)?.name || 'Día';
      notify(`${dayName} marcado como ${newIsClosed ? 'Cerrado' : 'Abierto'}.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Error al cambiar estado del día.', true);
    } finally {
      setBusy(false);
    }
  };

  // Save day edits
  const handleSaveDay = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingDay) return;
    setFormError(null);

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(opensAt) || !timeRegex.test(closesAt)) {
      setFormError('Los horarios deben tener formato HH:mm (ej: 10:00).');
      return;
    }

    if (!isClosed && opensAt >= closesAt) {
      setFormError('La hora de apertura debe ser anterior a la hora de cierre.');
      return;
    }

    const input = {
      dayOfWeek: editingDay.dayOfWeek,
      opensAt,
      closesAt,
      isClosed,
    };

    setBusy(true);
    try {
      await client.mutate({
        mutation: ADMIN_OPERATIONS.upsertBusinessHour,
        variables: { input },
        context,
      });
      await onRefetch();
      const dayName = WEEKDAYS.find((w) => w.dayOfWeek === editingDay.dayOfWeek)?.name || 'Día';
      notify(`Horario de ${dayName} actualizado correctamente.`);
      setEditingDay(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el horario.');
      notify('Error al guardar horario.', true);
    } finally {
      setBusy(false);
    }
  };

  // Apply Standard Preset: Mon-Sat 10:00 - 20:00, Sun Closed
  const applyStandardPreset = async () => {
    if (!window.confirm('¿Aplicar horario estándar (Lunes a Sábado 10:00 a 20:00, Domingo cerrado) a toda la semana?')) {
      return;
    }
    setBusy(true);
    try {
      for (const w of WEEKDAYS) {
        const input = {
          dayOfWeek: w.dayOfWeek,
          opensAt: '10:00',
          closesAt: '20:00',
          isClosed: w.dayOfWeek === 7,
        };
        await client.mutate({
          mutation: ADMIN_OPERATIONS.upsertBusinessHour,
          variables: { input },
          context,
        });
      }
      await onRefetch();
      notify('Horario estándar aplicado a toda la semana.');
    } catch (err) {
      notify('Error al aplicar el preset semanal.', true);
    } finally {
      setBusy(false);
    }
  };

  // Stats
  const openDaysCount = fullWeekHours.filter((h) => !h.isClosed).length;
  const closedDaysCount = fullWeekHours.filter((h) => h.isClosed).length;
  const totalWeeklyHours = fullWeekHours
    .filter((h) => !h.isClosed)
    .reduce((acc, h) => acc + calculateDurationHours(h.opensAt, h.closesAt), 0);

  const stats = [
    {
      icon: 'fa-calendar-week',
      value: `${openDaysCount} / 7`,
      label: 'Días Operativos',
    },
    {
      icon: 'fa-door-closed',
      value: closedDaysCount,
      label: 'Días Cerrados',
    },
    {
      icon: 'fa-clock',
      value: `${totalWeeklyHours} hrs`,
      label: 'Horas Semanales',
    },
    {
      icon: 'fa-shop',
      value: openDaysCount > 0 ? 'Activo' : 'Cerrado',
      label: 'Disponibilidad Web',
    },
  ];

  return (
    <div className="gallery-admin-hub">
      <AdminToast toast={toast} />

      {/* HEADER */}
      <div className="gallery-hub-header">
        <div className="gallery-hub-title-block">
          <div className="gallery-hub-pill">営業時間 · DISPONIBILIDAD Y AGENDA</div>
          <h2>Horario de Atención Semanal</h2>
          <p>
            Define los rangos de apertura y cierre para el cálculo en tiempo real de los bloques de reserva online.
          </p>
        </div>

        <div className="gallery-hub-actions">
          <button
            type="button"
            className="gallery-btn-accent"
            onClick={applyStandardPreset}
            disabled={busy}
            title="Aplica 10:00 a 20:00 Lun-Sáb y Domingo Cerrado"
          >
            <i className="fa-solid fa-wand-magic-sparkles text-[#d91e18]" />
            <span>Aplicar Preset Estándar</span>
          </button>
        </div>
      </div>

      {/* STATS */}
      <AdminStatsBar items={stats} />

      {/* 7-DAY CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 items-stretch">
        {fullWeekHours.map((day) => {
          const weekdayInfo = WEEKDAYS.find((w) => w.dayOfWeek === day.dayOfWeek)!;
          const isClosedDay = !!day.isClosed;
          const duration = calculateDurationHours(day.opensAt, day.closesAt);

          return (
            <article
              key={day.dayOfWeek}
              className={`p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 card-hover ${
                isClosedDay
                  ? 'bg-[#111] border border-[#2a2a2a]/60 opacity-80'
                  : 'bg-[#141414] border border-[#2a2a2a] hover:border-[#3f3f3f]'
              }`}
            >
              {/* Day Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-oswald text-[#888] uppercase tracking-widest">
                    #{day.dayOfWeek}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[9px] font-oswald tracking-widest uppercase px-2 py-0.5 rounded ${
                      !isClosedDay
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        !isClosedDay ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                      }`}
                    />
                    {!isClosedDay ? 'Abierto' : 'Cerrado'}
                  </span>
                </div>

                <div className="text-left mb-4">
                  <h4 className="text-lg font-oswald uppercase tracking-widest text-[#f5f5f5] mb-0.5">
                    {weekdayInfo.name}
                  </h4>
                  <span className="text-[10px] text-[#888]/60 font-jp font-bold">
                    {weekdayInfo.jp}
                  </span>
                </div>

                {/* Hours Display */}
                <div className="bg-[#0a0a0a] border border-[#222] p-3 rounded-xl mb-4 text-center">
                  {!isClosedDay ? (
                    <>
                      <div className="text-xl font-oswald font-bold text-[#f5f5f5] tracking-wide">
                        {day.opensAt} – {day.closesAt}
                      </div>
                      <div className="text-[10px] text-[#888] font-light mt-1">
                        {duration} hrs continuas
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-oswald font-bold text-red-400/90 tracking-widest uppercase">
                        CERRADO
                      </div>
                      <div className="text-[10px] text-[#888] font-light mt-1">
                        Sin turnos de reserva
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#2a2a2a]/40">
                <button
                  type="button"
                  className="w-full py-2 px-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-[#d91e18] text-[#f5f5f5] text-xs font-oswald uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  onClick={() => openEditModal(day)}
                  disabled={busy}
                >
                  <i className="fa-solid fa-clock" />
                  <span>Configurar</span>
                </button>

                <button
                  type="button"
                  className={`w-full py-1.5 px-2 border text-[10px] font-oswald uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    !isClosedDay
                      ? 'border-[#333] bg-transparent text-[#888] hover:text-red-400 hover:border-red-400/30'
                      : 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                  }`}
                  onClick={() => handleQuickToggleClosed(day)}
                  disabled={busy}
                >
                  <i className={`fa-solid ${!isClosedDay ? 'fa-ban' : 'fa-check'}`} />
                  <span>{!isClosedDay ? 'Cerrar día' : 'Habilitar día'}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* EDIT MODAL */}
      {editingDay && (
        <div className="gallery-modal-backdrop" onClick={() => setEditingDay(null)}>
          <div
            className="gallery-modal-dialog"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-clock" />
                <div>
                  <h3>
                    Horario: {WEEKDAYS.find((w) => w.dayOfWeek === editingDay.dayOfWeek)?.name}
                  </h3>
                  <p>Ajusta el rango de apertura o deshabilita la disponibilidad del día.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setEditingDay(null)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleSaveDay} className="modal-form">
              <div className="p-6 flex flex-col gap-5">
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* TOGGLE CERRADO SWITCH */}
                <div className="bg-[#141414] border border-[#2a2a2a] p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="font-oswald uppercase tracking-wide text-xs text-[#f5f5f5] mb-0.5">
                      Marcar este día como CERRADO
                    </h5>
                    <p className="text-[11px] text-[#888]">
                      El calendario no ofrecerá turnos ni disponibilidad para este día de la semana.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isClosed}
                      onChange={(e) => setIsClosed(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-[#2a2a2a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d91e18]" />
                  </label>
                </div>

                {!isClosed && (
                  <>
                    {/* TIME PICKERS */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-oswald tracking-widest text-[#888] uppercase mb-1.5">
                          Hora de Apertura *
                        </label>
                        <input
                          type="time"
                          className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-[#f5f5f5] py-2.5 px-3 rounded-lg text-sm transition-colors focus:outline-none font-bold text-center"
                          value={opensAt}
                          onChange={(e) => setOpensAt(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-oswald tracking-widest text-[#888] uppercase mb-1.5">
                          Hora de Cierre *
                        </label>
                        <input
                          type="time"
                          className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-[#f5f5f5] py-2.5 px-3 rounded-lg text-sm transition-colors focus:outline-none font-bold text-center"
                          value={closesAt}
                          onChange={(e) => setClosesAt(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* PRESETS BUTTONS */}
                    <div>
                      <label className="block text-[10px] font-oswald tracking-widest text-[#888] uppercase mb-2">
                        Atajos rápidos de horario
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {PRESET_HOURS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="py-2 px-2.5 bg-[#161616] hover:bg-[#222] border border-[#2a2a2a] hover:border-[#d91e18] text-[#f5f5f5] text-[11px] rounded-lg transition-all text-left"
                            onClick={() => {
                              setOpensAt(preset.opensAt);
                              setClosesAt(preset.closesAt);
                            }}
                          >
                            <span className="font-oswald text-xs font-bold text-[#d91e18] block">
                              {preset.opensAt} – {preset.closesAt}
                            </span>
                            <span className="text-[10px] text-[#888] block">
                              {preset.label.split('(')[1]?.replace(')', '') || ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="p-4 bg-[#181818] border-t border-[#2a2a2a] flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-transparent border border-[#333] hover:bg-[#222] text-[#888] hover:text-white text-xs font-oswald uppercase tracking-widest rounded-lg transition-colors"
                  onClick={() => setEditingDay(null)}
                  disabled={busy}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="gallery-btn-primary"
                  disabled={busy}
                >
                  <i className="fa-solid fa-check" />
                  <span>{busy ? 'Guardando…' : 'Guardar Horario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
