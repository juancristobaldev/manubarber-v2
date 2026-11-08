'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ADMIN_OPERATIONS } from '@/lib/operations';
import { clp } from '@/components/site';
import { AdminToast, slugify } from './admin-common';

export interface ServiceData {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  durationMinutes?: number | null;
  icon?: string | null;
  badge?: string | null;
  isFeatured: boolean;
  status: string;
  sortOrder: number;
}

interface AdminServicesProps {
  token: string;
  services: ServiceData[];
  onRefetch: () => Promise<any>;
}

const ICON_PRESETS = [
  { icon: 'fa-scissors', label: 'Tijeras' },
  { icon: 'fa-razor', label: 'Navaja' },
  { icon: 'fa-spray-can', label: 'Spray' },
  { icon: 'fa-crown', label: 'VIP' },
  { icon: 'fa-spa', label: 'Tratamiento' },
  { icon: 'fa-fire', label: 'Toalla Caliente' },
  { icon: 'fa-bolt', label: 'Express' },
  { icon: 'fa-wand-magic-sparkles', label: 'Diseño' },
];

export function AdminServices({ token, services = [], onRefetch }: AdminServicesProps) {
  const client = useApolloClient();
  const context = useMemo(() => ({ headers: { authorization: `Bearer ${token}` } }), [token]);

  // Filter state
  const [activeTab, setActiveTab] = useState<'published' | 'archived' | 'all'>('published');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(15000);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [icon, setIcon] = useState('fa-scissors');
  const [badge, setBadge] = useState('');
  const [status, setStatus] = useState('PUBLISHED');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);

  // Preview Modal
  const [previewService, setPreviewService] = useState<ServiceData | null>(null);

  // Confirm Action Modal (Eliminar vs Archivar)
  const [actionService, setActionService] = useState<ServiceData | null>(null);

  // Busy & Toast Feedback
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const notify = (text: string, error = false) => {
    setToast({ text, error });
    setTimeout(() => setToast(null), 4000);
  };

  // Filtered lists
  const publishedServices = useMemo(
    () => services.filter((s) => s.status === 'PUBLISHED').sort((a, b) => a.sortOrder - b.sortOrder),
    [services]
  );

  const archivedServices = useMemo(
    () => services.filter((s) => s.status !== 'PUBLISHED').sort((a, b) => a.sortOrder - b.sortOrder),
    [services]
  );

  const displayedServices = useMemo(() => {
    let list: ServiceData[] = [];
    if (activeTab === 'published') list = publishedServices;
    else if (activeTab === 'archived') list = archivedServices;
    else list = [...services].sort((a, b) => a.sortOrder - b.sortOrder);

    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase().trim();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [activeTab, publishedServices, archivedServices, services, searchTerm]);

  // Statistics
  const avgPrice = useMemo(() => {
    if (services.length === 0) return 0;
    const sum = services.reduce((acc, s) => acc + s.price, 0);
    return Math.round(sum / services.length);
  }, [services]);

  const openCreateModal = () => {
    setEditingService(null);
    setName('');
    setSlug('');
    setSlugEdited(false);
    setDescription('');
    setPrice(15000);
    setDurationMinutes(45);
    setIcon('fa-scissors');
    setBadge('');
    setStatus('PUBLISHED');
    setSortOrder(services.length * 10);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (service: ServiceData) => {
    setEditingService(service);
    setName(service.name);
    setSlug(service.slug);
    setSlugEdited(true);
    setDescription(service.description);
    setPrice(service.price);
    setDurationMinutes(service.durationMinutes ?? 45);
    setIcon(service.icon || 'fa-scissors');
    setBadge(service.badge || '');
    setStatus(service.status);
    setSortOrder(service.sortOrder ?? 0);
    setFormError(null);
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugEdited) {
      setSlug(slugify(val));
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Ingresa el nombre del servicio');
      notify('El nombre del servicio es obligatorio', true);
      return;
    }
    if (price < 0) {
      setFormError('El precio no puede ser negativo');
      notify('Precio inválido', true);
      return;
    }
    setFormError(null);
    setBusy(true);

    try {
      const input = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: description.trim(),
        price: Number(price) || 0,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        icon: icon.trim() || null,
        badge: badge.trim() || null,
        isFeatured: false,
        status,
        sortOrder: Number(sortOrder) || 0,
      };

      if (editingService) {
        await client.mutate({
          mutation: ADMIN_OPERATIONS.updateService,
          variables: { id: editingService.id, input },
          context,
        });
        notify(`Servicio "${name}" actualizado con éxito`);
      } else {
        await client.mutate({
          mutation: ADMIN_OPERATIONS.createService,
          variables: { input },
          context,
        });
        notify(`Servicio "${name}" creado con éxito`);
      }
      setModalOpen(false);
      await onRefetch();
    } catch (err: any) {
      notify(err?.message || 'Error al guardar el servicio', true);
    } finally {
      setBusy(false);
    }
  };

  // Quick Archive / Publish toggle
  const handleToggleArchive = async (service: ServiceData) => {
    const isCurrentlyPublished = service.status === 'PUBLISHED';
    const newStatus = isCurrentlyPublished ? 'ARCHIVED' : 'PUBLISHED';
    setBusy(true);

    try {
      await client.mutate({
        mutation: ADMIN_OPERATIONS.updateService,
        variables: {
          id: service.id,
          input: {
            name: service.name,
            slug: service.slug,
            description: service.description,
            price: service.price,
            durationMinutes: service.durationMinutes,
            icon: service.icon,
            badge: service.badge,
            isFeatured: false,
            status: newStatus,
            sortOrder: service.sortOrder,
          },
        },
        context,
      });
      notify(
        isCurrentlyPublished
          ? `Servicio "${service.name}" archivado correctamente.`
          : `Servicio "${service.name}" publicado y disponible en reservas.`
      );
      await onRefetch();
    } catch (err: any) {
      notify(err?.message || 'No se pudo actualizar el estado del servicio', true);
    } finally {
      setBusy(false);
    }
  };

  // Permanent Delete
  const handleDirectDelete = async (service: ServiceData) => {
    setBusy(true);
    try {
      await client.mutate({
        mutation: ADMIN_OPERATIONS.deleteService,
        variables: { id: service.id },
        context,
      });
      notify(`Servicio "${service.name}" eliminado definitivamente`);
      await onRefetch();
    } catch (err: any) {
      notify(
        'No se pudo eliminar permanentemente porque tiene reservas asociadas. Te sugerimos archivarlo.',
        true
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gallery-admin-hub">
      <AdminToast toast={toast} />

      {/* HEADER PRINCIPAL */}
      <div className="bg-[#111] border border-[#2a2a2a] p-6 rounded-2xl mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <span className="inline-block bg-brand-red/10 text-brand-red text-[10px] font-oswald tracking-widest uppercase px-2.5 py-1 rounded-md mb-2 border border-brand-red/20 font-bold">
              Catálogo y Agendamiento
            </span>
            <h2 className="text-2xl font-oswald font-bold uppercase tracking-wide text-brand-text">
              Catálogo de Servicios
            </h2>
            <p className="text-sm text-brand-muted font-light mt-1 max-w-2xl">
              Administra los servicios publicados para reserva online, sus precios, duración en minutos y estado de publicación.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="bg-brand-red hover:bg-brand-redHover text-white text-xs font-oswald uppercase tracking-widest px-5 py-3 rounded-lg flex items-center gap-2 transition-all shadow-[0_4px_14px_rgba(217,30,24,0.3)] transform hover:scale-[1.01]"
              onClick={openCreateModal}
              disabled={busy}
            >
              <i className="fa-solid fa-plus" />
              <span>Crear nuevo servicio</span>
            </button>
          </div>
        </div>

        {/* KPI GRID CANÓNICO DE UI-KIT */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#141414] border border-[#222] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center text-xl">
              <i className="fa-solid fa-scissors" />
            </div>
            <div>
              <div className="text-xl font-oswald font-bold leading-none mb-1 text-brand-text">
                {services.length}
              </div>
              <div className="text-[9px] text-brand-muted uppercase tracking-widest font-oswald">
                Total Servicios
              </div>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#222] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center text-xl border border-green-500/20">
              <i className="fa-solid fa-check-circle" />
            </div>
            <div>
              <div className="text-xl font-oswald font-bold leading-none mb-1 text-brand-text">
                {publishedServices.length}
              </div>
              <div className="text-[9px] text-brand-muted uppercase tracking-widest font-oswald">
                Publicados Web
              </div>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#222] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#222] text-brand-muted flex items-center justify-center text-xl">
              <i className="fa-solid fa-box-archive" />
            </div>
            <div>
              <div className="text-xl font-oswald font-bold leading-none mb-1 text-brand-text">
                {archivedServices.length}
              </div>
              <div className="text-[9px] text-brand-muted uppercase tracking-widest font-oswald">
                Archivados / Borradores
              </div>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#222] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#222] text-brand-text flex items-center justify-center text-xl">
              <i className="fa-solid fa-tag" />
            </div>
            <div>
              <div className="text-xl font-oswald font-bold leading-none mb-1 text-brand-text">
                {clp(avgPrice)}
              </div>
              <div className="text-[9px] text-brand-muted uppercase tracking-widest font-oswald">
                Precio Promedio
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="bg-[#111] border border-[#2a2a2a] p-4 rounded-xl mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Pestañas de estado */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-xs font-oswald uppercase tracking-widest transition-all ${
              activeTab === 'published'
                ? 'bg-brand-red text-white shadow-md font-bold'
                : 'bg-[#1a1a1a] text-brand-muted hover:text-white border border-[#333]'
            }`}
            onClick={() => setActiveTab('published')}
          >
            Publicados ({publishedServices.length})
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-xs font-oswald uppercase tracking-widest transition-all ${
              activeTab === 'archived'
                ? 'bg-brand-red text-white shadow-md font-bold'
                : 'bg-[#1a1a1a] text-brand-muted hover:text-white border border-[#333]'
            }`}
            onClick={() => setActiveTab('archived')}
          >
            Archivados ({archivedServices.length})
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-xs font-oswald uppercase tracking-widest transition-all ${
              activeTab === 'all'
                ? 'bg-brand-red text-white shadow-md font-bold'
                : 'bg-[#1a1a1a] text-brand-muted hover:text-white border border-[#333]'
            }`}
            onClick={() => setActiveTab('all')}
          >
            Todos ({services.length})
          </button>
        </div>

        {/* Buscador */}
        <div className="relative min-w-[260px]">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-xs pointer-events-none" />
          <input
            type="text"
            className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-2 pl-9 pr-3 focus:outline-none transition-colors rounded-lg text-xs font-light placeholder-brand-muted/50"
            placeholder="Buscar por nombre o slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white text-xs"
              onClick={() => setSearchTerm('')}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      </div>

      {/* GRID DE CARDS DIRECTAS (SIN ACORDEÓN) */}
      {displayedServices.length === 0 ? (
        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-12 text-center my-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-red/10 border border-brand-red/25 text-brand-red flex items-center justify-center text-2xl">
            <i className="fa-solid fa-scissors" />
          </div>
          <h3 className="font-oswald text-xl font-bold uppercase text-brand-text mb-2 tracking-wide">
            {searchTerm
              ? 'No se encontraron servicios'
              : activeTab === 'published'
              ? 'No hay servicios publicados'
              : 'No hay servicios en esta sección'}
          </h3>
          <p className="text-sm text-brand-muted font-light max-w-md mx-auto mb-6">
            {searchTerm
              ? `No hay coincidencias para "${searchTerm}". Intenta con otro término.`
              : 'Comienza creando un nuevo servicio para habilitar el agendamiento online de tus clientes.'}
          </p>
          <button
            type="button"
            className="bg-brand-red hover:bg-brand-redHover text-white text-xs font-oswald uppercase tracking-widest px-5 py-3 rounded-lg inline-flex items-center gap-2 transition-all shadow-[0_4px_14px_rgba(217,30,24,0.3)]"
            onClick={openCreateModal}
          >
            <i className="fa-solid fa-plus" />
            <span>Crear Servicio Ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedServices.map((svc) => {
            const isPublished = svc.status === 'PUBLISHED';
            return (
              <article
                key={svc.id}
                className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden flex flex-col card-hover shadow-lg transition-all duration-300 hover:border-[#3f3f3f]"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="p-5 pb-4 border-b border-[#2a2a2a]/60 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/25 text-brand-red flex-shrink-0 flex items-center justify-center text-xl shadow-inner">
                      <i className={`fa-solid ${svc.icon || 'fa-scissors'}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-oswald text-lg font-bold tracking-wide uppercase text-brand-text leading-tight truncate">
                        {svc.name}
                      </h4>
                      <span className="text-[10px] font-oswald text-brand-muted tracking-widest uppercase block truncate">
                        /{svc.slug}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {svc.badge && (
                      <span className="bg-brand-red text-white text-[9px] font-oswald uppercase tracking-widest px-2 py-0.5 rounded font-bold shadow-sm">
                        {svc.badge}
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-oswald tracking-widest uppercase px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                        isPublished
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : svc.status === 'ARCHIVED'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-[#222] text-brand-muted border-[#333]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isPublished
                            ? 'bg-green-400'
                            : svc.status === 'ARCHIVED'
                            ? 'bg-red-400'
                            : 'bg-gray-400'
                        }`}
                      />
                      {isPublished
                        ? 'Publicado'
                        : svc.status === 'ARCHIVED'
                        ? 'Archivado'
                        : 'Borrador'}
                    </span>
                  </div>
                </div>

                {/* Cuerpo de la Tarjeta */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-brand-muted font-light leading-relaxed mb-4 line-clamp-3">
                    {svc.description || 'Sin descripción detallada.'}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a]/60">
                    <div className="flex items-center gap-2">
                      <div className="bg-brand-red/10 border border-brand-red/25 text-brand-red font-oswald font-bold text-lg px-3 py-1 rounded-lg">
                        {clp(svc.price)}
                      </div>
                      {svc.durationMinutes && (
                        <div className="bg-[#1a1a1a] border border-[#333] text-brand-muted font-oswald text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                          <i className="fa-regular fa-clock" />
                          <span>{svc.durationMinutes} min</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] font-oswald text-brand-muted/70 tracking-widest uppercase">
                      #{svc.sortOrder ?? 0}
                    </div>
                  </div>
                </div>

                {/* Acciones de la Tarjeta */}
                <div className="bg-[#111] p-3 border-t border-[#2a2a2a] flex items-center gap-2">
                  {/* Botón Editar (Abre modal) */}
                  <button
                    type="button"
                    className="flex-1 py-2.5 px-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-brand-red/60 text-brand-text hover:text-white font-oswald uppercase tracking-widest text-xs rounded-lg transition-all flex items-center justify-center gap-2"
                    onClick={() => openEditModal(svc)}
                    title="Editar servicio"
                    disabled={busy}
                  >
                    <i className="fa-solid fa-pen-to-square text-brand-red" />
                    <span>Editar</span>
                  </button>

                  {/* Botón Archivar / Publicar */}
                  {isPublished ? (
                    <button
                      type="button"
                      className="py-2.5 px-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-amber-500/50 text-brand-muted hover:text-amber-400 font-oswald uppercase tracking-widest text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
                      onClick={() => handleToggleArchive(svc)}
                      title="Archivar servicio (ocultar de la agenda)"
                      disabled={busy}
                    >
                      <i className="fa-solid fa-box-archive" />
                      <span>Archivar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="py-2.5 px-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-oswald uppercase tracking-widest text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
                      onClick={() => handleToggleArchive(svc)}
                      title="Publicar servicio en reservas"
                      disabled={busy}
                    >
                      <i className="fa-solid fa-check" />
                      <span>Publicar</span>
                    </button>
                  )}

                  {/* Vista Previa */}
                  <button
                    type="button"
                    className="py-2.5 px-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-brand-muted hover:text-white rounded-lg transition-all flex items-center justify-center"
                    onClick={() => setPreviewService(svc)}
                    title="Vista previa del cliente"
                  >
                    <i className="fa-solid fa-eye text-xs" />
                  </button>

                  {/* Botón Eliminar (Abre confirmación intuitiva) */}
                  <button
                    type="button"
                    className="py-2.5 px-3 bg-[#1a1a1a] hover:bg-brand-red/10 border border-[#333] hover:border-brand-red/40 text-brand-muted hover:text-brand-red rounded-lg transition-all flex items-center justify-center"
                    onClick={() => setActionService(svc)}
                    title="Eliminar o archivar servicio"
                    disabled={busy}
                  >
                    <i className="fa-solid fa-trash-can text-xs" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODAL DE EDICIÓN / CREACIÓN COMPLETO */}
      {modalOpen && (
        <div className="gallery-modal-backdrop" onClick={() => !busy && setModalOpen(false)}>
          <div className="gallery-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-scissors" />
                <div>
                  <h3>{editingService ? `Editar Servicio: ${editingService.name}` : 'Crear Nuevo Servicio'}</h3>
                  <p>Configura todos los datos del servicio para la agenda online y catálogo público.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => !busy && setModalOpen(false)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="modal-body-layout single-col">
                <div className="gallery-form-grid">
                  {/* Nombre con Error Tooltip */}
                  <div className="relative">
                    <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                      Nombre del Servicio <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Corte Fade + Barba Ritual"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-2.5 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/40 shadow-inner"
                      autoFocus
                    />
                    {formError && !name.trim() && (
                      <div className="error-tooltip left-4 bottom-full mb-2 rounded-md">
                        <span className="error-icon rounded">!</span>
                        {formError}
                      </div>
                    )}
                  </div>

                  {/* Slug / Identificador */}
                  <div>
                    <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                      Identificador URL / Slug <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej: corte-fade-ritual"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setSlugEdited(true);
                      }}
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-2.5 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/40 shadow-inner"
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div className="mt-4">
                  <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                    Descripción del Servicio <span className="text-brand-red">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Detalla qué incluye el corte, perfilado, productos aplicados y técnica de tijera o navaja."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-2.5 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/40 shadow-inner resize-y"
                  />
                </div>

                {/* Grid Precio y Duración */}
                <div className="gallery-form-grid mt-4">
                  <div>
                    <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                      Precio CLP <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-2.5 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                      Duración Estimada (Minutos) <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={480}
                      step={5}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-2.5 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light shadow-inner"
                    />
                  </div>
                </div>

                {/* Icon Selector con Presets Rápidos */}
                <div className="mt-4">
                  <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                    Icono Representativo
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ICON_PRESETS.map((p) => (
                      <button
                        key={p.icon}
                        type="button"
                        onClick={() => setIcon(p.icon)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-oswald uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          icon === p.icon
                            ? 'bg-brand-red text-white border border-brand-red shadow-sm'
                            : 'bg-[#1a1a1a] text-brand-muted border border-[#333] hover:text-white hover:border-[#555]'
                        }`}
                      >
                        <i className={`fa-solid ${p.icon}`} />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="o ingresa clase FontAwesome: fa-scissors, fa-razor, fa-spray-can..."
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-2.5 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/40 shadow-inner"
                  />
                </div>

                {/* Estado, Badge y Orden */}
                <div className="gallery-form-grid mt-4">
                  <div>
                    <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                      Estado de Publicación
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-2.5 px-3 focus:outline-none transition-colors rounded-lg text-sm"
                    >
                      <option value="PUBLISHED">🟢 Publicado (Visible en agenda)</option>
                      <option value="ARCHIVED">🔴 Archivado (Oculto)</option>
                      <option value="DRAFT">🟡 Borrador (Interno)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                      Etiqueta Destacada (Badge Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="ej: MÁS PEDIDO, NUEVO, PROMO"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-2.5 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light placeholder-brand-muted/40 shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-oswald tracking-widest text-brand-muted uppercase mb-2">
                      Orden de Visualización
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      className="w-full bg-[#1a1a1a] border border-[#333] focus:border-white text-brand-text py-2.5 px-4 focus:outline-none transition-colors rounded-lg text-sm font-light shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Footer del Modal */}
              <div className="modal-footer-actions flex items-center justify-between">
                <div>
                  {editingService && (
                    <button
                      type="button"
                      className="text-xs font-oswald uppercase tracking-widest text-brand-muted hover:text-brand-red transition flex items-center gap-1.5"
                      onClick={() => {
                        setModalOpen(false);
                        setActionService(editingService);
                      }}
                      disabled={busy}
                    >
                      <i className="fa-solid fa-trash-can" />
                      <span>Eliminar o archivar este servicio</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="bg-transparent hover:bg-[#1a1a1a] border border-[#333] text-brand-muted hover:text-white font-oswald uppercase tracking-widest py-3 px-5 text-xs transition-all duration-300 rounded-lg"
                    onClick={() => setModalOpen(false)}
                    disabled={busy}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3 px-6 text-xs transition-all duration-300 rounded-lg shadow-[0_4px_14px_rgba(217,30,24,0.3)] flex items-center gap-2"
                    disabled={busy}
                  >
                    {busy ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin" /> Guardando…
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check" />
                        <span>{editingService ? 'Actualizar Servicio' : 'Crear Servicio'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INTUITIVO PARA ELIMINAR O ARCHIVAR */}
      {actionService && (
        <div className="gallery-modal-backdrop" onClick={() => !busy && setActionService(null)}>
          <div className="gallery-modal-dialog small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-triangle-exclamation text-brand-red" />
                <div>
                  <h3>Gestionar Servicio: {actionService.name}</h3>
                  <p>Elige si deseas archivar el servicio o eliminarlo definitivamente.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => !busy && setActionService(null)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="p-6 bg-[#141414] text-sm text-brand-muted">
              <p className="mb-4 text-brand-text font-sans">
                ¿Qué deseas hacer con el servicio <strong>&quot;{actionService.name}&quot;</strong>?
              </p>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6 text-xs flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-amber-400 font-bold uppercase font-oswald text-[11px] tracking-wide flex-shrink-0">
                    💡 Archivar (Recomendado):
                  </span>
                  <span className="text-brand-muted">
                    Oculta el servicio de la agenda online inmediatamente sin afectar el historial de reservas de tus clientes. Puedes reactivarlo en cualquier momento.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-brand-red font-bold uppercase font-oswald text-[11px] tracking-wide flex-shrink-0">
                    ⚠️ Eliminar:
                  </span>
                  <span className="text-brand-muted">
                    Borra el registro de la base de datos. Si tiene reservas pasadas asociadas, el sistema protegerá los datos y te pedirá archivarlo.
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-lg border border-[#333] text-brand-muted hover:text-white font-oswald uppercase tracking-widest text-xs transition"
                  onClick={() => setActionService(null)}
                  disabled={busy}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="px-4 py-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-oswald uppercase tracking-widest text-xs transition flex items-center justify-center gap-2"
                  onClick={() => {
                    const target = actionService;
                    setActionService(null);
                    handleToggleArchive(target);
                  }}
                  disabled={busy}
                >
                  <i className="fa-solid fa-box-archive" />
                  <span>Archivar Servicio</span>
                </button>

                <button
                  type="button"
                  className="px-4 py-2.5 rounded-lg bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest text-xs transition flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(217,30,24,0.3)]"
                  onClick={() => {
                    const target = actionService;
                    setActionService(null);
                    handleDirectDelete(target);
                  }}
                  disabled={busy}
                >
                  <i className="fa-solid fa-trash-can" />
                  <span>Eliminar Definitivamente</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA (EXPERIENCIA CLIENTE) */}
      {previewService && (
        <div className="gallery-modal-backdrop" onClick={() => setPreviewService(null)}>
          <div className="gallery-modal-dialog small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-eye" />
                <div>
                  <h3>Vista Previa del Servicio</h3>
                  <p>Así es como se visualiza la tarjeta en la experiencia de reserva.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setPreviewService(null)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="p-6 bg-[#141414]">
              <div className="bg-[#111] border border-[#2a2a2a] p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-brand-red text-white text-[10px] font-oswald uppercase tracking-widest px-2.5 py-1 rounded font-bold">
                    {previewService.badge || 'SERVICIO PROFESIONAL'}
                  </span>
                  {previewService.durationMinutes && (
                    <span className="text-xs font-oswald text-brand-muted tracking-widest uppercase flex items-center gap-1.5">
                      <i className="fa-regular fa-clock" /> {previewService.durationMinutes} MIN
                    </span>
                  )}
                </div>

                <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/25 text-brand-red flex items-center justify-center text-xl mb-3">
                  <i className={`fa-solid ${previewService.icon || 'fa-scissors'}`} />
                </div>

                <h3 className="text-xl font-oswald uppercase text-brand-text mb-2 tracking-wide font-bold">
                  {previewService.name}
                </h3>
                <p className="text-xs text-brand-muted font-light leading-relaxed mb-6">
                  {previewService.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-[#2a2a2a]">
                  <span className="text-[10px] font-oswald tracking-widest text-brand-muted uppercase">
                    Tarifa por sesión
                  </span>
                  <span className="text-xl font-oswald text-brand-red font-bold">
                    {clp(previewService.price)}
                  </span>
                </div>

                <button
                  type="button"
                  className="w-full mt-5 bg-brand-red hover:bg-brand-redHover text-white font-oswald uppercase tracking-widest py-3 text-xs transition-colors rounded-lg shadow-[0_4px_14px_rgba(217,30,24,0.3)]"
                  onClick={() => setPreviewService(null)}
                >
                  Cerrar Vista Previa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
