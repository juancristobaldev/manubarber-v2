'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { ADMIN_BOOKINGS, ADMIN_CATALOG, UPDATE_BOOKING_STATUS } from '@/lib/operations';
import { clp } from '@/components/site';

export type Booking = {
  id: string;
  status: string;
  scheduledAt?: string;
  paymentStatus?: string;
  depositAmount?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceName?: string;
};

type BusinessHour = {
  id?: string;
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
};

// Utilidades de zona horaria y formato específico para Chile (America/Santiago)
function toSantiagoDateKey(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function toSantiagoTime(d: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

function formatDayTitle(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 16, 0, 0));
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function cleanPhoneForWhatsApp(phone?: string): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('56') && clean.length >= 11) return clean;
  if (clean.startsWith('9') && clean.length === 9) return `56${clean}`;
  if (clean.length === 8) return `569${clean}`;
  return clean;
}

const STATUS_LABELS: Record<string, { label: string; tone: string; desc: string }> = {
  CONFIRMED: { label: 'Confirmada', tone: 'status-confirmed', desc: 'Abono verificado y cita confirmada' },
  PENDING: { label: 'Pendiente', tone: 'status-pending', desc: 'Esperando validación de abono Flow' },
  COMPLETED: { label: 'Completada', tone: 'status-completed', desc: 'Servicio realizado con éxito' },
  NO_SHOW: { label: 'No asistió', tone: 'status-noshow', desc: 'Cliente no se presentó a su cita' },
  CANCELLED: { label: 'Cancelada', tone: 'status-cancelled', desc: 'Cita anulada' },
};

const PAYMENT_LABELS: Record<string, { label: string; tone: string }> = {
  PAID: { label: 'Pagado (Flow)', tone: 'pay-paid' },
  APPROVED: { label: 'Aprobado', tone: 'pay-paid' },
  PENDING: { label: 'Pendiente de pago', tone: 'pay-pending' },
  CREATING: { label: 'Iniciando Flow', tone: 'pay-pending' },
  REJECTED: { label: 'Rechazado', tone: 'pay-failed' },
  REFUNDED: { label: 'Reembolsado', tone: 'pay-neutral' },
};

export function AdminBookings({ token }: { token: string }) {
  const context = useMemo(() => ({ headers: { authorization: `Bearer ${token}` } }), [token]);

  const { data, loading, error, refetch } = useQuery<{ bookings: Booking[] }>(ADMIN_BOOKINGS, {
    context,
    fetchPolicy: 'network-only',
    pollInterval: 30000,
  });

  const catalogQuery = useQuery<{ adminCatalog: { hours: BusinessHour[] } }>(ADMIN_CATALOG, {
    context,
    fetchPolicy: 'cache-first',
  });

  const [update, updateState] = useMutation(UPDATE_BOOKING_STATUS);

  const todayKey = useMemo(() => toSantiagoDateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [month, setMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');

  const bookings = useMemo(() => data?.bookings ?? [], [data]);
  const hours = useMemo(() => catalogQuery.data?.adminCatalog?.hours ?? [], [catalogQuery.data]);

  // Agrupación de reservas por fecha (YYYY-MM-DD en hora de Santiago)
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of bookings) {
      if (!b.scheduledAt) continue;
      const d = new Date(b.scheduledAt);
      if (isNaN(d.getTime())) continue;
      const key = toSantiagoDateKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }
    // Ordenar cronológicamente dentro de cada día
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
    }
    return map;
  }, [bookings]);

  // Métricas del día actual y totales
  const metrics = useMemo(() => {
    const todayBookings = bookingsByDate[todayKey] ?? [];
    const activeToday = todayBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
    const todayRevenue = todayBookings
      .filter(b => (b.status === 'CONFIRMED' || b.status === 'COMPLETED') && b.depositAmount)
      .reduce((sum, b) => sum + (b.depositAmount || 0), 0);
    const pendingTotal = bookings.filter(b => b.status === 'PENDING').length;
    const confirmedTotal = bookings.filter(b => b.status === 'CONFIRMED').length;

    return {
      todayCount: todayBookings.length,
      todayActiveCount: activeToday.length,
      todayRevenue,
      pendingTotal,
      confirmedTotal,
      totalBookings: bookings.length,
    };
  }, [bookings, bookingsByDate, todayKey]);

  // Generación de slots horarios para el día seleccionado
  const daySchedule = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 16, 0, 0));
    // En JS getDay() da 0=Dom..6=Sáb; en nuestro backend dayOfWeek es 1=Lun..7=Dom
    const jsDay = dateObj.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    const dayHour = hours.find(h => h.dayOfWeek === dayOfWeek);

    const dayBookings = bookingsByDate[selectedDate] ?? [];
    const isClosed = dayHour ? dayHour.isClosed : false;

    // Horarios de apertura y cierre
    const opensAt = dayHour?.opensAt && /^\d{2}:\d{2}$/.test(dayHour.opensAt) ? dayHour.opensAt : '10:00';
    const closesAt = dayHour?.closesAt && /^\d{2}:\d{2}$/.test(dayHour.closesAt) ? dayHour.closesAt : '21:00';

    const [openH, openM] = opensAt.split(':').map(Number);
    const [closeH, closeM] = closesAt.split(':').map(Number);
    const startMin = openH * 60 + openM;
    const endMin = closeH * 60 + closeM;

    // Generar franjas cada 30 minutos
    const timeSet = new Set<string>();
    for (let cur = startMin; cur < endMin; cur += 30) {
      const h = Math.floor(cur / 60);
      const min = cur % 60;
      timeSet.add(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    }

    // Asegurar que las horas de citas reales estén incluidas
    for (const b of dayBookings) {
      if (b.scheduledAt) {
        timeSet.add(toSantiagoTime(new Date(b.scheduledAt)));
      }
    }

    const sortedTimes = Array.from(timeSet).sort();

    const slots = sortedTimes.map(timeStr => {
      const matchingBookings = dayBookings.filter(b => b.scheduledAt && toSantiagoTime(new Date(b.scheduledAt)) === timeStr);
      return {
        time: timeStr,
        isOccupied: matchingBookings.length > 0,
        bookings: matchingBookings,
      };
    });

    return {
      isClosed,
      opensAt,
      closesAt,
      slots,
      dayBookings,
    };
  }, [selectedDate, hours, bookingsByDate]);

  // Lista filtrada para la vista tabular / buscador
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        b.customerName?.toLowerCase().includes(q) ||
        b.customerPhone?.toLowerCase().includes(q) ||
        b.customerEmail?.toLowerCase().includes(q) ||
        b.serviceName?.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
      );
    });
  }, [bookings, statusFilter, searchTerm]);

  // Días del mes actual para el calendario
  const calendarDays = useMemo(() => {
    const year = month.getFullYear();
    const mon = month.getMonth();
    const firstDayIndex = (new Date(year, mon, 1).getDay() + 6) % 7; // Lun = 0
    const totalDays = new Date(year, mon + 1, 0).getDate();

    const days: Array<{
      dateKey: string;
      dayNum: number;
      isCurrentMonth: boolean;
      bookings: Booking[];
    }> = [];

    // Celdas vacías previas
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        dateKey: `empty-${i}`,
        dayNum: 0,
        isCurrentMonth: false,
        bookings: [],
      });
    }

    // Días del mes
    for (let i = 1; i <= totalDays; i++) {
      const key = `${year}-${String(mon + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateKey: key,
        dayNum: i,
        isCurrentMonth: true,
        bookings: bookingsByDate[key] ?? [],
      });
    }

    return days;
  }, [month, bookingsByDate]);

  // Manejo de cambio de estado
  async function changeStatus(id: string, newStatus: string) {
    if (newStatus === 'CANCELLED' && !window.confirm('¿Cancelar esta reserva? Recuerda que esto no reembolsa automáticamente en Flow.')) {
      return;
    }
    try {
      await update({
        variables: { id, status: newStatus },
        context,
      });
      await refetch();
      // Actualizar booking seleccionado si está abierto
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch {
      // Apollo maneja el error
    }
  }

  // Navegación de días rápida
  const shiftDay = (daysCount: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d + daysCount);
    setSelectedDate(toSantiagoDateKey(date));
    // Sincronizar mes si nos salimos
    if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear()) {
      setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  return (
    <section className="agenda-dashboard">
      {/* 1. Barra de KPIs / Métricas del Barbero */}
      <header className="agenda-kpi-bar">
        <div className="kpi-card highlight">
          <span className="kpi-icon">📅</span>
          <div>
            <div className="kpi-value">{metrics.todayCount}</div>
            <div className="kpi-label">Citas para hoy ({metrics.todayActiveCount} confirmadas)</div>
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-icon">💰</span>
          <div>
            <div className="kpi-value">{clp(metrics.todayRevenue)}</div>
            <div className="kpi-label">Abonos recibidos hoy</div>
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-icon">⚡</span>
          <div>
            <div className="kpi-value">{metrics.pendingTotal}</div>
            <div className="kpi-label">Pendientes de confirmación</div>
          </div>
        </div>

        <div className="kpi-card actions">
          <button
            className="agenda-refresh-btn"
            disabled={loading}
            onClick={() => refetch()}
            title="Sincronizar reservas con la base de datos"
          >
            {loading ? '⟳ Actualizando…' : '⟳ Actualizar'}
          </button>
          <div className="agenda-view-switch">
            <button
              className={viewMode === 'calendar' ? 'active' : ''}
              onClick={() => setViewMode('calendar')}
            >
              📅 Agenda
            </button>
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              📋 Lista ({bookings.length})
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="agenda-alert-banner" role="alert">
          ⚠️ Hubo un problema al cargar la agenda. Revisa tu sesión o pulsa Actualizar.
        </div>
      )}

      {/* 2. MODO 1: AGENDA VISUAL (CALENDARIO MENSUAL + TIMELINE DE HORAS) */}
      {viewMode === 'calendar' && (
        <div className="agenda-main-layout">
          {/* Columna Izquierda: Calendario de Días y Ver Días Ocupados */}
          <aside className="agenda-calendar-panel">
            <div className="calendar-panel-header">
              <div className="calendar-month-controls">
                <button
                  type="button"
                  aria-label="Mes anterior"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                >
                  ‹
                </button>
                <h3>
                  {month.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  type="button"
                  aria-label="Mes siguiente"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                >
                  ›
                </button>
              </div>
              <button
                type="button"
                className="btn-today"
                onClick={() => {
                  const now = new Date();
                  setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                  setSelectedDate(todayKey);
                }}
              >
                Ir a Hoy
              </button>
            </div>

            <div className="calendar-weekdays-row">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(w => (
                <span key={w}>{w}</span>
              ))}
            </div>

            <div className="calendar-month-grid">
              {calendarDays.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return <div key={`empty-${idx}`} className="calendar-cell empty" />;
                }
                const isSelected = cell.dateKey === selectedDate;
                const isToday = cell.dateKey === todayKey;
                const count = cell.bookings.length;
                const isOccupied = count > 0;
                const confirmedCount = cell.bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').length;
                const pendingCount = cell.bookings.filter(b => b.status === 'PENDING').length;

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateKey)}
                    className={`calendar-cell day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isOccupied ? 'has-bookings' : ''}`}
                    title={`${cell.dayNum} - ${count} citas agendadas`}
                  >
                    <span className="day-number">{cell.dayNum}</span>

                    {/* DÍAS OCUPADOS: badge e indicadores visuales */}
                    {isOccupied && (
                      <div className="day-booking-badge" aria-label={`${count} reservas`}>
                        <span className="badge-count">{count} {count === 1 ? 'cita' : 'citas'}</span>
                        <div className="dots-container">
                          {confirmedCount > 0 && <span className="dot dot-confirmed" title="Confirmadas" />}
                          {pendingCount > 0 && <span className="dot dot-pending" title="Pendientes" />}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="calendar-legend">
              <span className="legend-item"><i className="legend-dot dot-confirmed" /> Confirmada / Pagada</span>
              <span className="legend-item"><i className="legend-dot dot-pending" /> Pendiente Flow</span>
              <span className="legend-item"><i className="legend-dot dot-today" /> Día de hoy</span>
            </div>
          </aside>

          {/* Columna Derecha: Vista del Día Seleccionado y sus Horas Disponibles vs Ocupadas */}
          <section className="agenda-day-panel">
            <div className="day-panel-header">
              <div className="day-header-nav">
                <button type="button" onClick={() => shiftDay(-1)} title="Día anterior">‹ Anterior</button>
                <div className="day-title-wrap">
                  <span className="day-tag-status">
                    {selectedDate === todayKey ? '⚡ HOY' : 'DÍA SELECCIONADO'}
                  </span>
                  <h2>{formatDayTitle(selectedDate)}</h2>
                </div>
                <button type="button" onClick={() => shiftDay(1)} title="Día siguiente">Siguiente ›</button>
              </div>

              <div className="day-summary-chips">
                <span className="chip-pill">
                  🕒 Horario: {daySchedule.isClosed ? 'Cerrado' : `${daySchedule.opensAt} - ${daySchedule.closesAt}`}
                </span>
                <span className="chip-pill count">
                  ✂️ {daySchedule.dayBookings.length} {daySchedule.dayBookings.length === 1 ? 'cita agendada' : 'citas agendadas'}
                </span>
              </div>
            </div>

            {daySchedule.isClosed && (
              <div className="day-closed-notice">
                ⛔ El local está marcado como cerrado este día según la configuración de horarios.
              </div>
            )}

            {/* TIMELINE DE HORAS */}
            <div className="day-slots-timeline">
              {daySchedule.slots.map(slot => {
                if (slot.isOccupied) {
                  // HORA NO DISPONIBLE (OCUPADA) -> CLICK MUESTRA INFO DE CONTACTO
                  return (
                    <div key={slot.time} className="timeline-slot-row occupied">
                      <div className="slot-time-col">
                        <span className="slot-time">{slot.time}</span>
                        <span className="slot-status-pill occupied">Ocupado</span>
                      </div>

                      <div className="slot-content-col">
                        {slot.bookings.map(b => {
                          const statusInfo = STATUS_LABELS[b.status] || { label: b.status, tone: 'status-neutral' };
                          const payInfo = PAYMENT_LABELS[b.paymentStatus ?? ''] || { label: b.paymentStatus ?? 'Sin pago', tone: 'pay-neutral' };

                          return (
                            <div
                              key={b.id}
                              className={`booking-card-preview ${statusInfo.tone}`}
                              onClick={() => setSelectedBooking(b)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={e => { if (e.key === 'Enter') setSelectedBooking(b); }}
                              title="Haz clic para ver los datos de contacto y gestionar la cita"
                            >
                              <div className="card-top-row">
                                <span className="service-badge">{b.serviceName || 'Servicio Barbería'}</span>
                                <span className={`status-tag ${statusInfo.tone}`}>{statusInfo.label}</span>
                                <span className={`pay-tag ${payInfo.tone}`}>{payInfo.label}</span>
                              </div>

                              <div className="card-client-row">
                                <div className="client-identity">
                                  <span className="client-avatar">{(b.customerName || 'C').charAt(0).toUpperCase()}</span>
                                  <div>
                                    <strong className="client-name">{b.customerName || 'Cliente sin nombre'}</strong>
                                    <span className="client-phone">📞 {b.customerPhone || 'Sin teléfono'}</span>
                                  </div>
                                </div>

                                <div className="card-deposit-info">
                                  {b.depositAmount != null && (
                                    <span className="deposit-tag">Abono: {clp(b.depositAmount)}</span>
                                  )}
                                  <span className="click-inspect-action">Ver contacto y acciones →</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // HORA DISPONIBLE
                return (
                  <div key={slot.time} className="timeline-slot-row available">
                    <div className="slot-time-col">
                      <span className="slot-time">{slot.time}</span>
                      <span className="slot-status-pill available">Disponible</span>
                    </div>

                    <div className="slot-content-col">
                      <div className="slot-free-indicator">
                        <span className="free-icon">🟢</span>
                        <span className="free-text">Hora disponible — Libre para agendar o atender por orden de llegada</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* 3. MODO 2: VISTA TABULAR COMPLETA Y BUSCADOR GLOBAL */}
      {viewMode === 'table' && (
        <div className="agenda-table-view">
          <div className="table-controls-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono (+569...), email o ID de reserva..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && <button onClick={() => setSearchTerm('')}>✕</button>}
            </div>

            <div className="filter-pills">
              {[
                ['ALL', 'Todas'],
                ['CONFIRMED', 'Confirmadas'],
                ['PENDING', 'Pendientes'],
                ['COMPLETED', 'Completadas'],
                ['NO_SHOW', 'No asistió'],
                ['CANCELLED', 'Canceladas'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={`filter-pill ${statusFilter === key ? 'active' : ''}`}
                  onClick={() => setStatusFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="agenda-table-wrapper">
            <table className="agenda-custom-table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Abono Flow</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty">
                      No se encontraron citas con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map(b => {
                    const statusInfo = STATUS_LABELS[b.status] || { label: b.status, tone: 'status-neutral' };
                    const payInfo = PAYMENT_LABELS[b.paymentStatus ?? ''] || { label: b.paymentStatus ?? 'Sin pago', tone: 'pay-neutral' };
                    const dateStr = b.scheduledAt
                      ? new Intl.DateTimeFormat('es-CL', {
                          timeZone: 'America/Santiago',
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(b.scheduledAt))
                      : 'Sin fecha';

                    return (
                      <tr key={b.id} onClick={() => setSelectedBooking(b)}>
                        <td className="cell-datetime">
                          <strong>{dateStr}</strong>
                        </td>
                        <td>
                          <div className="cell-customer">
                            <span className="customer-name">{b.customerName || 'Sin nombre'}</span>
                            <span className="customer-sub">{b.customerPhone || b.customerEmail || '—'}</span>
                          </div>
                        </td>
                        <td>{b.serviceName || '—'}</td>
                        <td>
                          <div className="cell-deposit">
                            <span>{b.depositAmount != null ? clp(b.depositAmount) : '—'}</span>
                            <span className={`pay-tag ${payInfo.tone}`}>{payInfo.label}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-tag ${statusInfo.tone}`}>{statusInfo.label}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-inspect-table"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedBooking(b);
                            }}
                          >
                            Ver Ficha →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MODAL / DRAWER DE INSPECCIÓN: QUIÉN RESERVÓ + CONTACTO + ACCIONES */}
      {selectedBooking && (
        <div className="agenda-modal-backdrop" onClick={() => setSelectedBooking(null)}>
          <div
            className="agenda-modal-card"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div>
                <span className="modal-tag">FICHA DE RESERVA & CONTACTO</span>
                <h3>{selectedBooking.serviceName || 'Servicio ManuBarber'}</h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setSelectedBooking(null)}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Sección: Quién Reservó */}
              <div className="modal-section customer-section">
                <h4>👤 Información del Cliente</h4>
                <div className="customer-highlight-card">
                  <div className="customer-big-avatar">
                    {(selectedBooking.customerName || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="customer-main-info">
                    <span className="customer-full-name">{selectedBooking.customerName || 'Cliente no registrado'}</span>
                    <span className="customer-contact-line">📱 {selectedBooking.customerPhone || 'Sin teléfono'}</span>
                    <span className="customer-contact-line">✉️ {selectedBooking.customerEmail || 'Sin email'}</span>
                  </div>
                </div>

                {/* BOTONES DE CONTACTO DIRECTO */}
                <div className="modal-quick-contacts">
                  {selectedBooking.customerPhone && (
                    <>
                      <a
                        className="contact-btn whatsapp"
                        href={`https://wa.me/${cleanPhoneForWhatsApp(selectedBooking.customerPhone)}?text=${encodeURIComponent(
                          `Hola ${selectedBooking.customerName || ''}, te saludamos de ManuBarber para confirmar tu cita de ${selectedBooking.serviceName || 'barbería'}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        💬 Abrir WhatsApp
                      </a>
                      <a className="contact-btn phone" href={`tel:${selectedBooking.customerPhone}`}>
                        📞 Llamar
                      </a>
                    </>
                  )}
                  {selectedBooking.customerEmail && (
                    <a className="contact-btn email" href={`mailto:${selectedBooking.customerEmail}`}>
                      ✉️ Correo
                    </a>
                  )}
                </div>
              </div>

              {/* Sección: Cita & Pasarela de Pagos Flow */}
              <div className="modal-section details-section">
                <h4>🗓️ Detalles de la Cita y Pago Flow</h4>
                <div className="modal-info-grid">
                  <div className="info-item">
                    <span className="item-label">Fecha y Hora</span>
                    <strong className="item-val">
                      {selectedBooking.scheduledAt
                        ? new Intl.DateTimeFormat('es-CL', {
                            timeZone: 'America/Santiago',
                            dateStyle: 'full',
                            timeStyle: 'short',
                          }).format(new Date(selectedBooking.scheduledAt))
                        : 'Sin fecha'}
                    </strong>
                  </div>

                  <div className="info-item">
                    <span className="item-label">Estado de Reserva</span>
                    <div>
                      <span className={`status-tag ${(STATUS_LABELS[selectedBooking.status] || {}).tone || 'status-neutral'}`}>
                        {(STATUS_LABELS[selectedBooking.status] || {}).label || selectedBooking.status}
                      </span>
                    </div>
                  </div>

                  <div className="info-item">
                    <span className="item-label">Abono Flow</span>
                    <strong className="item-val">
                      {selectedBooking.depositAmount != null ? clp(selectedBooking.depositAmount) : 'Sin abono'}
                    </strong>
                  </div>

                  <div className="info-item">
                    <span className="item-label">Estado Pago Pasarela</span>
                    <div>
                      <span className={`pay-tag ${(PAYMENT_LABELS[selectedBooking.paymentStatus ?? ''] || {}).tone || 'pay-neutral'}`}>
                        {(PAYMENT_LABELS[selectedBooking.paymentStatus ?? ''] || {}).label || selectedBooking.paymentStatus || 'Sin pago'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-ref-id">
                  <span>ID de Referencia:</span> <code>{selectedBooking.id}</code>
                </div>
              </div>

              {/* Sección: Gestión Operativa del Barbero */}
              <div className="modal-section actions-section">
                <h4>⚙️ Acciones de Barbería</h4>
                <div className="modal-action-buttons">
                  {selectedBooking.status === 'CONFIRMED' && (
                    <>
                      <button
                        type="button"
                        className="btn-action complete"
                        disabled={updateState.loading}
                        onClick={() => changeStatus(selectedBooking.id, 'COMPLETED')}
                      >
                        ✓ Marcar como Completada
                      </button>
                      <button
                        type="button"
                        className="btn-action noshow"
                        disabled={updateState.loading}
                        onClick={() => changeStatus(selectedBooking.id, 'NO_SHOW')}
                      >
                        ⊘ Cliente no asistió
                      </button>
                    </>
                  )}

                  {['PENDING', 'CONFIRMED'].includes(selectedBooking.status) && (
                    <button
                      type="button"
                      className="btn-action cancel"
                      disabled={updateState.loading}
                      onClick={() => changeStatus(selectedBooking.id, 'CANCELLED')}
                    >
                      ✕ Cancelar Cita
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-done"
                onClick={() => setSelectedBooking(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
