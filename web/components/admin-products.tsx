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

export interface ProductVariantData {
  id?: string;
  label: string;
  price: number;
  stockQuantity: number;
  sku?: string | null;
}

export interface ProductData {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  badge?: string | null;
  status: string;
  stockQuantity: number;
  isFeatured?: boolean;
  sortOrder: number;
  imageId?: string | null;
  image?: {
    url: string;
    alt: string;
  } | null;
  variants: ProductVariantData[];
}

interface AdminProductsProps {
  token: string;
  apiOrigin: string;
  products: ProductData[];
  mediaAssets: MediaLibraryItem[];
  onRefetch: () => Promise<any>;
}

type FilterKey = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'FEATURED';

export function AdminProducts({
  token,
  apiOrigin,
  products = [],
  mediaAssets = [],
  onRefetch,
}: AdminProductsProps) {
  const client = useApolloClient();
  const context = useMemo(() => ({ headers: { authorization: `Bearer ${token}` } }), [token]);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<FilterKey>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState('PUBLISHED');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [variants, setVariants] = useState<ProductVariantData[]>([]);

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

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSlug('');
    setSlugEdited(false);
    setDescription('');
    setBadge('');
    setIsFeatured(false);
    setStatus('PUBLISHED');
    setSortOrder(products.length * 10);
    setVariants([
      { label: 'Estándar', price: 12990, stockQuantity: 10, sku: '' },
    ]);
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedMediaId('');
    setModalOpen(true);
  };

  const openEditModal = (p: ProductData) => {
    setEditingProduct(p);
    setName(p.name);
    setSlug(p.slug);
    setSlugEdited(true);
    setDescription(p.description || '');
    setBadge(p.badge || '');
    setIsFeatured(!!p.isFeatured);
    setStatus(p.status);
    setSortOrder(p.sortOrder ?? 0);
    setVariants(
      (p.variants || []).map((v) => ({
        id: v.id,
        label: v.label,
        price: v.price,
        stockQuantity: v.stockQuantity,
        sku: v.sku || '',
      }))
    );
    setSelectedFile(null);
    setPreviewUrl(p.image?.url || null);
    setSelectedMediaId(p.imageId || '');
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugEdited) setSlug(slugify(val));
  };

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      { label: '', price: 9990, stockQuantity: 5, sku: '' },
    ]);
  };

  const updateVariantRow = (index: number, field: keyof ProductVariantData, value: any) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeVariantRow = (index: number) => {
    if (variants.length <= 1) {
      notify('El producto debe tener al menos una presentación / variante', true);
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notify('El nombre del producto es obligatorio', true);
      return;
    }
    if (variants.length === 0) {
      notify('Debes agregar al menos una presentación y precio', true);
      return;
    }

    setBusy(true);
    try {
      let finalImageId = selectedMediaId || null;
      if (selectedFile) {
        finalImageId = await uploadMediaAsset(
          apiOrigin,
          token,
          selectedFile,
          name.trim(),
          name.trim()
        );
      }

      const totalStock = variants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);

      const input = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: description.trim() || null,
        badge: badge.trim() || null,
        status,
        stockQuantity: totalStock,
        isFeatured: Boolean(isFeatured),
        sortOrder: Number(sortOrder) || 0,
        imageId: finalImageId,
        variants: variants.map((v) => ({
          label: v.label.trim() || 'Estándar',
          price: Number(v.price) || 0,
          stockQuantity: Number(v.stockQuantity) || 0,
          sku: v.sku?.trim() || null,
        })),
      };

      if (editingProduct) {
        await client.mutate({
          mutation: ADMIN_OPERATIONS.updateProduct,
          variables: { id: editingProduct.id, input },
          context,
        });
        notify(`Producto "${name}" actualizado con éxito`);
      } else {
        await client.mutate({
          mutation: ADMIN_OPERATIONS.createProduct,
          variables: { input },
          context,
        });
        notify(`Producto "${name}" creado con éxito`);
      }
      setModalOpen(false);
      await onRefetch();
    } catch (err: any) {
      notify(err?.message || 'Error al guardar el producto', true);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleArchive = async (p: ProductData) => {
    const isCurrentlyArchived = p.status === 'ARCHIVED';
    const newStatus = isCurrentlyArchived ? 'PUBLISHED' : 'ARCHIVED';

    setBusy(true);
    try {
      const input = {
        name: p.name,
        slug: p.slug,
        description: p.description || null,
        badge: p.badge || null,
        status: newStatus,
        stockQuantity: p.stockQuantity ?? 0,
        isFeatured: Boolean(p.isFeatured),
        sortOrder: Number(p.sortOrder) || 0,
        imageId: p.imageId || null,
        variants: (p.variants || []).map((v) => ({
          label: v.label || 'Estándar',
          price: Number(v.price) || 0,
          stockQuantity: Number(v.stockQuantity) || 0,
          sku: v.sku || null,
        })),
      };

      await client.mutate({
        mutation: ADMIN_OPERATIONS.updateProduct,
        variables: { id: p.id, input },
        context,
      });

      notify(
        isCurrentlyArchived
          ? `Producto "${p.name}" publicado en tienda`
          : `Producto "${p.name}" archivado`
      );
      await onRefetch();
    } catch (err: any) {
      notify(err?.message || 'Error al cambiar estado del producto', true);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (p: ProductData) => {
    if (!window.confirm(`¿Estás seguro de eliminar el producto "${p.name}"?`)) return;
    setBusy(true);
    try {
      await client.mutate({
        mutation: ADMIN_OPERATIONS.deleteProduct,
        variables: { id: p.id },
        context,
      });
      notify(`Producto "${p.name}" eliminado correctamente`);
      await onRefetch();
    } catch (err: any) {
      notify('No se pudo eliminar el producto porque tiene registros asociados. Puedes archivarlo para ocultarlo.', true);
    } finally {
      setBusy(false);
    }
  };

  // Stats
  const totalStockUnits = useMemo(
    () => products.reduce((acc, p) => acc + (p.stockQuantity ?? 0), 0),
    [products]
  );
  const totalVariantsCount = useMemo(
    () => products.reduce((acc, p) => acc + (p.variants?.length ?? 0), 0),
    [products]
  );
  const featuredCount = useMemo(
    () => products.filter((p) => p.isFeatured).length,
    [products]
  );
  const publishedCount = useMemo(
    () => products.filter((p) => p.status === 'PUBLISHED').length,
    [products]
  );
  const draftCount = useMemo(
    () => products.filter((p) => p.status === 'DRAFT').length,
    [products]
  );
  const archivedCount = useMemo(
    () => products.filter((p) => p.status === 'ARCHIVED').length,
    [products]
  );

  const stats = [
    { icon: 'fa-bottle-droplet', value: products.length, label: 'Productos en Catálogo' },
    { icon: 'fa-cubes', value: totalVariantsCount, label: 'Presentaciones & SKU' },
    { icon: 'fa-warehouse', value: totalStockUnits, label: 'Unidades en Stock' },
    { icon: 'fa-circle-check', value: publishedCount, label: 'Publicados en Tienda' },
    { icon: 'fa-star', value: featuredCount, label: 'Productos Destacados' },
  ];

  // Filtering & Search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Status filter
      if (statusFilter === 'PUBLISHED' && p.status !== 'PUBLISHED') return false;
      if (statusFilter === 'DRAFT' && p.status !== 'DRAFT') return false;
      if (statusFilter === 'ARCHIVED' && p.status !== 'ARCHIVED') return false;
      if (statusFilter === 'FEATURED' && !p.isFeatured) return false;

      // Text search
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      const inName = p.name.toLowerCase().includes(q);
      const inSlug = p.slug.toLowerCase().includes(q);
      const inDesc = p.description?.toLowerCase().includes(q) ?? false;
      const inBadge = p.badge?.toLowerCase().includes(q) ?? false;
      const inVariants = (p.variants || []).some(
        (v) =>
          v.label.toLowerCase().includes(q) ||
          (v.sku && v.sku.toLowerCase().includes(q))
      );
      return inName || inSlug || inDesc || inBadge || inVariants;
    });
  }, [products, statusFilter, searchTerm]);

  return (
    <div className="gallery-admin-hub">
      <AdminToast toast={toast} />
      <AdminLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />

      {/* HEADER */}
      <div className="gallery-hub-header">
        <div className="gallery-hub-title-block">
          <div className="gallery-hub-pill">TIENDA Y CATÁLOGO</div>
          <h2>Productos, Cosmética & Street Care</h2>
          <p>
            Gestiona pomadas, bálsamos, aceites y perfumes con múltiples presentaciones, control de stock y fotos de alta resolución.
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
            <span>Crear nuevo producto</span>
          </button>
        </div>
      </div>

      {/* STATS */}
      <AdminStatsBar items={stats} />

      {/* FILTER & SEARCH TOOLBAR (INTUITIVE & RESPONSIVE) */}
      <div className="admin-filter-toolbar">
        <div className="filter-pills">
          <button
            type="button"
            className={`filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Todos ({products.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${statusFilter === 'PUBLISHED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PUBLISHED')}
          >
            🟢 Publicados ({publishedCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${statusFilter === 'DRAFT' ? 'active' : ''}`}
            onClick={() => setStatusFilter('DRAFT')}
          >
            🟡 Borradores ({draftCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${statusFilter === 'ARCHIVED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ARCHIVED')}
          >
            🔴 Archivados ({archivedCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${statusFilter === 'FEATURED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('FEATURED')}
          >
            ⭐ Destacados ({featuredCount})
          </button>
        </div>

        <div className="admin-search-box">
          <i className="fa-solid fa-magnifying-glass search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Buscar por nombre, SKU o tamaño..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => setSearchTerm('')}
              title="Limpiar búsqueda"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      </div>

      {/* CARDS GRID OF PRODUCTS (NO ACCORDIONS) */}
      {products.length === 0 ? (
        <div className="gallery-empty-state">
          <div className="empty-icon-circle">
            <i className="fa-solid fa-bottle-droplet" />
          </div>
          <h3>No tienes productos en el catálogo</h3>
          <p>Crea tu primer producto para comenzar a vender y exhibir en la tienda online.</p>
          <button type="button" className="gallery-btn-primary" onClick={openCreateModal}>
            <i className="fa-solid fa-plus" /> Crear primer producto
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="gallery-empty-state">
          <div className="empty-icon-circle">
            <i className="fa-solid fa-filter-circle-xmark" />
          </div>
          <h3>No hay productos que coincidan</h3>
          <p>No se encontraron productos con los filtros o término de búsqueda ingresado.</p>
          <button
            type="button"
            className="gallery-btn-primary"
            onClick={() => {
              setStatusFilter('ALL');
              setSearchTerm('');
            }}
          >
            <i className="fa-solid fa-rotate-left" /> Restablecer filtros
          </button>
        </div>
      ) : (
        <div className="gallery-cards-grid">
          {filteredProducts.map((p) => {
            const variantsList = p.variants || [];
            const priceRange =
              variantsList.length > 0
                ? variantsList.map((v) => clp(v.price)).join(' · ')
                : 'Sin precio';

            const isArchived = p.status === 'ARCHIVED';
            const isPublished = p.status === 'PUBLISHED';

            return (
              <div key={p.id} className="gallery-work-card entity-card card-hover">
                {/* TOP MEDIA / THUMBNAIL */}
                <div
                  className="card-media-wrapper product-card-media"
                  onClick={() => {
                    if (p.image?.url) {
                      setLightboxItem({
                        url: p.image.url,
                        title: p.name,
                        subtitle: p.description || '',
                        badge: p.badge || 'PRODUCTO',
                        status: p.status,
                      });
                    }
                  }}
                  title={p.image?.url ? 'Clic para ampliar fotografía' : ''}
                >
                  {p.image?.url ? (
                    <>
                      <img src={p.image.url} alt={p.name} className="card-image" />
                      <div className="card-overlay-hover">
                        <span className="btn-overlay-zoom">
                          <i className="fa-solid fa-magnifying-glass-plus" /> Ampliar
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="card-no-image">
                      <i className="fa-solid fa-bottle-droplet" style={{ fontSize: '1.75rem', opacity: 0.35 }} />
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666' }}>
                        Sin fotografía
                      </span>
                    </div>
                  )}

                  {/* BADGES ON MEDIA */}
                  <div className="card-badges-top">
                    <span
                      className={`badge-status ${
                        isPublished ? 'published' : isArchived ? 'archived' : 'draft'
                      }`}
                    >
                      {isPublished
                        ? 'Publicado'
                        : isArchived
                        ? 'Archivado'
                        : 'Borrador'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {p.isFeatured && (
                        <span
                          className="badge-promo"
                          style={{ background: '#d91e18' }}
                          title="Destacado en Home"
                        >
                          <i className="fa-solid fa-star" /> Destacado
                        </span>
                      )}
                      {p.badge && (
                        <span
                          className="badge-promo"
                          style={{ background: '#dfa43a', color: '#000' }}
                        >
                          {p.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <h4 className="card-title font-oswald uppercase tracking-wide">
                      {p.name}
                    </h4>
                    <span style={{ fontSize: '0.68rem', color: '#666', fontFamily: 'monospace' }}>
                      #{p.sortOrder ?? 0}
                    </span>
                  </div>

                  <span className="tag-slug">/{p.slug}</span>

                  <p className="card-alt">
                    {p.description || 'Sin descripción ingresada.'}
                  </p>

                  {/* METRICS ROW */}
                  <div className="entity-metrics-row">
                    <div className="metric-pill price">
                      <strong>{priceRange}</strong>
                    </div>

                    <div
                      className={`metric-pill ${
                        (p.stockQuantity ?? 0) > 0 ? 'stock-ok' : 'stock-zero'
                      }`}
                      title="Stock total disponible"
                    >
                      <i className="fa-solid fa-boxes-stacked" />
                      <span>
                        <strong>{p.stockQuantity ?? 0}</strong> un.
                      </span>
                    </div>
                  </div>

                  {/* VARIANT PILLS */}
                  {variantsList.length > 0 && (
                    <div className="product-variant-pills-row">
                      {variantsList.map((v, vIdx) => (
                        <span
                          key={v.id || vIdx}
                          className="product-variant-micro-pill"
                          title={`${v.label} · ${clp(v.price)} · Stock: ${v.stockQuantity}`}
                        >
                          {v.label} {v.sku ? `(${v.sku})` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* CARD FOOTER ACTIONS */}
                <div className="card-footer-actions">
                  <button
                    type="button"
                    className="card-action-btn edit"
                    onClick={() => openEditModal(p)}
                    title="Editar producto, precios y fotografía"
                  >
                    <i className="fa-solid fa-pen-to-square" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    className={`card-action-btn ${isArchived ? 'unarchive' : 'archive'}`}
                    onClick={() => handleToggleArchive(p)}
                    disabled={busy}
                    title={isArchived ? 'Publicar producto en la tienda' : 'Archivar producto (ocultar de la tienda)'}
                  >
                    <i className={`fa-solid ${isArchived ? 'fa-box-open' : 'fa-box-archive'}`} />
                    <span>{isArchived ? 'Publicar' : 'Archivar'}</span>
                  </button>

                  <button
                    type="button"
                    className="card-action-btn delete"
                    onClick={() => handleDelete(p)}
                    disabled={busy}
                    title="Eliminar producto"
                  >
                    <i className="fa-solid fa-trash-can" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {modalOpen && (
        <div className="gallery-modal-backdrop" onClick={() => !busy && setModalOpen(false)}>
          <div className="gallery-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <i className="fa-solid fa-bottle-droplet" />
                <div>
                  <h3>{editingProduct ? `Editar: ${editingProduct.name}` : 'Crear nuevo producto'}</h3>
                  <p>Define detalles, fotografía y las presentaciones de tamaño, stock y precio.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => !busy && setModalOpen(false)}
                title="Cerrar modal"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="modal-body-layout">
                {/* LEFT: IMAGE DROPZONE & BASIC SETTINGS */}
                <div className="modal-image-col">
                  <AdminImageDropzone
                    label="Fotografía del producto"
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
                      <span className="group-label">Estado</span>
                      <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="PUBLISHED">🟢 Publicado (Visible en tienda)</option>
                        <option value="DRAFT">🟡 Borrador (Solo admin)</option>
                        <option value="ARCHIVED">🔴 Archivado (Oculto)</option>
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

                  <label className="admin-check-luxury">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                    />
                    <div>
                      <strong>Destacar en la página de inicio</strong>
                      <span>Se exhibirá en la sección de productos signature.</span>
                    </div>
                  </label>
                </div>

                {/* RIGHT: FIELDS & VARIANTS MANAGER */}
                <div className="modal-fields-col">
                  <div className="gallery-form-grid">
                    <label className="gallery-field-group">
                      <span className="group-label">
                        Nombre del producto <span className="req">*</span>
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Pomada Mate Street Hold"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
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
                        placeholder="ej: pomada-mate-street"
                        value={slug}
                        onChange={(e) => {
                          setSlug(e.target.value);
                          setSlugEdited(true);
                        }}
                      />
                    </label>
                  </div>

                  <label className="gallery-field-group">
                    <span className="group-label">Descripción</span>
                    <textarea
                      rows={2}
                      placeholder="Propiedades, fijación, aroma, acabado y modo de aplicación."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </label>

                  <label className="gallery-field-group">
                    <span className="group-label">Etiqueta destacada (Badge)</span>
                    <input
                      type="text"
                      placeholder="ej: MÁS VENDIDO, EDICIÓN LIMITADA, PROMO"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                    />
                  </label>

                  {/* DYNAMIC VARIANTS MANAGER */}
                  <div className="dynamic-repeater-box">
                    <div className="repeater-header">
                      <h4>
                        <i className="fa-solid fa-cubes" /> Presentaciones, Stock y Precios
                      </h4>
                      <button
                        type="button"
                        className="btn-add-repeater-row"
                        onClick={addVariantRow}
                      >
                        <i className="fa-solid fa-plus" /> Añadir presentación
                      </button>
                    </div>

                    <div className="repeater-rows-list">
                      {variants.map((v, idx) => (
                        <div key={idx} className="repeater-row-card">
                          <div className="row-inputs-grid">
                            <label>
                              <span>Presentación / Tamaño</span>
                              <input
                                type="text"
                                required
                                placeholder="Ej: 100g, 30ml, Unidad"
                                value={v.label}
                                onChange={(e) => updateVariantRow(idx, 'label', e.target.value)}
                              />
                            </label>

                            <label>
                              <span>Precio CLP</span>
                              <input
                                type="number"
                                required
                                min={0}
                                step={500}
                                value={v.price}
                                onChange={(e) =>
                                  updateVariantRow(idx, 'price', Number(e.target.value))
                                }
                              />
                            </label>

                            <label>
                              <span>Stock</span>
                              <input
                                type="number"
                                required
                                min={0}
                                value={v.stockQuantity}
                                onChange={(e) =>
                                  updateVariantRow(idx, 'stockQuantity', Number(e.target.value))
                                }
                              />
                            </label>

                            <label>
                              <span>SKU (opcional)</span>
                              <input
                                type="text"
                                placeholder="MANU-POM-01"
                                value={v.sku || ''}
                                onChange={(e) => updateVariantRow(idx, 'sku', e.target.value)}
                              />
                            </label>
                          </div>

                          <button
                            type="button"
                            className="btn-remove-row"
                            onClick={() => removeVariantRow(idx)}
                            title="Quitar presentación"
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
                {editingProduct ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: 'auto' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        handleToggleArchive(editingProduct);
                        setModalOpen(false);
                      }}
                      disabled={busy}
                      title={editingProduct.status === 'ARCHIVED' ? 'Publicar producto' : 'Archivar producto'}
                    >
                      <i className={`fa-solid ${editingProduct.status === 'ARCHIVED' ? 'fa-box-open' : 'fa-box-archive'}`} />{' '}
                      {editingProduct.status === 'ARCHIVED' ? 'Publicar' : 'Archivar'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                      onClick={() => {
                        handleDelete(editingProduct);
                        setModalOpen(false);
                      }}
                      disabled={busy}
                      title="Eliminar producto"
                    >
                      <i className="fa-solid fa-trash-can" /> Eliminar
                    </button>
                  </div>
                ) : (
                  <div style={{ marginRight: 'auto' }} />
                )}

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
                      <i className="fa-solid fa-spinner fa-spin" /> Guardando producto…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check" />{' '}
                      {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
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
