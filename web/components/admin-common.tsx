'use client';

import { useMemo, useRef, useState } from 'react';
import { compressImage } from '@/lib/image-compression';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadMediaAsset(
  apiOrigin: string,
  token: string,
  file: File,
  altText: string,
  title?: string
): Promise<string> {
  const asset = await uploadMediaAssetWithDetails(apiOrigin, token, file, altText, title);
  return asset.id;
}

export async function uploadMediaAssetWithDetails(
  apiOrigin: string,
  token: string,
  file: File,
  altText: string,
  title?: string
): Promise<{ id: string; url: string; alt: string }> {
  // Garantiza que la imagen sea comprimida y optimizada a WebP en el navegador
  // antes del envío por red, asegurando resistencia total ante el límite de
  // 4.5 MB de Vercel y evitando caídas por timeout o exceso de payload.
  let fileToUpload = file;
  try {
    const compression = await compressImage(file);
    fileToUpload = compression.file;
  } catch (err) {
    console.warn('Compresión en cliente omitida o fallida, usando archivo original:', err);
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('alt', altText || fileToUpload.name);
  if (title) formData.append('title', title);

  const response = await fetch(`${apiOrigin}/uploads`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: formData,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || 'Error al subir la imagen al servidor');
  }
  return {
    id: payload.id,
    url: payload.url,
    alt: payload.alt || altText || fileToUpload.name,
  };
}

/* ==========================================================================
   TOAST FEEDBACK
   ========================================================================== */
export function AdminToast({ toast }: { toast: { text: string; error?: boolean } | null }) {
  if (!toast) return null;
  return (
    <div className={`gallery-hub-toast ${toast.error ? 'error' : 'success'}`}>
      <i className={`fa-solid ${toast.error ? 'fa-circle-exclamation' : 'fa-circle-check'}`} />
      <span>{toast.text}</span>
    </div>
  );
}

/* ==========================================================================
   STATS BAR
   ========================================================================== */
export interface StatItem {
  icon: string;
  value: string | number;
  label: string;
}

export function AdminStatsBar({ items }: { items: StatItem[] }) {
  return (
    <div className="gallery-stats-bar">
      {items.map((stat, i) => (
        <div key={i} className="stat-card">
          <i className={`fa-solid ${stat.icon}`} />
          <div>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   LIGHTBOX MODAL
   ========================================================================== */
export interface LightboxData {
  url: string;
  title: string;
  subtitle?: string;
  badge?: string;
  status?: string;
}

export function AdminLightbox({
  item,
  onClose,
}: {
  item: LightboxData | null;
  onClose: () => void;
}) {
  if (!item) return null;

  return (
    <div className="gallery-lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="btn-lightbox-close"
          onClick={onClose}
          aria-label="Cerrar vista previa"
        >
          <i className="fa-solid fa-xmark" />
        </button>

        <div className="lightbox-img-wrapper">
          <img src={item.url} alt={item.title} />
        </div>

        <div className="lightbox-details-bar">
          <div className="details-text">
            <h3>{item.title}</h3>
            {item.subtitle && <p>{item.subtitle}</p>}
          </div>

          <div className="details-tags">
            {item.badge && <span className="detail-pill cat">{item.badge}</span>}
            {item.status && (
              <span className={`detail-pill status ${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            )}
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="detail-pill link"
            >
              <i className="fa-solid fa-arrow-up-right-from-square" /> Original
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   STANDARDIZED IMAGE DROPZONE & MEDIA SELECTOR
   ========================================================================== */
export interface MediaLibraryItem {
  id: string;
  url: string;
  alt: string;
  title?: string | null;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB (se comprime en el cliente a ~250 KB)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];

interface AdminImageDropzoneProps {
  label?: string;
  selectedFile: File | null;
  previewUrl: string | null;
  selectedMediaId: string;
  mediaAssets: MediaLibraryItem[];
  onFilePicked: (file: File | null) => void;
  onMediaSelected: (mediaId: string, url: string, alt: string) => void;
  onClear?: () => void;
  hint?: string;
}

export function AdminImageDropzone({
  label = 'Imagen principal',
  selectedFile,
  previewUrl,
  selectedMediaId,
  mediaAssets = [],
  onFilePicked,
  onMediaSelected,
  onClear,
  hint = 'Optimización automática WebP · JPG, PNG, WEBP, AVIF',
}: AdminImageDropzoneProps) {
  const [mode, setMode] = useState<'upload' | 'library'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    savedPercentage: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAsset = useMemo(() => {
    return mediaAssets.find((m) => m.id === selectedMediaId);
  }, [mediaAssets, selectedMediaId]);

  const filteredAssets = useMemo(() => {
    if (!libraryFilter.trim()) return mediaAssets;
    const q = libraryFilter.toLowerCase();
    return mediaAssets.filter(
      (m) =>
        m.alt?.toLowerCase().includes(q) ||
        m.title?.toLowerCase().includes(q) ||
        m.url?.toLowerCase().includes(q)
    );
  }, [mediaAssets, libraryFilter]);

  const validateAndProcessFile = async (file: File | null) => {
    setValidationError(null);
    setCompressionStats(null);
    if (!file) {
      onFilePicked(null);
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setValidationError('Formato no compatible. Usa JPG, PNG, WEBP, AVIF o GIF.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError(`El archivo pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB y supera el máximo permitido de 50 MB.`);
      return;
    }

    setIsCompressing(true);
    try {
      const result = await compressImage(file);
      onFilePicked(result.file);
      if (result.savedPercentage > 0) {
        setCompressionStats({
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          savedPercentage: result.savedPercentage,
        });
      }
    } catch (err: any) {
      console.warn('Compresión en cliente fallida, usando original:', err);
      onFilePicked(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValidationError(null);
    setCompressionStats(null);
    onFilePicked(null);
    onMediaSelected('', '', '');
    onClear?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="admin-dropzone-module">
      <div className="dropzone-header-line">
        <span className="dropzone-label">{label}</span>
        <div className="source-mode-tabs small">
          <button
            type="button"
            className={`tab-btn ${mode === 'upload' ? 'active' : ''}`}
            onClick={() => { setMode('upload'); setValidationError(null); }}
          >
            <i className="fa-solid fa-cloud-arrow-up" /> Subir archivo
          </button>
          <button
            type="button"
            className={`tab-btn ${mode === 'library' ? 'active' : ''}`}
            onClick={() => { setMode('library'); setValidationError(null); }}
          >
            <i className="fa-solid fa-images" /> Galería ({mediaAssets.length})
          </button>
        </div>
      </div>

      {validationError && (
        <div className="dropzone-alert-error">
          <i className="fa-solid fa-circle-exclamation" />
          <span>{validationError}</span>
          <button type="button" onClick={() => setValidationError(null)} aria-label="Cerrar alerta">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {mode === 'upload' ? (
        <div className="dropzone-wrapper">
          <div
            className={`styled-dropzone ${isDragging ? 'dragover' : ''} ${
              previewUrl ? 'has-preview' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              style={{ display: 'none' }}
              onChange={(e) => validateAndProcessFile(e.target.files?.[0] ?? null)}
            />

            {previewUrl ? (
              <div className="dropzone-live-preview">
                <img src={previewUrl} alt="Vista previa" />
                <div className="preview-overlay-info">
                  <div className="preview-meta-row">
                    <span className="file-name-pill" title={selectedFile ? selectedFile.name : selectedAsset?.alt || 'Imagen actual'}>
                      {selectedFile ? selectedFile.name : selectedAsset?.alt || 'Imagen seleccionada'}
                    </span>
                    {selectedFile && (
                      <span className="file-size-pill">
                        {formatBytes(selectedFile.size)}
                        {compressionStats && (
                          <span
                            style={{
                              marginLeft: '0.4rem',
                              color: '#10B981',
                              fontWeight: 600,
                              background: 'rgba(16, 185, 129, 0.15)',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '3px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                            title="Comprimido en cliente para resistir en Vercel"
                          >
                            <i className="fa-solid fa-bolt" /> -{compressionStats.savedPercentage}% WebP ({formatBytes(compressionStats.originalSize)} → {formatBytes(compressionStats.compressedSize)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="preview-actions-row">
                    <button
                      type="button"
                      className="btn-change-photo"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <i className="fa-solid fa-camera" /> Cambiar foto
                    </button>
                    <button
                      type="button"
                      className="btn-remove-photo"
                      onClick={handleRemove}
                      title="Quitar foto"
                    >
                      <i className="fa-solid fa-trash-can" /> Quitar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="dropzone-empty-content">
                <div className="dropzone-icon-circle">
                  {isCompressing ? (
                    <i className="fa-solid fa-spinner fa-spin" style={{ color: '#D91E18' }} />
                  ) : (
                    <i className="fa-solid fa-cloud-arrow-up" />
                  )}
                </div>
                <h4>{isCompressing ? 'Optimizando imagen en navegador…' : 'Arrastra tu imagen aquí'}</h4>
                <p>{isCompressing ? 'Redimensionando y convirtiendo a WebP ultraligero' : 'o haz clic para explorar tus archivos'}</p>
                <span className="dropzone-badge">
                  {isCompressing ? 'Procesando compresión…' : hint}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="library-picker-section">
          {selectedAsset && (
            <div className="library-active-selection-banner">
              <div className="banner-thumb">
                <img src={selectedAsset.url} alt={selectedAsset.alt} />
              </div>
              <div className="banner-meta">
                <span className="banner-title">{selectedAsset.alt || selectedAsset.title || 'Foto de biblioteca'}</span>
                <span className="banner-subtitle">Seleccionada actualmente</span>
              </div>
              <button
                type="button"
                className="banner-remove-btn"
                onClick={handleRemove}
                title="Deseleccionar imagen"
              >
                <i className="fa-solid fa-xmark" /> Quitar
              </button>
            </div>
          )}

          <div className="library-search-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={libraryFilter}
              onChange={(e) => setLibraryFilter(e.target.value)}
            />
            {libraryFilter && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setLibraryFilter('')}
                aria-label="Limpiar búsqueda"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          <div className="library-picker-grid">
            {filteredAssets.length === 0 ? (
              <div className="library-picker-empty">
                {libraryFilter ? (
                  <>
                    <i className="fa-solid fa-ban" />
                    <p>No hay imágenes que coincidan con &ldquo;{libraryFilter}&rdquo;</p>
                    <button type="button" className="btn-reset-filter" onClick={() => setLibraryFilter('')}>
                      Ver todas las imágenes
                    </button>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-photo-film" />
                    <p>No hay imágenes disponibles en la biblioteca.</p>
                    <button type="button" className="btn-reset-filter" onClick={() => setMode('upload')}>
                      Subir la primera imagen
                    </button>
                  </>
                )}
              </div>
            ) : (
              filteredAssets.map((asset) => {
                const isSelected = selectedMediaId === asset.id;
                return (
                  <div
                    key={asset.id}
                    className={`library-thumb-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => onMediaSelected(asset.id, asset.url, asset.alt || asset.title || '')}
                    title={asset.alt || asset.title || 'Foto'}
                  >
                    <img src={asset.url} alt={asset.alt} loading="lazy" />
                    {isSelected && (
                      <div className="selected-check">
                        <i className="fa-solid fa-check" />
                      </div>
                    )}
                    <span className="library-thumb-tooltip">{asset.alt || 'Sin título'}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   SITE IMAGE PICKER (Hero Background, Philosophy Image, etc.)
   ========================================================================== */
export interface SiteImagePreset {
  label: string;
  url: string;
}

export interface SiteImagePickerProps {
  label: string;
  helper?: string;
  value: string;
  onChange: (url: string) => void;
  mediaAssets: MediaLibraryItem[];
  apiOrigin: string;
  token: string;
  presets?: SiteImagePreset[];
  hint?: string;
}

export function SiteImagePicker({
  label,
  helper,
  value,
  onChange,
  mediaAssets = [],
  apiOrigin,
  token,
  presets = [],
  hint = 'Optimización automática WebP · JPG, PNG, WEBP, AVIF',
}: SiteImagePickerProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'presets' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return mediaAssets;
    const q = searchQuery.toLowerCase();
    return mediaAssets.filter(
      (m) =>
        m.alt?.toLowerCase().includes(q) ||
        m.title?.toLowerCase().includes(q) ||
        m.url?.toLowerCase().includes(q)
    );
  }, [mediaAssets, searchQuery]);

  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage('Formato no soportado. Usa JPG, PNG, WEBP, AVIF o GIF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`El archivo pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB (máximo 50 MB).`);
      return;
    }

    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      const result = await uploadMediaAssetWithDetails(
        apiOrigin,
        token,
        compressed.file,
        compressed.file.name.replace(/\.[^/.]+$/, '')
      );
      onChange(result.url);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al subir la imagen al servidor');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="site-image-picker-component">
      <div className="picker-header-row">
        <div>
          <label className="picker-main-label">{label}</label>
          {helper && <span className="picker-helper-text">{helper}</span>}
        </div>
        {value && (
          <button
            type="button"
            className="picker-btn-clear"
            onClick={() => onChange('')}
            title="Quitar imagen actual"
          >
            <i className="fa-solid fa-trash-can" /> Quitar imagen
          </button>
        )}
      </div>

      {/* Vista previa compacta activa */}
      <div className="picker-preview-strip">
        <div className="preview-strip-thumb">
          {value ? (
            <img src={value} alt={label} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
          ) : (
            <div className="preview-empty-icon">
              <i className="fa-solid fa-image" />
            </div>
          )}
        </div>
        <div className="preview-strip-details">
          <span className="strip-status-tag">
            {value ? 'Imagen Activa' : 'Sin Imagen Seleccionada'}
          </span>
          <span className="strip-url-text" title={value || 'Ninguna'}>
            {value || 'Selecciona o sube una imagen'}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="dropzone-alert-error" style={{ margin: '0.6rem 0' }}>
          <i className="fa-solid fa-circle-exclamation" />
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* Tabs selectoras */}
      <div className="site-picker-tabs">
        <button
          type="button"
          className={`site-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <i className="fa-solid fa-cloud-arrow-up" /> Subir archivo
        </button>
        <button
          type="button"
          className={`site-tab-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <i className="fa-solid fa-images" /> Galería ({mediaAssets.length})
        </button>
        {presets.length > 0 && (
          <button
            type="button"
            className={`site-tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            <i className="fa-solid fa-wand-magic-sparkles" /> Presets ({presets.length})
          </button>
        )}
        <button
          type="button"
          className={`site-tab-btn ${activeTab === 'url' ? 'active' : ''}`}
          onClick={() => setActiveTab('url')}
        >
          <i className="fa-solid fa-link" /> URL directa
        </button>
      </div>

      {/* Tab 1: Upload */}
      {activeTab === 'upload' && (
        <div
          className={`styled-dropzone compact-site-dropzone ${isDragging ? 'dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <div className="dropzone-empty-content">
            <div className="dropzone-icon-circle">
              {isUploading ? (
                <i className="fa-solid fa-spinner fa-spin" />
              ) : (
                <i className="fa-solid fa-cloud-arrow-up" />
              )}
            </div>
            <h4>{isUploading ? 'Subiendo imagen a la nube…' : 'Arrastra tu archivo aquí'}</h4>
            <p>{isUploading ? 'Procesando y optimizando asset' : 'o haz clic para explorar tus fotos'}</p>
            <span className="dropzone-badge">{hint}</span>
          </div>
        </div>
      )}

      {/* Tab 2: Galería */}
      {activeTab === 'library' && (
        <div className="library-picker-section" style={{ marginTop: '0.5rem' }}>
          <div className="library-search-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              placeholder="Buscar por descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
          <div className="library-picker-grid" style={{ maxHeight: '200px' }}>
            {filteredAssets.length === 0 ? (
              <div className="library-picker-empty">
                No hay imágenes disponibles
              </div>
            ) : (
              filteredAssets.map((asset) => {
                const isSelected = value === asset.url;
                return (
                  <div
                    key={asset.id}
                    className={`library-thumb-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => onChange(asset.url)}
                    title={asset.alt || 'Foto'}
                  >
                    <img src={asset.url} alt={asset.alt} loading="lazy" />
                    {isSelected && (
                      <div className="selected-check">
                        <i className="fa-solid fa-check" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Presets */}
      {activeTab === 'presets' && presets.length > 0 && (
        <div className="site-picker-presets-grid">
          {presets.map((preset) => {
            const isSelected = value === preset.url;
            return (
              <button
                key={preset.url}
                type="button"
                className={`site-preset-card ${isSelected ? 'active' : ''}`}
                onClick={() => onChange(preset.url)}
              >
                <div className="preset-card-thumb">
                  <img src={preset.url} alt={preset.label} />
                  {isSelected && (
                    <span className="preset-check-icon">
                      <i className="fa-solid fa-check" />
                    </span>
                  )}
                </div>
                <span className="preset-card-name">{preset.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab 4: URL directa */}
      {activeTab === 'url' && (
        <div className="site-picker-url-box">
          <input
            type="text"
            value={value}
            placeholder="/images/hero.jpg o https://..."
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
