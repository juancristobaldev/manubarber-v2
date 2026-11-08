'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ADMIN_OPERATIONS } from '@/lib/operations';
import { clp } from '@/components/site';
import { AdminStatsBar, AdminToast, slugify } from './admin-common';

export interface MembershipBenefitData {
  id?: string;
  text: string;
  icon?: string | null;
  sortOrder: number;
}

export interface MembershipPlanData {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthlyPrice: number;
  compareAtPrice?: number | null;
  badge?: string | null;
  isFeatured: boolean;
  status: string;
  sortOrder: number;
  benefits: MembershipBenefitData[];
}

interface AdminMembershipsProps {
  token: string;
  plans: MembershipPlanData[];
  onRefetch: () => Promise<any>;
}

export function AdminMemberships({ token, plans = [], onRefetch }: AdminMembershipsProps) {
  const client = useApolloClient();
  const context = useMemo(() => ({ headers: { authorization: `Bearer ${token}` } }), [token]);

  // Filter state
  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'all'>('published');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlanData | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState<number>(35000);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(undefined);
  const [badge, setBadge] = useState('Plan VIP');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState('PUBLISHED');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [benefits, setBenefits] = useState<MembershipBenefitData[]>([
    { text: '4 Cortes de cabello al mes', icon: 'fa-scissors', sortOrder: 0 },
    { text: 'Agendamiento prioritario', icon: 'fa-calendar-check', sortOrder: 1 },
    { text: 'Tarjeta de Cliente VIP física', icon: 'fa-id-card', sortOrder: 2 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  // Action / Confirm Delete Modal
  const [deletePlanTarget, setDeletePlanTarget] = useState<MembershipPlanData | null>(null);

  // Busy & Toast Feedback
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const notify = (text: string, error = false) => {
    setToast({ text, error });
    setTimeout(() => setToast(null), 4000);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingPlan(null);
    setName('');
    setSlug('');
    setSlugEdited(false);
    setDescription('Suscripción mensual recurrente con atención prioritaria.');
    setMonthlyPrice(35000);
    setCompareAtPrice(undefined);
    setBadge('Plan VIP');
    setIsFeatured(false);
    setStatus('PUBLISHED');
    setSortOrder(plans.length);
    setBenefits([
      { text: '4 Cortes de cabello al mes', icon: 'fa-scissors', sortOrder: 0 },
      { text: 'Agendamiento prioritario', icon: 'fa-calendar-check', sortOrder: 1 },
      { text: 'Tarjeta de Cliente VIP física', icon: 'fa-id-card', sortOrder: 2 },
    ]);
    setFormError(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (plan: MembershipPlanData) => {
    setEditingPlan(plan);
    setName(plan.name);
    setSlug(plan.slug);
    setSlugEdited(true);
    setDescription(plan.description);
    setMonthlyPrice(plan.monthlyPrice);
    setCompareAtPrice(plan.compareAtPrice ?? undefined);
    setBadge(plan.badge || '');
    setIsFeatured(!!plan.isFeatured);
    setStatus(plan.status || 'PUBLISHED');
    setSortOrder(plan.sortOrder || 0);
    setBenefits(
      (plan.benefits || []).map((b, i) => ({
        text: b.text,
        icon: b.icon || 'fa-check',
        sortOrder: b.sortOrder ?? i,
      }))
    );
    setFormError(null);
    setModalOpen(true);
  };

  // Auto-slugify
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugEdited) {
      setSlug(slugify(val));
    }
  };

  // Benefits handlers
  const handleAddBenefit = () => {
    setBenefits((prev) => [
      ...prev,
      { text: '', icon: 'fa-check', sortOrder: prev.length },
    ]);
  };

  const handleUpdateBenefitText = (index: number, text: string) => {
    setBenefits((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], text };
      return copy;
    });
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefits((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick toggle status
  const handleQuickStatusChange = async (plan: MembershipPlanData, newStatus: string) => {
    setBusy(true);
    try {
      const input = {
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        compareAtPrice: plan.compareAtPrice || null,
        badge: plan.badge || null,
        isFeatured: plan.isFeatured,
        status: newStatus,
        sortOrder: plan.sortOrder,
        benefits: (plan.benefits || []).map((b, i) => ({
          text: b.text,
          icon: b.icon || null,
          sortOrder: b.sortOrder ?? i,
        })),
      };

      await client.mutate({
        mutation: ADMIN_OPERATIONS.updateMembershipPlan,
        variables: { id: plan.id, input },
        context,
      });

      await onRefetch();
      notify(`Plan ${newStatus === 'PUBLISHED' ? 'publicado' : 'archivado'} con éxito.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Error al cambiar estado.', true);
    } finally {
      setBusy(false);
    }
  };

  // Save Plan (Create or Update)
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Ingresa el nombre del plan de membresía.');
      return;
    }
    if (!slug.trim()) {
      setFormError('Ingresa un slug identificador válido.');
      return;
    }
    if (!monthlyPrice || monthlyPrice <= 0) {
      setFormError('El valor mensual debe ser mayor a 0 CLP.');
      return;
    }

    const cleanBenefits = benefits
      .map((b, i) => ({
        text: b.text.trim(),
        icon: b.icon || 'fa-check',
        sortOrder: i,
      }))
      .filter((b) => b.text.length > 0);

    const input = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      monthlyPrice: Number(monthlyPrice),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      badge: badge.trim() || null,
      isFeatured: !!isFeatured,
      status,
      sortOrder: Number(sortOrder) || 0,
      benefits: cleanBenefits,
    };

    setBusy(true);
    try {
      if (editingPlan) {
        await client.mutate({
          mutation: ADMIN_OPERATIONS.updateMembershipPlan,
          variables: { id: editingPlan.id, input },
          context,
        });
        notify('Plan de membresía actualizado correctamente.');
      } else {
        await client.mutate({
          mutation: ADMIN_OPERATIONS.createMembershipPlan,
          variables: { input },
          context,
        });
        notify('Plan de membresía creado con éxito.');
      }

      await onRefetch();
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el plan.');
      notify('Error al guardar el plan.', true);
    } finally {
      setBusy(false);
    }
  };

  // Delete Plan
  const handleDelete = async () => {
    if (!deletePlanTarget) return;
    setBusy(true);
    try {
      await client.mutate({
        mutation: ADMIN_OPERATIONS.deleteMembershipPlan,
        variables: { id: deletePlanTarget.id },
        context,
      });
      await onRefetch();
      notify('Plan de membresía eliminado.');
      setDeletePlanTarget(null);
    } catch (err) {
      notify('No se pudo eliminar el plan. Si tiene clientes o solicitudes asociadas, prueba archivarlo.', true);
    } finally {
      setBusy(false);
    }
  };

  // Filtered plans
  const filteredPlans = useMemo(() => {
    let list = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);
    if (activeTab === 'published') {
      list = list.filter((p) => p.status === 'PUBLISHED');
    } else if (activeTab === 'drafts') {
      list = list.filter((p) => p.status !== 'PUBLISHED');
    }

    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase().trim();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.badge?.toLowerCase().includes(q)
    );
  }, [plans, activeTab, searchTerm]);

  // Stats for AdminStatsBar
  const stats = [
    {
      icon: 'fa-crown',
      value: plans.length,
      label: 'Planes Totales',
    },
    {
      icon: 'fa-circle-check',
      value: plans.filter((p) => p.status === 'PUBLISHED').length,
      label: 'Publicados Web',
    },
    {
      icon: 'fa-star',
      value: plans.filter((p) => p.isFeatured).length,
      label: 'Destacados VIP',
    },
    {
      icon: 'fa-list-check',
      value: plans.reduce((acc, p) => acc + (p.benefits?.length || 0), 0),
      label: 'Beneficios Totales',
    },
  ];

  return (
    <div className="gallery-admin-hub">
      <AdminToast toast={toast} />

      {/* HEADER */}
      <div className="gallery-hub-header">
        <div className="gallery-hub-title-block">
          <div className="gallery-hub-pill">己を磨け · MEMBRESÍAS VIP</div>
          <h2>Club y Planes de Fidelización</h2>
          <p>
            Gestiona los planes de suscripción mensual recurrente, beneficios exclusivos y accesos prioritarios.
          </p>
        </div>

        <div className="gallery-hub-actions">
          <button
            type="button"
            className="gallery-btn-primary"
            onClick={openCreateModal}
            disabled={busy}
          >
            <i className="fa-solid fa-plus" />
            <span>Crear nuevo plan</span>
          </button>
        </div>
      </div>

      {/* STATS */}
      <AdminStatsBar items={stats} />

      {/* FILTER & SEARCH BAR */}
      <div className="services-filter-bar">
        <div className="services-tabs-wrap">
          <button
            type="button"
            className={`service-tab-btn ${activeTab === 'published' ? 'active' : ''}`}
            onClick={() => setActiveTab('published')}
          >
            <i className="fa-solid fa-circle-check" />
            <span>Publicados ({plans.filter((p) => p.status === 'PUBLISHED').length})</span>
          </button>
          <button
            type="button"
            className={`service-tab-btn ${activeTab === 'drafts' ? 'active' : ''}`}
            onClick={() => setActiveTab('drafts')}
          >
            <i className="fa-solid fa-box-archive" />
            <span>Borradores / Archivados ({plans.filter((p) => p.status !== 'PUBLISHED').length})</span>
          </button>
          <button
            type="button"
            className={`service-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <i className="fa-solid fa-layer-group" />
            <span>Todos ({plans.length})</span>
          </button>
        </div>

        <div className="admin-search-box">
          <i className="fa-solid fa-magnifying-glass search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Buscar plan o beneficio..."
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

      {/* MEMBERSHIP PLANS GRID (FIDELITY TO UI-KIT.HTML LINES 580-643) */}
      {filteredPlans.length === 0 ? (
        <div className="gallery-empty-state">
          <div className="empty-icon-circle">
            <i className="fa-solid fa-crown" />
          </div>
          <h3>No se encontraron planes de membresía</h3>
          <p>
            {searchTerm
              ? 'No hay resultados que coincidan con la búsqueda.'
              : 'Crea tu primer plan para comenzar a captar suscriptores VIP.'}
          </p>
          <button type="button" className="gallery-btn-primary" onClick={openCreateModal}>
            <i className="fa-solid fa-plus" /> Crear primer plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center items-stretch">
          {filteredPlans.map((plan) => {
            const isPub = plan.status === 'PUBLISHED';
            const isFeat = plan.isFeatured;

            return (
              <article
                key={plan.id}
                className={`p-8 text-center flex flex-col relative rounded-2xl transition-all duration-300 card-hover ${
                  isFeat
                    ? 'bg-[#111] border border-[#d91e18]/80 shadow-[0_0_30px_rgba(217,30,24,0.15)] ring-1 ring-[#d91e18]/40'
                    : 'bg-[#141414] border border-[#2a2a2a]'
                }`}
              >
                {/* Background glow if featured */}
                {isFeat && (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#d91e18]/5 to-transparent pointer-events-none rounded-2xl" />
                )}

                {/* Top Badge (UI-Kit canonical) */}
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-oswald tracking-widest uppercase px-4 py-1 rounded-full shadow-sm z-10 ${
                    isFeat
                      ? 'bg-[#d91e18] text-white shadow-lg shadow-[#d91e18]/30 border border-[#b81914]'
                      : 'bg-[#1a1a1a] text-[#f5f5f5] border border-[#2a2a2a]'
                  }`}
                >
                  {plan.badge || (isFeat ? 'Más Popular' : 'Plan VIP')}
                </span>

                {/* Status Dot Pill */}
                <div className="flex items-center justify-between mb-2 mt-1 relative z-10">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[9px] font-oswald tracking-widest uppercase px-2 py-0.5 rounded ${
                      isPub
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isPub ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`}
                    />
                    {isPub ? 'Publicado' : 'Borrador'}
                  </span>
                  <span className="text-[10px] text-[#888] font-oswald tracking-wider uppercase">
                    #{plan.sortOrder} · /{plan.slug}
                  </span>
                </div>

                {/* Plan Name */}
                <h4 className="text-xl font-oswald uppercase tracking-widest text-[#f5f5f5] mt-3 mb-2 relative z-10">
                  {plan.name}
                </h4>

                {/* Description */}
                {plan.description && (
                  <p className="text-xs text-[#888] font-light leading-relaxed mb-6 line-clamp-2 relative z-10">
                    {plan.description}
                  </p>
                )}

                {/* Price Display */}
                <div className="mb-6 flex flex-col items-center justify-center gap-0.5 relative z-10">
                  {plan.compareAtPrice && plan.compareAtPrice > plan.monthlyPrice && (
                    <span className="text-xs text-[#888] line-through font-light font-oswald tracking-wider">
                      {clp(plan.compareAtPrice)}
                    </span>
                  )}
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-4xl font-oswald font-bold text-[#d91e18]">
                      {clp(plan.monthlyPrice)}
                    </span>
                    <span className="text-[#888] text-sm font-light mb-1">/ mes</span>
                  </div>
                </div>

                {/* Benefits List (Canonical UI-Kit) */}
                <ul className="text-sm text-[#f5f5f5]/90 font-light space-y-3 mb-8 flex-grow text-left relative z-10">
                  {(plan.benefits || []).map((b, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 border-b border-[#2a2a2a]/40 pb-2.5 text-xs text-[#f5f5f5]"
                    >
                      <span className="text-[#d91e18] text-xs font-bold mt-0.5">✓</span>
                      <span className="flex-1">{b.text}</span>
                    </li>
                  ))}
                  {(!plan.benefits || plan.benefits.length === 0) && (
                    <li className="text-xs text-[#888] italic text-center py-2">
                      Sin beneficios listados.
                    </li>
                  )}
                </ul>

                {/* Admin Actions Bar */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[#2a2a2a]/50 relative z-10 mt-auto">
                  <button
                    type="button"
                    className="py-2.5 px-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-[#d91e18] text-[#f5f5f5] text-xs font-oswald uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all"
                    onClick={() => openEditModal(plan)}
                    disabled={busy}
                  >
                    <i className="fa-solid fa-pen-to-square" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    className={`py-2.5 px-3 border text-xs font-oswald uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      isPub
                        ? 'border-[#333] bg-transparent text-[#888] hover:text-white hover:border-[#444]'
                        : 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    }`}
                    onClick={() => handleQuickStatusChange(plan, isPub ? 'DRAFT' : 'PUBLISHED')}
                    disabled={busy}
                  >
                    <i className={`fa-solid ${isPub ? 'fa-eye-slash' : 'fa-circle-check'}`} />
                    <span>{isPub ? 'Archivar' : 'Publicar'}</span>
                  </button>

                  <button
                    type="button"
                    className="col-span-2 py-2 text-[10px] text-[#888] hover:text-[#d91e18] font-oswald uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                    onClick={() => setDeletePlanTarget(plan)}
                    disabled={busy}
                  >
                    <i className="fa-solid fa-trash" />
                    <span>Eliminar este plan</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="gallery-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="gallery-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-crown" />
                <div>
                  <h3>{editingPlan ? 'Editar Plan de Membresía' : 'Crear Plan de Membresía'}</h3>
                  <p>Configura suscripción mensual, beneficios y visibilidad en el portal.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setModalOpen(false)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* ROW 1: NOMBRE & SLUG */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-oswald tracking-widest text-[#888] uppercase mb-1.5">
                      Nombre del Plan *
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-[#f5f5f5] py-2.5 px-3.5 rounded-lg text-sm transition-colors focus:outline-none"
                      placeholder="Ej: Plan Club VIP, Solo Corte"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-oswald tracking-widest text-[#888] uppercase mb-1.5">
                      Slug URL *
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-[#f5f5f5] py-2.5 px-3.5 rounded-lg text-sm transition-colors focus:outline-none font-mono text-xs"
                      placeholder="ej: plan-club-vip"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setSlugEdited(true);
                      }}
                      required
                    />
                  </div>
                </div>

                {/* ROW 2: PRECIOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-oswald tracking-widest text-[#888] uppercase mb-1.5">
                      Precio Mensual (CLP) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-[#888] font-oswald text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-[#f5f5f5] py-2.5 pl-8 pr-3 rounded-lg text-sm transition-colors focus:outline-none font-bold"
                        placeholder="35000"
                        value={monthlyPrice}
                        onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-oswald tracking-widest text-[#888] uppercase mb-1.5">
                      Precio de Referencia / Comparación (CLP opcional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-[#888] font-oswald text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-[#f5f5f5] py-2.5 pl-8 pr-3 rounded-lg text-sm transition-colors focus:outline-none"
                        placeholder="45000"
                        value={compareAtPrice ?? ''}
                        onChange={(e) =>
                          setCompareAtPrice(e.target.value ? Number(e.target.value) : undefined)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* ROW 3: BADGE & ORDEN & ESTADO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-oswald tracking-widest text-[#888] uppercase mb-1.5">
                      Etiqueta / Badge
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-[#f5f5f5] py-2.5 px-3.5 rounded-lg text-sm transition-colors focus:outline-none"
                      placeholder="Ej: Más Popular, Exclusivo"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-oswald tracking-widest text-[#888] uppercase mb-1.5">
                      Estado
                    </label>
                    <select
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-[#f5f5f5] py-2.5 px-3 rounded-lg text-sm transition-colors focus:outline-none"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="PUBLISHED">Publicado</option>
                      <option value="DRAFT">Borrador</option>
                      <option value="ARCHIVED">Archivado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-oswald tracking-widest text-[#888] uppercase mb-1.5">
                      Orden
                    </label>
                    <input
                      type="number"
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-[#f5f5f5] py-2.5 px-3.5 rounded-lg text-sm transition-colors focus:outline-none"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* ROW 4: FEATURED SWITCH */}
                <div className="bg-[#141414] border border-[#2a2a2a] p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#d91e18]/10 text-[#d91e18] flex items-center justify-center text-sm">
                      <i className="fa-solid fa-crown" />
                    </div>
                    <div>
                      <h5 className="font-oswald uppercase tracking-wide text-xs text-[#f5f5f5] mb-0.5">
                        Destacar este plan en la portada
                      </h5>
                      <p className="text-[11px] text-[#888]">
                        Aplica borde iluminado y escala prioritaria (UI-Kit &quot;Más Popular&quot;).
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-[#2a2a2a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d91e18]" />
                  </label>
                </div>

                {/* ROW 5: DESCRIPCIÓN */}
                <div>
                  <label className="block text-[10px] font-oswald tracking-widest text-[#888] uppercase mb-1.5">
                    Descripción del Plan
                  </label>
                  <textarea
                    rows={2}
                    className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-[#f5f5f5] py-2.5 px-3.5 rounded-lg text-sm transition-colors focus:outline-none resize-none font-light"
                    placeholder="Describe a quién va dirigido este plan y el valor entregado..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                {/* ROW 6: BENEFICIOS REPEATER (BUILDER) */}
                <div className="border-t border-[#2a2a2a] pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-oswald text-xs uppercase tracking-widest text-[#f5f5f5]">
                        Beneficios Incluidos ({benefits.length})
                      </h5>
                      <p className="text-[11px] text-[#888]">
                        Se desplegarán con checkmarks en la tarjeta de suscripción.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-[#d91e18] text-[#f5f5f5] text-[11px] font-oswald uppercase tracking-widest rounded-lg flex items-center gap-1.5 transition-all"
                      onClick={handleAddBenefit}
                    >
                      <i className="fa-solid fa-plus text-[#d91e18]" />
                      <span>Añadir beneficio</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {benefits.map((b, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-[#161616] p-2 rounded-lg border border-[#2a2a2a]"
                      >
                        <span className="text-[#d91e18] font-bold text-xs pl-2">✓</span>
                        <input
                          type="text"
                          className="flex-1 bg-transparent border-0 text-[#f5f5f5] text-xs focus:outline-none"
                          placeholder="Ej: 4 Cortes de cabello al mes..."
                          value={b.text}
                          onChange={(e) => handleUpdateBenefitText(idx, e.target.value)}
                        />
                        <button
                          type="button"
                          className="p-1.5 text-[#888] hover:text-[#d91e18] transition-colors"
                          onClick={() => handleRemoveBenefit(idx)}
                          title="Eliminar beneficio"
                        >
                          <i className="fa-solid fa-trash text-xs" />
                        </button>
                      </div>
                    ))}
                    {benefits.length === 0 && (
                      <div className="p-3 bg-[#111] border border-dashed border-[#2a2a2a] text-center text-xs text-[#888] rounded-lg">
                        Sin beneficios. Haz clic en &quot;Añadir beneficio&quot; para sumar el primero.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="p-4 bg-[#181818] border-t border-[#2a2a2a] flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-transparent border border-[#333] hover:bg-[#222] text-[#888] hover:text-white text-xs font-oswald uppercase tracking-widest rounded-lg transition-colors"
                  onClick={() => setModalOpen(false)}
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
                  <span>{busy ? 'Guardando…' : editingPlan ? 'Actualizar Plan' : 'Guardar Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletePlanTarget && (
        <div className="gallery-modal-backdrop" onClick={() => setDeletePlanTarget(null)}>
          <div
            className="gallery-modal-dialog"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#d91e18]/10 text-[#d91e18] flex items-center justify-center mx-auto mb-4 text-xl">
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <h3 className="text-lg font-oswald uppercase text-[#f5f5f5] mb-2 tracking-wide">
                ¿Eliminar Plan &quot;{deletePlanTarget.name}&quot;?
              </h3>
              <p className="text-xs text-[#888] mb-6 leading-relaxed">
                Esta acción no se puede deshacer. Si el plan tiene solicitudes asociadas en la base de datos, te sugerimos cambiar su estado a <strong>Archivado</strong>.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  className="px-4 py-2.5 bg-[#1a1a1a] border border-[#333] text-[#888] hover:text-white rounded-lg text-xs font-oswald uppercase tracking-widest transition-colors"
                  onClick={() => setDeletePlanTarget(null)}
                  disabled={busy}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 bg-[#d91e18] hover:bg-[#b81914] text-white rounded-lg text-xs font-oswald uppercase tracking-widest transition-colors font-bold shadow-md"
                  onClick={handleDelete}
                  disabled={busy}
                >
                  {busy ? 'Eliminando…' : 'Sí, Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
