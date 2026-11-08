'use client';

import { useMemo, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { UPDATE_LEAD_STATUS } from '@/lib/operations';
import { AdminStatsBar, AdminToast } from './admin-common';

export interface RawLeadItem {
  id: string;
  status: string;
  createdAt: string;
  customerName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  productName?: string | null;
  planName?: string | null;
  courseName?: string | null;
}

export interface LeadItem {
  id: string;
  kind: 'product' | 'membership' | 'course';
  kindLabel: string;
  kindIcon: string;
  status: string;
  createdAt: string;
  customerName: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  referenceName: string;
}

interface AdminLeadsProps {
  token: string;
  productLeads?: RawLeadItem[];
  membershipLeads?: RawLeadItem[];
  courseLeads?: RawLeadItem[];
  onRefetch: () => Promise<any>;
}

const STATUS_CONFIGS: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string; icon: string }
> = {
  NEW: {
    label: 'Nueva',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
    icon: 'fa-bell',
  },
  CONTACTED: {
    label: 'En Contacto',
    bg: 'bg-[#dfa43a]/10',
    text: 'text-[#dfa43a]',
    border: 'border-[#dfa43a]/30',
    dot: 'bg-[#dfa43a]',
    icon: 'fa-comments',
  },
  CONFIRMED: {
    label: 'Confirmada',
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/30',
    dot: 'bg-green-400',
    icon: 'fa-circle-check',
  },
  CLOSED: {
    label: 'Cerrada',
    bg: 'bg-[#1a1a1a]',
    text: 'text-[#888]',
    border: 'border-[#333]',
    dot: 'bg-[#555]',
    icon: 'fa-box-archive',
  },
  CANCELLED: {
    label: 'Cancelada',
    bg: 'bg-neutral-900',
    text: 'text-neutral-500',
    border: 'border-neutral-800',
    dot: 'bg-neutral-600',
    icon: 'fa-xmark',
  },
};

function formatLeadDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

function cleanPhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits.slice(1);
  if (digits.startsWith('56')) return digits;
  if (digits.startsWith('9') && digits.length === 9) return `56${digits}`;
  return digits;
}

export function AdminLeads({
  token,
  productLeads = [],
  membershipLeads = [],
  courseLeads = [],
  onRefetch,
}: AdminLeadsProps) {
  const client = useApolloClient();
  const context = useMemo(() => ({ headers: { authorization: `Bearer ${token}` } }), [token]);

  // Unified leads array
  const allLeads = useMemo<LeadItem[]>(() => {
    const mLeads: LeadItem[] = membershipLeads.map((m) => ({
      id: m.id,
      kind: 'membership',
      kindLabel: 'Membresía VIP',
      kindIcon: 'fa-crown',
      status: m.status || 'NEW',
      createdAt: m.createdAt,
      customerName: m.customerName || 'Cliente sin nombre',
      phone: m.phone,
      email: m.email,
      notes: m.notes,
      referenceName: m.planName || 'Plan no especificado',
    }));

    const cLeads: LeadItem[] = courseLeads.map((c) => ({
      id: c.id,
      kind: 'course',
      kindLabel: 'Curso / Academia',
      kindIcon: 'fa-graduation-cap',
      status: c.status || 'NEW',
      createdAt: c.createdAt,
      customerName: c.customerName || 'Alumno sin nombre',
      phone: c.phone,
      email: c.email,
      notes: c.notes,
      referenceName: c.courseName || 'Curso no especificado',
    }));

    const pLeads: LeadItem[] = productLeads.map((p) => ({
      id: p.id,
      kind: 'product',
      kindLabel: 'Reserva Producto',
      kindIcon: 'fa-bottle-droplet',
      status: p.status || 'NEW',
      createdAt: p.createdAt,
      customerName: p.customerName || 'Cliente sin nombre',
      phone: p.phone,
      email: p.email,
      notes: p.notes,
      referenceName: p.productName || 'Producto no especificado',
    }));

    return [...mLeads, ...cLeads, ...pLeads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [productLeads, membershipLeads, courseLeads]);

  // Filters state
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'membership' | 'course' | 'product'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Busy & Toast Feedback
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const notify = (text: string, error = false) => {
    setToast({ text, error });
    setTimeout(() => setToast(null), 4000);
  };

  // Update lead status
  const handleStatusChange = async (lead: LeadItem, newStatus: string) => {
    setBusyId(lead.id);
    try {
      await client.mutate({
        mutation: UPDATE_LEAD_STATUS,
        variables: {
          kind: lead.kind,
          id: lead.id,
          status: newStatus,
        },
        context,
      });
      await onRefetch();
      notify(`Solicitud de ${lead.customerName} actualizada a ${STATUS_CONFIGS[newStatus]?.label || newStatus}.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Error al actualizar estado.', true);
    } finally {
      setBusyId(null);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return allLeads.filter((item) => {
      if (categoryFilter !== 'all' && item.kind !== categoryFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        item.customerName.toLowerCase().includes(q) ||
        item.referenceName.toLowerCase().includes(q) ||
        (item.phone && item.phone.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      );
    });
  }, [allLeads, categoryFilter, statusFilter, searchTerm]);

  // Stats
  const totalLeads = allLeads.length;
  const newLeadsCount = allLeads.filter((l) => l.status === 'NEW').length;
  const contactedCount = allLeads.filter((l) => l.status === 'CONTACTED').length;
  const confirmedCount = allLeads.filter((l) => l.status === 'CONFIRMED').length;

  const stats = [
    {
      icon: 'fa-inbox',
      value: totalLeads,
      label: 'Solicitudes Totales',
    },
    {
      icon: 'fa-bell',
      value: newLeadsCount,
      label: 'Nuevas (Prioritarias)',
    },
    {
      icon: 'fa-comments',
      value: contactedCount,
      label: 'En Contacto',
    },
    {
      icon: 'fa-circle-check',
      value: confirmedCount,
      label: 'Confirmadas',
    },
  ];

  return (
    <div className="gallery-admin-hub">
      <AdminToast toast={toast} />

      {/* HEADER */}
      <div className="gallery-hub-header">
        <div className="gallery-hub-title-block">
          <div className="gallery-hub-pill">問合せ · CRM & CONTACTOS COMERCIALES</div>
          <h2>Bandeja de Solicitudes y Leads</h2>
          <p>
            Gestiona prospectos de Membresías VIP, inscripciones a cursos de la academia y reservas de stock de productos.
          </p>
        </div>

        <div className="gallery-hub-actions">
          {newLeadsCount > 0 && (
            <div className="px-3.5 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-oswald uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span>{newLeadsCount} pendientes de contacto</span>
            </div>
          )}
        </div>
      </div>

      {/* STATS */}
      <AdminStatsBar items={stats} />

      {/* CATEGORY & STATUS FILTER BAR */}
      <div className="services-filter-bar">
        {/* CATEGORY TABS */}
        <div className="services-tabs-wrap">
          <button
            type="button"
            className={`service-tab-btn ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            <i className="fa-solid fa-layer-group" />
            <span>Todas ({allLeads.length})</span>
          </button>
          <button
            type="button"
            className={`service-tab-btn ${categoryFilter === 'membership' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('membership')}
          >
            <i className="fa-solid fa-crown text-[#dfa43a]" />
            <span>Membresías ({membershipLeads.length})</span>
          </button>
          <button
            type="button"
            className={`service-tab-btn ${categoryFilter === 'course' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('course')}
          >
            <i className="fa-solid fa-graduation-cap text-[#38bdf8]" />
            <span>Cursos ({courseLeads.length})</span>
          </button>
          <button
            type="button"
            className={`service-tab-btn ${categoryFilter === 'product' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('product')}
          >
            <i className="fa-solid fa-bottle-droplet text-[#4ade80]" />
            <span>Productos ({productLeads.length})</span>
          </button>
        </div>

        {/* SEARCH BOX */}
        <div className="admin-search-box">
          <i className="fa-solid fa-magnifying-glass search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Buscar por cliente, teléfono, nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => setSearchTerm('')}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      </div>

      {/* STATUS FILTER PILLS */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="text-[10px] font-oswald text-[#888] uppercase tracking-widest mr-1">
          Filtrar estado:
        </span>
        {[
          { key: 'all', label: 'Todos' },
          { key: 'NEW', label: 'Nuevas' },
          { key: 'CONTACTED', label: 'En Contacto' },
          { key: 'CONFIRMED', label: 'Confirmadas' },
          { key: 'CLOSED', label: 'Cerradas' },
          { key: 'CANCELLED', label: 'Canceladas' },
        ].map((st) => (
          <button
            key={st.key}
            type="button"
            className={`px-3 py-1 rounded-md text-xs font-oswald uppercase tracking-widest transition-all ${
              statusFilter === st.key
                ? 'bg-[#d91e18] text-white shadow-sm'
                : 'bg-[#141414] border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#444]'
            }`}
            onClick={() => setStatusFilter(st.key)}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* LEADS LIST / CARDS */}
      {filteredLeads.length === 0 ? (
        <div className="gallery-empty-state">
          <div className="empty-icon-circle">
            <i className="fa-solid fa-inbox" />
          </div>
          <h3>No se encontraron solicitudes</h3>
          <p>
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'No hay solicitudes que coincidan con los filtros aplicados.'
              : 'Las solicitudes comerciales que ingresen por la web aparecerán aquí en tiempo real.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLeads.map((lead) => {
            const stConf = STATUS_CONFIGS[lead.status] || STATUS_CONFIGS.NEW;
            const isBusy = busyId === lead.id;
            const cleanPhone = cleanPhoneNumber(lead.phone);
            const waGreeting = encodeURIComponent(
              `Hola ${lead.customerName}, te escribimos de ManuBarber respecto a tu solicitud de ${lead.referenceName}. ¿En qué podemos ayudarte?`
            );
            const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waGreeting}` : '';

            return (
              <article
                key={`${lead.kind}-${lead.id}`}
                className={`bg-[#141414] border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 card-hover ${
                  lead.status === 'NEW'
                    ? 'border-red-500/40 shadow-[0_0_20px_rgba(217,30,24,0.08)]'
                    : 'border-[#2a2a2a]'
                }`}
              >
                <div>
                  {/* TOP BAR: KIND BADGE & DATE */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[9px] font-oswald tracking-widest uppercase px-2.5 py-1 rounded-full border ${
                        lead.kind === 'membership'
                          ? 'bg-[#dfa43a]/10 text-[#dfa43a] border-[#dfa43a]/30'
                          : lead.kind === 'course'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      <i className={`fa-solid ${lead.kindIcon}`} />
                      <span>{lead.kindLabel}</span>
                    </span>

                    <span className="text-[10px] text-[#888] font-oswald tracking-wider">
                      {formatLeadDate(lead.createdAt)}
                    </span>
                  </div>

                  {/* CUSTOMER NAME & REFERENCE */}
                  <div className="mb-3">
                    <h4 className="text-base font-oswald uppercase tracking-wide text-[#f5f5f5] mb-1 truncate">
                      {lead.customerName}
                    </h4>
                    <div className="text-xs text-[#d91e18] font-oswald uppercase tracking-wider font-semibold">
                      {lead.referenceName}
                    </div>
                  </div>

                  {/* CONTACT DATA */}
                  <div className="space-y-1.5 mb-4 text-xs text-[#888]">
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-[#ccc]">
                        <i className="fa-solid fa-phone text-[10px] text-[#888]" />
                        <span className="font-mono text-xs">{lead.phone}</span>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-2 truncate text-[#ccc]">
                        <i className="fa-solid fa-envelope text-[10px] text-[#888]" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                    )}
                  </div>

                  {/* NOTES / COMMENT BLOCK */}
                  {lead.notes && (
                    <div className="bg-[#0a0a0a] border border-[#222] p-3 rounded-xl mb-4 text-xs text-[#ccc] font-light leading-relaxed">
                      <span className="text-[9px] font-oswald uppercase tracking-widest text-[#888] block mb-1">
                        Mensaje del cliente:
                      </span>
                      &quot;{lead.notes}&quot;
                    </div>
                  )}
                </div>

                {/* BOTTOM ACTIONS: STATUS SELECTOR & FAST CONTACT BUTTONS */}
                <div className="pt-3 border-t border-[#2a2a2a] flex flex-col gap-2.5">
                  {/* STATUS SELECTOR */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-oswald uppercase tracking-widest text-[#888]">
                      Estado:
                    </span>
                    <select
                      className={`text-xs font-oswald uppercase tracking-widest py-1.5 px-3 rounded-lg border focus:outline-none transition-colors ${stConf.bg} ${stConf.text} ${stConf.border}`}
                      value={lead.status}
                      disabled={isBusy}
                      onChange={(e) => handleStatusChange(lead, e.target.value)}
                    >
                      <option value="NEW">Nueva</option>
                      <option value="CONTACTED">En Contacto</option>
                      <option value="CONFIRMED">Confirmada</option>
                      <option value="CLOSED">Cerrada</option>
                      <option value="CANCELLED">Cancelada</option>
                    </select>
                  </div>

                  {/* FAST CONTACT SHORTCUTS */}
                  <div className="grid grid-cols-2 gap-2">
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-xs font-oswald uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <i className="fa-brands fa-whatsapp text-sm" />
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <div className="py-2 px-3 bg-[#111] border border-[#222] text-[#888]/40 rounded-lg text-xs font-oswald uppercase tracking-widest text-center cursor-not-allowed">
                        Sin WhatsApp
                      </div>
                    )}

                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}?subject=ManuBarber - Tu solicitud de ${encodeURIComponent(
                          lead.referenceName
                        )}`}
                        className="py-2 px-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-[#d91e18] text-[#f5f5f5] rounded-lg text-xs font-oswald uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <i className="fa-solid fa-envelope" />
                        <span>Email</span>
                      </a>
                    ) : (
                      <div className="py-2 px-3 bg-[#111] border border-[#222] text-[#888]/40 rounded-lg text-xs font-oswald uppercase tracking-widest text-center cursor-not-allowed">
                        Sin Email
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
