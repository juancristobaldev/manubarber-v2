'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ADMIN_OPERATIONS } from '@/lib/operations';
import { clp } from '@/components/site';
import {
  AdminImageDropzone,
  AdminLightbox,
  AdminStatsBar,
  AdminToast,
  LightboxData,
  MediaLibraryItem,
  slugify,
  uploadMediaAsset,
} from './admin-common';

export interface CourseModuleData {
  id?: string;
  title: string;
  description: string;
  icon?: string | null;
  sortOrder: number;
}

export interface CourseData {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string;
  pricePerClass: number;
  whatsappPhone?: string | null;
  heroImageId?: string | null;
  status: string;
  sortOrder: number;
  heroImage?: {
    url: string;
    alt: string;
  } | null;
  modules: CourseModuleData[];
}

interface AdminCoursesProps {
  token: string;
  apiOrigin: string;
  courses: CourseData[];
  mediaAssets: MediaLibraryItem[];
  onRefetch: () => Promise<any>;
}

export function AdminCourses({
  token,
  apiOrigin,
  courses = [],
  mediaAssets = [],
  onRefetch,
}: AdminCoursesProps) {
  const client = useApolloClient();
  const context = useMemo(() => ({ headers: { authorization: `Bearer ${token}` } }), [token]);

  // UI state
  const [openAccordionIds, setOpenAccordionIds] = useState<Record<string, boolean>>(() => {
    if (courses.length > 0) return { [courses[0].id]: true };
    return {};
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerClass, setPricePerClass] = useState<number>(45000);
  const [whatsappPhone, setWhatsappPhone] = useState('+569');
  const [status, setStatus] = useState('PUBLISHED');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [modules, setModules] = useState<CourseModuleData[]>([]);

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string>('');

  // Lightbox
  const [lightboxItem, setLightboxItem] = useState<LightboxData | null>(null);

  // Busy & Toast
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const notify = (text: string, error = false) => {
    setToast({ text, error });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordionIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setTitle('');
    setSlug('');
    setSlugEdited(false);
    setSubtitle('Capacitación personalizada One-on-One');
    setDescription('');
    setPricePerClass(45000);
    setWhatsappPhone('+56 9 7890 1234');
    setStatus('PUBLISHED');
    setSortOrder(courses.length * 10);
    setModules([
      { title: 'Fundamentos & Geometría Craneal', description: 'Visagismo y ángulos de corte.', icon: 'fa-brain', sortOrder: 0 },
      { title: 'Técnicas de Degradado (Fade)', description: 'Skin fade, low fade y transiciones limpias.', icon: 'fa-sliders', sortOrder: 1 },
    ]);
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedMediaId('');
    setModalOpen(true);
  };

  const openEditModal = (c: CourseData) => {
    setEditingCourse(c);
    setTitle(c.title);
    setSlug(c.slug);
    setSlugEdited(true);
    setSubtitle(c.subtitle || '');
    setDescription(c.description);
    setPricePerClass(c.pricePerClass);
    setWhatsappPhone(c.whatsappPhone || '');
    setStatus(c.status);
    setSortOrder(c.sortOrder ?? 0);
    setModules(
      (c.modules || []).map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        icon: m.icon || 'fa-graduation-cap',
        sortOrder: m.sortOrder ?? 0,
      }))
    );
    setSelectedFile(null);
    setPreviewUrl(c.heroImage?.url || null);
    setSelectedMediaId(c.heroImageId || '');
    setModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugEdited) setSlug(slugify(val));
  };

  const addModuleRow = () => {
    setModules((prev) => [
      ...prev,
      {
        title: '',
        description: '',
        icon: 'fa-graduation-cap',
        sortOrder: prev.length,
      },
    ]);
  };

  const updateModuleRow = (index: number, field: keyof CourseModuleData, value: any) => {
    setModules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeModuleRow = (index: number) => {
    setModules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      notify('El título del curso es obligatorio', true);
      return;
    }
    if (!description.trim()) {
      notify('La descripción del curso es obligatoria', true);
      return;
    }

    setBusy(true);
    try {
      let finalHeroImageId = selectedMediaId || null;
      if (selectedFile) {
        finalHeroImageId = await uploadMediaAsset(
          apiOrigin,
          token,
          selectedFile,
          title.trim(),
          title.trim()
        );
      }

      const input = {
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        subtitle: subtitle.trim() || null,
        description: description.trim(),
        pricePerClass: Number(pricePerClass) || 0,
        whatsappPhone: whatsappPhone.trim() || null,
        status,
        sortOrder: Number(sortOrder) || 0,
        heroImageId: finalHeroImageId,
        modules: modules.map((m, idx) => ({
          title: m.title.trim() || `Módulo ${idx + 1}`,
          description: m.description.trim() || 'Contenido práctico.',
          icon: m.icon?.trim() || null,
          sortOrder: Number(m.sortOrder ?? idx),
        })),
      };

      if (editingCourse) {
        await client.mutate({
          mutation: ADMIN_OPERATIONS.updateCourse,
          variables: { id: editingCourse.id, input },
          context,
        });
        notify(`Curso "${title}" actualizado con éxito`);
      } else {
        await client.mutate({
          mutation: ADMIN_OPERATIONS.createCourse,
          variables: { input },
          context,
        });
        notify(`Curso "${title}" creado con éxito`);
      }
      setModalOpen(false);
      await onRefetch();
    } catch (err: any) {
      notify(err?.message || 'Error al guardar el curso', true);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (c: CourseData) => {
    if (!window.confirm(`¿Estás seguro de eliminar el curso "${c.title}"?`)) return;
    setBusy(true);
    try {
      await client.mutate({
        mutation: ADMIN_OPERATIONS.deleteCourse,
        variables: { id: c.id },
        context,
      });
      notify(`Curso "${c.title}" eliminado`);
      await onRefetch();
    } catch (err: any) {
      notify('No se pudo eliminar el curso. Puede tener solicitudes asociadas; prueba archivarlo.', true);
    } finally {
      setBusy(false);
    }
  };

  const totalModulesCount = useMemo(
    () => courses.reduce((acc, c) => acc + (c.modules?.length ?? 0), 0),
    [courses]
  );
  const avgClassPrice = useMemo(() => {
    if (courses.length === 0) return 0;
    const sum = courses.reduce((acc, c) => acc + c.pricePerClass, 0);
    return Math.round(sum / courses.length);
  }, [courses]);

  const stats = [
    { icon: 'fa-graduation-cap', value: courses.length, label: 'Cursos & Talleres' },
    { icon: 'fa-layer-group', value: totalModulesCount, label: 'Módulos Prácticos' },
    { icon: 'fa-tag', value: clp(avgClassPrice), label: 'Precio Promedio / Clase' },
    {
      icon: 'fa-check-circle',
      value: courses.filter((c) => c.status === 'PUBLISHED').length,
      label: 'Cursos Publicados',
    },
  ];

  return (
    <div className="gallery-admin-hub">
      <AdminToast toast={toast} />
      <AdminLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />

      {/* HEADER */}
      <div className="gallery-hub-header">
        <div className="gallery-hub-title-block">
          <div className="gallery-hub-pill">ACADEMIA Y FORMACIÓN</div>
          <h2>Cursos, Masterclasses & Capacitación</h2>
          <p>
            Administra cursos de barbería urbana con módulos formativos, imagen hero y contacto directo a WhatsApp.
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
            <span>Crear nuevo curso</span>
          </button>
        </div>
      </div>

      {/* STATS */}
      <AdminStatsBar items={stats} />

      {/* ACCORDIONS OF COURSES */}
      <div className="gallery-accordion-container">
        {courses.length === 0 ? (
          <div className="gallery-empty-state">
            <div className="empty-icon-circle">
              <i className="fa-solid fa-graduation-cap" />
            </div>
            <h3>No tienes cursos registrados en la academia</h3>
            <p>Crea tu primer curso para ofrecer clases prácticas y captar alumnos interesados.</p>
            <button type="button" className="gallery-btn-primary" onClick={openCreateModal}>
              <i className="fa-solid fa-plus" /> Crear primer curso
            </button>
          </div>
        ) : (
          <div className="gallery-accordion-list">
            {courses.map((c, index) => {
              const isOpen = !!openAccordionIds[c.id];
              const modulesList = c.modules || [];

              return (
                <div
                  key={c.id}
                  className={`gallery-accordion-item ${isOpen ? 'is-open' : 'is-collapsed'}`}
                >
                  {/* ACCORDION HEADER */}
                  <div
                    className="accordion-header"
                    onClick={() => toggleAccordion(c.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleAccordion(c.id);
                      }
                    }}
                  >
                    <div className="header-left">
                      <span className="accordion-index-badge">#{index + 1}</span>

                      {c.heroImage?.url && (
                        <div
                          className="header-thumb-mini"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxItem({
                              url: c.heroImage!.url,
                              title: c.title,
                              subtitle: c.subtitle || c.description,
                              badge: 'CURSO',
                              status: c.status,
                            });
                          }}
                        >
                          <img src={c.heroImage.url} alt={c.title} />
                        </div>
                      )}

                      <div className="category-meta">
                        <h3 className="category-name">{c.title}</h3>
                        <div className="category-tags">
                          <span className="tag-slug">/{c.slug}</span>
                          <span className="tag-count">
                            <i className="fa-solid fa-layer-group" /> {modulesList.length}{' '}
                            {modulesList.length === 1 ? 'módulo' : 'módulos'}
                          </span>
                          <span className="tag-published">
                            {clp(c.pricePerClass)} / clase
                          </span>
                          {c.whatsappPhone && (
                            <span className="tag-slug">
                              <i className="fa-brands fa-whatsapp" style={{ color: '#25D366' }} />{' '}
                              {c.whatsappPhone}
                            </span>
                          )}
                          <span
                            className={`badge-status ${
                              c.status === 'PUBLISHED'
                                ? 'published'
                                : c.status === 'ARCHIVED'
                                ? 'archived'
                                : 'draft'
                            }`}
                          >
                            {c.status === 'PUBLISHED'
                              ? 'Publicado'
                              : c.status === 'ARCHIVED'
                              ? 'Archivado'
                              : 'Borrador'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="header-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-acc-action edit"
                        onClick={() => openEditModal(c)}
                        title="Editar curso y módulos"
                      >
                        <i className="fa-solid fa-pen-to-square" />
                        <span className="hide-on-mobile">Editar</span>
                      </button>

                      <button
                        type="button"
                        className="btn-acc-action delete"
                        onClick={() => handleDelete(c)}
                        title="Eliminar curso"
                      >
                        <i className="fa-solid fa-trash-can" />
                      </button>

                      <div className="accordion-chevron">
                        <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                      </div>
                    </div>
                  </div>

                  {/* ACCORDION BODY */}
                  {isOpen && (
                    <div className="accordion-body">
                      <div className="product-accordion-content-grid">
                        {/* LEFT: HERO IMAGE & COURSE OVERVIEW */}
                        <div className="product-info-panel">
                          <div className="panel-image-container">
                            {c.heroImage?.url ? (
                              <div
                                className="panel-img-wrap"
                                onClick={() =>
                                  setLightboxItem({
                                    url: c.heroImage!.url,
                                    title: c.title,
                                    subtitle: c.subtitle || c.description,
                                    badge: 'CURSO',
                                    status: c.status,
                                  })
                                }
                              >
                                <img src={c.heroImage.url} alt={c.title} />
                                <div className="card-overlay-hover">
                                  <span className="btn-overlay-zoom">
                                    <i className="fa-solid fa-magnifying-glass-plus" /> Vista previa
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="panel-no-img">
                                <i className="fa-solid fa-graduation-cap" />
                                <span>Sin imagen de portada</span>
                              </div>
                            )}
                          </div>

                          <div className="panel-text-wrap">
                            <h4>{c.title}</h4>
                            {c.subtitle && <p className="course-sub-lead">{c.subtitle}</p>}
                            <p>{c.description}</p>
                            <div className="price-range-badge">
                              <span>Inversión por clase:</span>
                              <strong>{clp(c.pricePerClass)}</strong>
                            </div>
                            {c.whatsappPhone && (
                              <a
                                href={`https://wa.me/${c.whatsappPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="whatsapp-lead-btn"
                              >
                                <i className="fa-brands fa-whatsapp" /> Contactar al WhatsApp
                              </a>
                            )}
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ marginTop: '0.75rem', width: '100%' }}
                              onClick={() => openEditModal(c)}
                            >
                              <i className="fa-solid fa-pen-to-square" /> Editar curso y módulos
                            </button>
                          </div>
                        </div>

                        {/* RIGHT: MODULES (CARDS) */}
                        <div className="product-variants-panel">
                          <div className="category-toolbar">
                            <div className="toolbar-info">
                              Módulos de Aprendizaje ({modulesList.length})
                            </div>
                            <button
                              type="button"
                              className="btn-quick-add-work"
                              onClick={() => openEditModal(c)}
                            >
                              <i className="fa-solid fa-plus" /> Administrar módulos
                            </button>
                          </div>

                          {modulesList.length === 0 ? (
                            <div className="accordion-empty-works">
                              <i className="fa-solid fa-layer-group" />
                              <p>No hay módulos añadidos a este curso aún.</p>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => openEditModal(c)}
                              >
                                <i className="fa-solid fa-plus" /> Añadir módulos ahora
                              </button>
                            </div>
                          ) : (
                            <div className="gallery-cards-grid modules-grid">
                              {modulesList.map((m, mIdx) => (
                                <div key={m.id || mIdx} className="module-item-card">
                                  <div className="module-card-top">
                                    <span className="module-index-badge">Módulo #{mIdx + 1}</span>
                                    {m.icon && (
                                      <i className={`fa-solid ${m.icon} module-icon-badge`} />
                                    )}
                                  </div>
                                  <h5 className="module-title">{m.title}</h5>
                                  <p className="module-desc">{m.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT COURSE MODAL */}
      {modalOpen && (
        <div className="gallery-modal-backdrop" onClick={() => !busy && setModalOpen(false)}>
          <div className="gallery-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-graduation-cap" />
                <div>
                  <h3>{editingCourse ? `Editar: ${editingCourse.title}` : 'Crear nuevo curso'}</h3>
                  <p>Configura título, portada, arancel por clase y los módulos que aprenderá el alumno.</p>
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
              <div className="modal-body-layout">
                {/* LEFT: IMAGE DROPZONE & BASIC SETTINGS */}
                <div className="modal-image-col">
                  <AdminImageDropzone
                    label="Imagen de portada (Hero del Curso)"
                    selectedFile={selectedFile}
                    previewUrl={previewUrl}
                    selectedMediaId={selectedMediaId}
                    mediaAssets={mediaAssets}
                    onFilePicked={(file) => {
                      setSelectedFile(file);
                      if (file) setPreviewUrl(URL.createObjectURL(file));
                    }}
                    onMediaSelected={(mediaId, url) => {
                      setSelectedMediaId(mediaId);
                      setSelectedFile(null);
                      setPreviewUrl(url);
                    }}
                    onClear={() => {
                      setSelectedFile(null);
                      setSelectedMediaId('');
                      setPreviewUrl(null);
                    }}
                  />

                  <div className="gallery-form-grid" style={{ marginTop: '1rem' }}>
                    <label className="gallery-field-group">
                      <span className="group-label">
                        Precio por clase CLP <span className="req">*</span>
                      </span>
                      <input
                        type="number"
                        required
                        min={0}
                        step={1000}
                        value={pricePerClass}
                        onChange={(e) => setPricePerClass(Number(e.target.value))}
                      />
                    </label>

                    <label className="gallery-field-group">
                      <span className="group-label">WhatsApp de contacto</span>
                      <input
                        type="text"
                        placeholder="+56 9 1234 5678"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="gallery-form-grid">
                    <label className="gallery-field-group">
                      <span className="group-label">Estado</span>
                      <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="PUBLISHED">🟢 Publicado (Visible en academia)</option>
                        <option value="DRAFT">🟡 Borrador (Solo admin)</option>
                        <option value="ARCHIVED">🔴 Archivado</option>
                      </select>
                    </label>

                    <label className="gallery-field-group">
                      <span className="group-label">Orden</span>
                      <input
                        type="number"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(Number(e.target.value))}
                      />
                    </label>
                  </div>
                </div>

                {/* RIGHT: METADATA & MODULES MANAGER */}
                <div className="modal-fields-col">
                  <div className="gallery-form-grid">
                    <label className="gallery-field-group">
                      <span className="group-label">
                        Título del curso <span className="req">*</span>
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Masterclass Fade Avanzado & Navaja"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        autoFocus
                      />
                    </label>

                    <label className="gallery-field-group">
                      <span className="group-label">
                        Slug / URL <span className="req">*</span>
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="ej: masterclass-fade-avanzado"
                        value={slug}
                        onChange={(e) => {
                          setSlug(e.target.value);
                          setSlugEdited(true);
                        }}
                      />
                    </label>
                  </div>

                  <label className="gallery-field-group">
                    <span className="group-label">Subtítulo o Gancho</span>
                    <input
                      type="text"
                      placeholder="Ej: Formación intensiva 1 a 1 para barberos que buscan subir de nivel."
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                    />
                  </label>

                  <label className="gallery-field-group">
                    <span className="group-label">
                      Descripción completa <span className="req">*</span>
                    </span>
                    <textarea
                      required
                      rows={2}
                      placeholder="Requisitos, metodología, herramientas que incluye y certificación."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </label>

                  {/* DYNAMIC MODULES MANAGER */}
                  <div className="dynamic-repeater-box">
                    <div className="repeater-header">
                      <h4>
                        <i className="fa-solid fa-layer-group" /> Módulos Prácticos del Curso
                      </h4>
                      <button
                        type="button"
                        className="btn-add-repeater-row"
                        onClick={addModuleRow}
                      >
                        <i className="fa-solid fa-plus" /> Añadir módulo
                      </button>
                    </div>

                    <div className="repeater-rows-list">
                      {modules.map((m, idx) => (
                        <div key={idx} className="repeater-row-card">
                          <div className="row-inputs-grid course-module-grid">
                            <label>
                              <span>Título del Módulo</span>
                              <input
                                type="text"
                                required
                                placeholder="Ej: Visagismo y Marcado de Líneas"
                                value={m.title}
                                onChange={(e) => updateModuleRow(idx, 'title', e.target.value)}
                              />
                            </label>

                            <label>
                              <span>Icono (FontAwesome)</span>
                              <input
                                type="text"
                                placeholder="fa-brain, fa-scissors"
                                value={m.icon || ''}
                                onChange={(e) => updateModuleRow(idx, 'icon', e.target.value)}
                              />
                            </label>

                            <label style={{ gridColumn: '1 / -1' }}>
                              <span>Descripción de lo aprendido</span>
                              <input
                                type="text"
                                required
                                placeholder="Técnicas con tijera sobre peine y uso correcto de navaja."
                                value={m.description}
                                onChange={(e) =>
                                  updateModuleRow(idx, 'description', e.target.value)
                                }
                              />
                            </label>
                          </div>

                          <button
                            type="button"
                            className="btn-remove-row"
                            onClick={() => removeModuleRow(idx)}
                            title="Quitar módulo"
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={busy}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save-primary" disabled={busy}>
                  {busy ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" /> Guardando curso…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check" />{' '}
                      {editingCourse ? 'Actualizar Curso' : 'Crear Curso'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
