'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ADMIN_OPERATIONS } from '@/lib/operations';
import { compressImage } from '@/lib/image-compression';
import {
  AdminImageDropzone,
  AdminLightbox,
  AdminStatsBar,
  AdminToast,
  formatBytes,
  LightboxData,
  slugify,
  uploadMediaAsset,
} from './admin-common';

export interface GalleryCategoryData {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface MediaAssetData {
  id: string;
  url: string;
  alt: string;
  title?: string | null;
  mimeType?: string | null;
}

export interface GalleryItemData {
  id: string;
  title: string;
  alt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | string;
  sortOrder: number;
  mediaId: string;
  categoryId: string;
  media: {
    url: string;
    alt: string;
  };
}

interface AdminGalleryProps {
  token: string;
  apiOrigin: string;
  categories: GalleryCategoryData[];
  galleryItems: GalleryItemData[];
  mediaAssets: MediaAssetData[];
  onRefetch: () => Promise<any>;
}

export function AdminGallery({
  token,
  apiOrigin,
  categories = [],
  galleryItems = [],
  mediaAssets = [],
  onRefetch,
}: AdminGalleryProps) {
  const client = useApolloClient();
  const context = useMemo(() => ({ headers: { authorization: `Bearer ${token}` } }), [token]);

  // UI state
  const [activeTab, setActiveTab] = useState<'works' | 'media'>('works');
  const [openAccordionIds, setOpenAccordionIds] = useState<Record<string, boolean>>(() => {
    if (categories.length > 0) {
      return { [categories[0].id]: true };
    }
    return {};
  });

  // Category creation / edit state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GalleryCategoryData | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catSlugEdited, setCatSlugEdited] = useState(false);
  const [catOrder, setCatOrder] = useState<number>(0);

  // Work creation / edit state
  const [workModalOpen, setWorkModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<GalleryItemData | null>(null);
  const [workCategoryId, setWorkCategoryId] = useState<string>('');
  const [workTitle, setWorkTitle] = useState('');
  const [workAlt, setWorkAlt] = useState('');
  const [workStatus, setWorkStatus] = useState<string>('PUBLISHED');
  const [workSortOrder, setWorkSortOrder] = useState<number>(0);

  // Work image selection state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string>('');

  // Lightbox preview modal state
  const [previewItem, setPreviewItem] = useState<LightboxData | null>(null);

  // Standalone media uploader state (for media tab)
  const [mediaUploadFile, setMediaUploadFile] = useState<File | null>(null);
  const [mediaUploadAlt, setMediaUploadAlt] = useState('');
  const [mediaUploadPreview, setMediaUploadPreview] = useState<string | null>(null);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [mediaValidationError, setMediaValidationError] = useState<string | null>(null);
  const [isCompressingMedia, setIsCompressingMedia] = useState(false);
  const [mediaSavings, setMediaSavings] = useState<string | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  const processStandaloneFile = async (file: File) => {
    setMediaValidationError(null);
    setMediaSavings(null);
    if (!file.type.startsWith('image/')) {
      setMediaValidationError('Formato no soportado. Debe ser una imagen.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setMediaValidationError(`El archivo pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB (máx 50 MB).`);
      return;
    }
    setIsCompressingMedia(true);
    try {
      const result = await compressImage(file);
      setMediaUploadFile(result.file);
      setMediaUploadPreview(result.previewUrl);
      if (result.savedPercentage > 0) {
        setMediaSavings(`-${result.savedPercentage}% WebP (${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)})`);
      }
      if (!mediaUploadAlt) setMediaUploadAlt(file.name.replace(/\.[^/.]+$/, ''));
    } catch {
      setMediaUploadFile(file);
      setMediaUploadPreview(URL.createObjectURL(file));
      if (!mediaUploadAlt) setMediaUploadAlt(file.name.replace(/\.[^/.]+$/, ''));
    } finally {
      setIsCompressingMedia(false);
    }
  };

  // Global busy / toast feedback
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const notify = (text: string, error = false) => {
    setToast({ text, error });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordionIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
  }, [categories]);

  const itemsByCategoryId = useMemo(() => {
    const map = new Map<string, GalleryItemData[]>();
    for (const cat of categories) {
      map.set(cat.id, []);
    }
    for (const item of galleryItems) {
      const list = map.get(item.categoryId);
      if (list) {
        list.push(item);
      } else {
        const uncat = map.get('uncategorized') || [];
        uncat.push(item);
        map.set('uncategorized', uncat);
      }
    }
    for (const [, list] of map.entries()) {
      list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    return map;
  }, [categories, galleryItems]);

  const openNewCategoryForm = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSlug('');
    setCatSlugEdited(false);
    setCatOrder(sortedCategories.length * 10);
    setShowCategoryForm(true);
  };

  const openEditCategoryForm = (cat: GalleryCategoryData) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatSlugEdited(true);
    setCatOrder(cat.sortOrder ?? 0);
    setShowCategoryForm(true);
  };

  const handleCatNameChange = (val: string) => {
    setCatName(val);
    if (!catSlugEdited) {
      setCatSlug(slugify(val));
    }
  };

  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      notify('El nombre de la categoría es obligatorio', true);
      return;
    }
    const finalSlug = catSlug.trim() || slugify(catName);
    setBusy(true);
    try {
      if (editingCategory) {
        await client.mutate({
          mutation: ADMIN_OPERATIONS.updateGalleryCategory,
          variables: {
            id: editingCategory.id,
            input: {
              name: catName.trim(),
              slug: finalSlug,
              sortOrder: Number(catOrder) || 0,
            },
          },
          context,
        });
        notify(`Categoría "${catName}" actualizada correctamente`);
      } else {
        const res = await client.mutate({
          mutation: ADMIN_OPERATIONS.createGalleryCategory,
          variables: {
            input: {
              name: catName.trim(),
              slug: finalSlug,
              sortOrder: Number(catOrder) || 0,
            },
          },
          context,
        });
        const createdId = res.data?.createGalleryCategory?.id;
        if (createdId) {
          setOpenAccordionIds((prev) => ({ ...prev, [createdId]: true }));
        }
        notify(`Categoría "${catName}" creada con éxito`);
      }
      setShowCategoryForm(false);
      setEditingCategory(null);
      await onRefetch();
    } catch (err: any) {
      notify(err?.message || 'Error al guardar la categoría', true);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCategory = async (cat: GalleryCategoryData) => {
    const worksCount = (itemsByCategoryId.get(cat.id) || []).length;
    if (worksCount > 0) {
      alert(
        `No se puede eliminar la categoría "${cat.name}" porque contiene ${worksCount} trabajo(s) asociado(s).\n\nElimina o reasigna los trabajos primero.`
      );
      return;
    }
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${cat.name}"?`)) {
      return;
    }
    setBusy(true);
    try {
      await client.mutate({
        mutation: ADMIN_OPERATIONS.deleteGalleryCategory,
        variables: { id: cat.id },
        context,
      });
      notify(`Categoría "${cat.name}" eliminada`);
      await onRefetch();
    } catch (err: any) {
      notify(err?.message || 'Error al eliminar la categoría', true);
    } finally {
      setBusy(false);
    }
  };

  const openAddWorkModal = (categoryId?: string) => {
    setEditingWork(null);
    setWorkCategoryId(categoryId || (categories[0]?.id ?? ''));
    setWorkTitle('');
    setWorkAlt('');
    setWorkStatus('PUBLISHED');
    const existing = categoryId ? itemsByCategoryId.get(categoryId) || [] : [];
    setWorkSortOrder(existing.length * 10);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setSelectedMediaId('');
    setWorkModalOpen(true);
  };

  const openEditWorkModal = (work: GalleryItemData) => {
    setEditingWork(work);
    setWorkCategoryId(work.categoryId);
    setWorkTitle(work.title);
    setWorkAlt(work.alt || '');
    setWorkStatus(work.status || 'PUBLISHED');
    setWorkSortOrder(work.sortOrder ?? 0);
    setSelectedFile(null);
    setFilePreviewUrl(work.media?.url || null);
    setSelectedMediaId(work.mediaId);
    setWorkModalOpen(true);
  };

  const handleSaveWork = async (e: FormEvent) => {
    e.preventDefault();
    if (!workTitle.trim()) {
      notify('Por favor escribe un título para el trabajo', true);
      return;
    }
    if (!workCategoryId) {
      notify('Selecciona una categoría para el trabajo', true);
      return;
    }

    setBusy(true);
    try {
      let finalMediaId = selectedMediaId;

      if (selectedFile) {
        finalMediaId = await uploadMediaAsset(
          apiOrigin,
          token,
          selectedFile,
          workAlt.trim() || workTitle.trim(),
          workTitle.trim()
        );
      } else if (!finalMediaId && !editingWork) {
        throw new Error('Debes subir una imagen o seleccionar una foto de la biblioteca');
      }

      const input = {
        title: workTitle.trim(),
        alt: workAlt.trim() || workTitle.trim(),
        categoryId: workCategoryId,
        mediaId: finalMediaId,
        status: workStatus,
        sortOrder: Number(workSortOrder) || 0,
      };

      if (editingWork) {
        await client.mutate({
          mutation: ADMIN_OPERATIONS.updateGalleryItem,
          variables: { id: editingWork.id, input },
          context,
        });
        notify(`Trabajo "${workTitle}" actualizado con éxito`);
      } else {
        await client.mutate({
          mutation: ADMIN_OPERATIONS.createGalleryItem,
          variables: { input },
          context,
        });
        notify(`Trabajo "${workTitle}" agregado a la galería`);
      }

      setWorkModalOpen(false);
      setEditingWork(null);
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setSelectedMediaId('');
      await onRefetch();
    } catch (err: any) {
      notify(err?.message || 'Error al guardar el trabajo', true);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteWork = async (work: GalleryItemData) => {
    if (!window.confirm(`¿Eliminar el trabajo "${work.title}" de la galería?`)) return;
    setBusy(true);
    try {
      await client.mutate({
        mutation: ADMIN_OPERATIONS.deleteGalleryItem,
        variables: { id: work.id },
        context,
      });
      notify(`Trabajo "${work.title}" eliminado`);
      await onRefetch();
    } catch (err: any) {
      notify(err?.message || 'No se pudo eliminar el trabajo', true);
    } finally {
      setBusy(false);
    }
  };

  const handleStandaloneUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!mediaUploadFile) {
      notify('Selecciona un archivo de imagen', true);
      return;
    }
    setBusy(true);
    try {
      await uploadMediaAsset(apiOrigin, token, mediaUploadFile, mediaUploadAlt.trim() || mediaUploadFile.name);
      notify('Imagen subida a la biblioteca con éxito');
      setMediaUploadFile(null);
      setMediaUploadAlt('');
      setMediaUploadPreview(null);
      await onRefetch();
    } catch (err: any) {
      notify(err?.message || 'Error al subir la imagen', true);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteMedia = async (mediaItem: MediaAssetData) => {
    if (!window.confirm('¿Eliminar esta imagen de la biblioteca?')) return;
    setBusy(true);
    try {
      await client.mutate({
        mutation: ADMIN_OPERATIONS.deleteMediaAsset,
        variables: { id: mediaItem.id },
        context,
      });
      notify('Imagen eliminada de la biblioteca');
      await onRefetch();
    } catch (err: any) {
      notify('No se pudo eliminar. Está en uso en algún corte o producto.', true);
    } finally {
      setBusy(false);
    }
  };

  const stats = [
    { icon: 'fa-folder-tree', value: categories.length, label: 'Categorías de Cortes' },
    { icon: 'fa-camera-retro', value: galleryItems.length, label: 'Trabajos Registrados' },
    {
      icon: 'fa-globe',
      value: galleryItems.filter((i) => i.status === 'PUBLISHED').length,
      label: 'Publicados en Web',
    },
    { icon: 'fa-photo-film', value: mediaAssets.length, label: 'Imágenes en Biblioteca' },
  ];

  return (
    <div className="gallery-admin-hub">
      <AdminToast toast={toast} />
      <AdminLightbox item={previewItem} onClose={() => setPreviewItem(null)} />

      {/* HEADER */}
      <div className="gallery-hub-header">
        <div className="gallery-hub-title-block">
          <div className="gallery-hub-pill">MÓDULO UNIFICADO</div>
          <h2>Galería de Cortes y Trabajos</h2>
          <p>
            Crea categorías, sube fotos de trabajos y administra la galería pública en un solo flujo ágil con
            previsualización instantánea.
          </p>
        </div>

        <div className="gallery-hub-actions">
          <button
            type="button"
            className="gallery-btn-primary"
            onClick={openNewCategoryForm}
            disabled={busy}
          >
            <i className="fa-solid fa-folder-plus" />
            <span>Crear nueva categoría</span>
          </button>

          <button
            type="button"
            className="gallery-btn-accent"
            onClick={() => openAddWorkModal()}
            disabled={busy || categories.length === 0}
            title={categories.length === 0 ? 'Crea primero una categoría' : 'Subir nuevo trabajo'}
          >
            <i className="fa-solid fa-cloud-arrow-up" />
            <span>Subir nuevo trabajo</span>
          </button>

          <div className="gallery-view-switcher">
            <button
              type="button"
              className={`view-btn ${activeTab === 'works' ? 'active' : ''}`}
              onClick={() => setActiveTab('works')}
            >
              <i className="fa-solid fa-scissors" /> Galería & Categorías
            </button>
            <button
              type="button"
              className={`view-btn ${activeTab === 'media' ? 'active' : ''}`}
              onClick={() => setActiveTab('media')}
            >
              <i className="fa-solid fa-images" /> Biblioteca de Medios ({mediaAssets.length})
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <AdminStatsBar items={stats} />

      {/* FORM: Create / Edit Category */}
      {showCategoryForm && (
        <div className="gallery-category-form-card">
          <div className="form-card-header">
            <div className="title-with-icon">
              <i className="fa-solid fa-layer-group" />
              <h3>
                {editingCategory ? `Editar categoría: ${editingCategory.name}` : 'Crear nueva categoría de cortes'}
              </h3>
            </div>
            <button
              type="button"
              className="btn-icon-close"
              onClick={() => setShowCategoryForm(false)}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <form onSubmit={handleSaveCategory}>
            <div className="gallery-form-grid">
              <label className="gallery-form-field">
                <span className="field-label">
                  Nombre de la categoría <span className="req">*</span>
                </span>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fades y Degradados, Diseños Urbanos, Barba Clásica"
                  value={catName}
                  onChange={(e) => handleCatNameChange(e.target.value)}
                  autoFocus
                />
              </label>

              <label className="gallery-form-field">
                <span className="field-label">
                  Identificador / Slug (URL) <span className="req">*</span>
                </span>
                <input
                  type="text"
                  required
                  placeholder="ej: fades-degradados"
                  value={catSlug}
                  onChange={(e) => {
                    setCatSlug(e.target.value);
                    setCatSlugEdited(true);
                  }}
                />
              </label>

              <label className="gallery-form-field">
                <span className="field-label">Orden de visualización</span>
                <input
                  type="number"
                  value={catOrder}
                  onChange={(e) => setCatOrder(Number(e.target.value))}
                />
              </label>
            </div>

            <div className="form-card-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowCategoryForm(false)}
                disabled={busy}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-save" disabled={busy}>
                {busy ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> Guardando…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check" />{' '}
                    {editingCategory ? 'Actualizar Categoría' : 'Crear Categoría'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 1: ACCORDION OF CATEGORIES */}
      {activeTab === 'works' && (
        <div className="gallery-accordion-container">
          {sortedCategories.length === 0 ? (
            <div className="gallery-empty-state">
              <div className="empty-icon-circle">
                <i className="fa-solid fa-scissors" />
              </div>
              <h3>No tienes categorías de cortes creadas aún</h3>
              <p>Comienza creando tu primera categoría para organizar tus fotos y cortes de pelo.</p>
              <button
                type="button"
                className="gallery-btn-primary"
                onClick={openNewCategoryForm}
              >
                <i className="fa-solid fa-plus" /> Crear primera categoría
              </button>
            </div>
          ) : (
            <div className="gallery-accordion-list">
              {sortedCategories.map((cat, index) => {
                const isOpen = !!openAccordionIds[cat.id];
                const items = itemsByCategoryId.get(cat.id) || [];
                const publishedCount = items.filter((i) => i.status === 'PUBLISHED').length;

                return (
                  <div
                    key={cat.id}
                    className={`gallery-accordion-item ${isOpen ? 'is-open' : 'is-collapsed'}`}
                  >
                    {/* ACCORDION HEADER */}
                    <div
                      className="accordion-header"
                      onClick={() => toggleAccordion(cat.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleAccordion(cat.id);
                        }
                      }}
                    >
                      <div className="header-left">
                        <span className="accordion-index-badge">#{index + 1}</span>
                        <div className="category-meta">
                          <h3 className="category-name">{cat.name}</h3>
                          <div className="category-tags">
                            <span className="tag-slug">/{cat.slug}</span>
                            <span className="tag-count">
                              <i className="fa-solid fa-image" /> {items.length}{' '}
                              {items.length === 1 ? 'trabajo' : 'trabajos'}
                            </span>
                            {publishedCount > 0 && (
                              <span className="tag-published">
                                <i className="fa-solid fa-check-circle" /> {publishedCount} publicados
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className="header-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="btn-acc-action add"
                          onClick={() => openAddWorkModal(cat.id)}
                          title="Agregar trabajo a esta categoría"
                        >
                          <i className="fa-solid fa-plus" />
                          <span className="hide-on-mobile">Agregar trabajo</span>
                        </button>

                        <button
                          type="button"
                          className="btn-acc-action edit"
                          onClick={() => openEditCategoryForm(cat)}
                          title="Editar nombre y configuración de esta categoría"
                        >
                          <i className="fa-solid fa-pen-to-square" />
                          <span className="hide-on-mobile">Editar</span>
                        </button>

                        <button
                          type="button"
                          className="btn-acc-action delete"
                          onClick={() => handleDeleteCategory(cat)}
                          title="Eliminar categoría"
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
                        <div className="category-toolbar">
                          <div className="toolbar-info">
                            Trabajos en <strong>{cat.name}</strong> ({items.length})
                          </div>
                          <button
                            type="button"
                            className="btn-quick-add-work"
                            onClick={() => openAddWorkModal(cat.id)}
                          >
                            <i className="fa-solid fa-plus" /> Subir trabajo a esta categoría
                          </button>
                        </div>

                        {items.length === 0 ? (
                          <div className="accordion-empty-works">
                            <i className="fa-solid fa-camera" />
                            <p>No hay trabajos cargados en la categoría <strong>{cat.name}</strong>.</p>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => openAddWorkModal(cat.id)}
                            >
                              <i className="fa-solid fa-upload" /> Subir el primer corte aquí
                            </button>
                          </div>
                        ) : (
                          <div className="gallery-cards-grid">
                            {items.map((item) => (
                              <div key={item.id} className="gallery-work-card">
                                <div
                                  className="card-media-wrapper"
                                  onClick={() =>
                                    setPreviewItem({
                                      url: item.media?.url,
                                      title: item.title,
                                      subtitle: item.alt,
                                      badge: cat.name,
                                      status: item.status,
                                    })
                                  }
                                >
                                  {item.media?.url ? (
                                    <img
                                      src={item.media.url}
                                      alt={item.alt || item.title}
                                      className="card-image"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="card-no-image">
                                      <i className="fa-solid fa-triangle-exclamation" />
                                      <span>Sin imagen</span>
                                    </div>
                                  )}

                                  <div className="card-badges-top">
                                    <span
                                      className={`badge-status ${
                                        item.status === 'PUBLISHED'
                                          ? 'published'
                                          : item.status === 'ARCHIVED'
                                          ? 'archived'
                                          : 'draft'
                                      }`}
                                    >
                                      {item.status === 'PUBLISHED'
                                        ? 'Publicado'
                                        : item.status === 'ARCHIVED'
                                        ? 'Archivado'
                                        : 'Borrador'}
                                    </span>
                                    <span className="badge-order">#{item.sortOrder}</span>
                                  </div>

                                  <div className="card-overlay-hover">
                                    <span className="btn-overlay-zoom">
                                      <i className="fa-solid fa-magnifying-glass-plus" /> Vista previa
                                    </span>
                                  </div>
                                </div>

                                <div className="card-body">
                                  <h4 className="card-title" title={item.title}>
                                    {item.title}
                                  </h4>
                                  <p className="card-alt" title={item.alt}>
                                    {item.alt || 'Sin descripción alternativa'}
                                  </p>
                                </div>

                                <div className="card-footer-actions">
                                  <button
                                    type="button"
                                    className="card-action-btn preview"
                                    onClick={() =>
                                      setPreviewItem({
                                        url: item.media?.url,
                                        title: item.title,
                                        subtitle: item.alt,
                                        badge: cat.name,
                                        status: item.status,
                                      })
                                    }
                                    title="Ver foto en tamaño completo"
                                  >
                                    <i className="fa-solid fa-eye" />
                                    <span>Vista previa</span>
                                  </button>

                                  <button
                                    type="button"
                                    className="card-action-btn edit"
                                    onClick={() => openEditWorkModal(item)}
                                    title="Editar datos o cambiar imagen"
                                  >
                                    <i className="fa-solid fa-pen-to-square" />
                                    <span>Editar</span>
                                  </button>

                                  <button
                                    type="button"
                                    className="card-action-btn delete"
                                    onClick={() => handleDeleteWork(item)}
                                    title="Eliminar corte"
                                  >
                                    <i className="fa-solid fa-trash-can" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STANDALONE MEDIA LIBRARY */}
      {activeTab === 'media' && (
        <div className="gallery-media-view">
          <div className="media-view-top-card">
            <div className="media-upload-area">
              <div className="media-upload-header">
                <i className="fa-solid fa-cloud-arrow-up" />
                <div>
                  <h4>Subir nueva imagen a la biblioteca</h4>
                  <p>Arrastra tu archivo o selecciónalo. JPG, PNG, WEBP, AVIF o GIF de hasta 5 MB.</p>
                </div>
              </div>

              {mediaValidationError && (
                <div className="dropzone-alert-error" style={{ marginBottom: '1rem' }}>
                  <i className="fa-solid fa-circle-exclamation" />
                  <span>{mediaValidationError}</span>
                  <button type="button" onClick={() => setMediaValidationError(null)} aria-label="Cerrar">
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              )}

              <form onSubmit={handleStandaloneUpload} className="standalone-upload-form">
                <div className="upload-input-row">
                  <div
                    className={`styled-dropzone-compact ${isDraggingMedia ? 'dragover' : ''} ${mediaUploadPreview ? 'has-file' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingMedia(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDraggingMedia(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingMedia(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processStandaloneFile(file);
                    }}
                    onClick={() => mediaFileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={mediaFileInputRef}
                      style={{ display: 'none' }}
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processStandaloneFile(file);
                      }}
                    />
                    {mediaUploadPreview ? (
                      <div className="dropzone-preview-thumb">
                        <img src={mediaUploadPreview} alt="Preview" />
                        <div className="preview-file-info">
                          <span className="file-name">{mediaUploadFile?.name}</span>
                          <span className="file-size">
                            {formatBytes(mediaUploadFile?.size)}
                            {mediaSavings && (
                              <span style={{ color: '#10B981', marginLeft: '0.4rem', fontWeight: 600 }}>
                                <i className="fa-solid fa-bolt" /> {mediaSavings}
                              </span>
                            )}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn-remove-dropzone-thumb"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMediaUploadFile(null);
                            setMediaUploadPreview(null);
                            setMediaSavings(null);
                            if (mediaFileInputRef.current) mediaFileInputRef.current.value = '';
                          }}
                          title="Quitar archivo"
                        >
                          <i className="fa-solid fa-xmark" />
                        </button>
                      </div>
                    ) : (
                      <div className="dropzone-empty-text">
                        {isCompressingMedia ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin" style={{ color: '#D91E18' }} />
                            <span>Optimizando a WebP para Vercel…</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-cloud-arrow-up" />
                            <span>{isDraggingMedia ? 'Suelta la imagen aquí…' : 'Haz clic o arrastra una imagen (auto-compresión a WebP)'}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    className="media-alt-input"
                    placeholder="Texto alternativo o descripción (opcional)"
                    value={mediaUploadAlt}
                    onChange={(e) => setMediaUploadAlt(e.target.value)}
                  />

                  <button
                    type="submit"
                    className="gallery-btn-accent"
                    disabled={!mediaUploadFile || busy}
                  >
                    {busy ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-arrow-up-from-bracket" />}
                    <span>{busy ? 'Subiendo…' : 'Subir archivo'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="media-library-grid-header">
            <h3>Archivos en la biblioteca ({mediaAssets.length})</h3>
          </div>

          <div className="media-library-grid">
            {mediaAssets.map((asset) => (
              <div key={asset.id} className="media-asset-card">
                <div
                  className="media-asset-thumb"
                  onClick={() =>
                    setPreviewItem({
                      url: asset.url,
                      title: asset.title || asset.alt,
                      subtitle: asset.alt,
                    })
                  }
                >
                  <img src={asset.url} alt={asset.alt} loading="lazy" />
                  <div className="thumb-zoom-hint">
                    <i className="fa-solid fa-magnifying-glass-plus" />
                  </div>
                </div>

                <div className="media-asset-info">
                  <span className="media-asset-name" title={asset.alt || asset.url}>
                    {asset.alt || asset.url.split('/').pop()}
                  </span>
                  <div className="media-asset-actions">
                    <button
                      type="button"
                      className="btn-tiny"
                      onClick={() => {
                        navigator.clipboard.writeText(asset.url);
                        notify('URL copiada al portapapeles');
                      }}
                      title="Copiar URL"
                    >
                      <i className="fa-solid fa-link" /> Copiar link
                    </button>
                    <button
                      type="button"
                      className="btn-tiny danger"
                      onClick={() => handleDeleteMedia(asset)}
                      title="Eliminar de biblioteca"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WORK MODAL */}
      {workModalOpen && (
        <div className="gallery-modal-backdrop" onClick={() => !busy && setWorkModalOpen(false)}>
          <div className="gallery-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-scissors" />
                <div>
                  <h3>{editingWork ? 'Editar trabajo de galería' : 'Subir nuevo trabajo a la galería'}</h3>
                  <p>Agrega fotos de cortes reales con título, descripción y previsualización en vivo.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => !busy && setWorkModalOpen(false)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleSaveWork} className="modal-form">
              <div className="modal-body-layout">
                {/* LEFT: DROPZONE USING STANDARDIZED COMPONENT */}
                <div className="modal-image-col">
                  <AdminImageDropzone
                    label="Fotografía del corte o trabajo"
                    selectedFile={selectedFile}
                    previewUrl={filePreviewUrl}
                    selectedMediaId={selectedMediaId}
                    mediaAssets={mediaAssets}
                    onFilePicked={(file) => {
                      setSelectedFile(file);
                      if (file) setFilePreviewUrl(URL.createObjectURL(file));
                    }}
                    onMediaSelected={(mediaId, url, alt) => {
                      setSelectedMediaId(mediaId);
                      setSelectedFile(null);
                      setFilePreviewUrl(url);
                      if (!workAlt) setWorkAlt(alt);
                    }}
                    onClear={() => {
                      setSelectedFile(null);
                      setSelectedMediaId('');
                      setFilePreviewUrl(null);
                    }}
                  />
                </div>

                {/* RIGHT: METADATA FIELDS */}
                <div className="modal-fields-col">
                  <label className="gallery-field-group">
                    <span className="group-label">
                      Título del trabajo / corte <span className="req">*</span>
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Ej: High Fade Texturizado con Barba Perfilada"
                      value={workTitle}
                      onChange={(e) => {
                        setWorkTitle(e.target.value);
                        if (!workAlt) setWorkAlt(e.target.value);
                      }}
                    />
                  </label>

                  <label className="gallery-field-group">
                    <span className="group-label">
                      Categoría del corte <span className="req">*</span>
                    </span>
                    <select
                      required
                      value={workCategoryId}
                      onChange={(e) => setWorkCategoryId(e.target.value)}
                    >
                      <option value="">Selecciona una categoría...</option>
                      {sortedCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="gallery-field-group">
                    <span className="group-label">Texto alternativo (Alt) / Descripción</span>
                    <input
                      type="text"
                      placeholder="Describe el corte para accesibilidad y SEO"
                      value={workAlt}
                      onChange={(e) => setWorkAlt(e.target.value)}
                    />
                  </label>

                  <div className="field-row-split">
                    <label className="gallery-field-group">
                      <span className="group-label">Estado de publicación</span>
                      <select
                        value={workStatus}
                        onChange={(e) => setWorkStatus(e.target.value)}
                      >
                        <option value="PUBLISHED">🟢 Publicado (Visible en web)</option>
                        <option value="DRAFT">🟡 Borrador (Solo admin)</option>
                        <option value="ARCHIVED">🔴 Archivado (Oculto)</option>
                      </select>
                    </label>

                    <label className="gallery-field-group">
                      <span className="group-label">Orden relativo</span>
                      <input
                        type="number"
                        value={workSortOrder}
                        onChange={(e) => setWorkSortOrder(Number(e.target.value))}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setWorkModalOpen(false)}
                  disabled={busy}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save-primary" disabled={busy}>
                  {busy ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" /> Guardando…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check" />{' '}
                      {editingWork ? 'Guardar Cambios' : 'Publicar Trabajo en Galería'}
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
