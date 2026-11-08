'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { ADMIN_CATALOG } from '@/lib/operations';
import { AdminGallery } from '@/components/admin-gallery';
import { AdminServices } from '@/components/admin-services';
import { AdminProducts } from '@/components/admin-products';
import { AdminCourses } from '@/components/admin-courses';
import { AdminMemberships } from '@/components/admin-memberships';
import { AdminBusinessHours } from '@/components/admin-hours';
import { AdminLeads } from '@/components/admin-leads';

type RecordValue = Record<string, any>;

interface SectionTab {
  key: string;
  label: string;
  icon: string;
}

const SECTION_TABS: SectionTab[] = [
  { key: 'services', label: 'Servicios', icon: 'fa-scissors' },
  { key: 'products', label: 'Productos', icon: 'fa-bottle-droplet' },
  { key: 'courses', label: 'Cursos', icon: 'fa-graduation-cap' },
  { key: 'gallery_hub', label: 'Galería de Cortes', icon: 'fa-camera-retro' },
  { key: 'plans', label: 'Membresías VIP', icon: 'fa-crown' },
  { key: 'hours', label: 'Horario de Atención', icon: 'fa-clock' },
  { key: 'leads', label: 'Solicitudes', icon: 'fa-inbox' },
];

function getApiOrigin(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  const gql = process.env.NEXT_PUBLIC_GRAPHQL_URL;
  if (gql) {
    try {
      return new URL(gql).origin;
    } catch {
      // relative or invalid URL
    }
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:4000';
}

const API_ORIGIN = getApiOrigin();

export function AdminContent({ token, onAuthError }: { token: string; onAuthError?: () => void }) {
  const context = { headers: { authorization: `Bearer ${token}` } };
  const { data, loading, error, refetch } = useQuery<{ adminCatalog: RecordValue }>(ADMIN_CATALOG, {
    context,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (error) {
      const isAuth =
        error.message?.toLowerCase().includes('unauthorized') ||
        error.graphQLErrors?.some(
          (e) => e.message?.toLowerCase().includes('unauthorized') || e.extensions?.code === 'UNAUTHENTICATED'
        );
      if (isAuth && onAuthError) {
        onAuthError();
      }
    }
  }, [error, onAuthError]);

  const [section, setSection] = useState('services');
  const snapshot = data?.adminCatalog;

  // New leads count for badge notification in tab
  const newLeadsCount =
    (snapshot?.productLeads?.filter((l: any) => l.status === 'NEW').length || 0) +
    (snapshot?.membershipLeads?.filter((l: any) => l.status === 'NEW').length || 0) +
    (snapshot?.courseLeads?.filter((l: any) => l.status === 'NEW').length || 0);

  return (
    <div className="admin-manager">
      {/* TABS DE SECCIÓN CANÓNICOS (UI-KIT) */}
      <nav aria-label="Secciones de administración" className="admin-tabs">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`admin-catalog-tab-btn ${section === tab.key ? 'active' : ''}`}
            onClick={() => setSection(tab.key)}
          >
            <i className={`fa-solid ${tab.icon}`} />
            <span>{tab.label}</span>
            {tab.key === 'leads' && newLeadsCount > 0 && (
              <span className="tab-pill-badge">{newLeadsCount}</span>
            )}
          </button>
        ))}
      </nav>

      {/* FEEDBACK DE ESTADO */}
      {loading && (
        <div className="p-8 text-center text-[#888] font-oswald uppercase tracking-widest text-xs">
          <i className="fa-solid fa-circle-notch fa-spin text-lg text-[#d91e18] mb-2 block" />
          Cargando catálogo y registros...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-3">
          <i className="fa-solid fa-triangle-exclamation text-base" />
          <span>No se pudieron cargar los datos. Verifica tu sesión y la conexión al servidor.</span>
        </div>
      )}

      {/* SECCIÓN 1: SERVICIOS */}
      {snapshot && section === 'services' && (
        <AdminServices
          token={token}
          services={snapshot.services ?? []}
          onRefetch={refetch}
        />
      )}

      {/* SECCIÓN 2: PRODUCTOS */}
      {snapshot && section === 'products' && (
        <AdminProducts
          token={token}
          apiOrigin={API_ORIGIN}
          products={snapshot.products ?? []}
          mediaAssets={snapshot.media ?? []}
          onRefetch={refetch}
        />
      )}

      {/* SECCIÓN 3: CURSOS */}
      {snapshot && section === 'courses' && (
        <AdminCourses
          token={token}
          apiOrigin={API_ORIGIN}
          courses={snapshot.courses ?? []}
          mediaAssets={snapshot.media ?? []}
          onRefetch={refetch}
        />
      )}

      {/* SECCIÓN 4: GALERÍA DE CORTES */}
      {snapshot && section === 'gallery_hub' && (
        <AdminGallery
          token={token}
          apiOrigin={API_ORIGIN}
          categories={snapshot.categories ?? []}
          galleryItems={snapshot.gallery ?? []}
          mediaAssets={snapshot.media ?? []}
          onRefetch={refetch}
        />
      )}

      {/* SECCIÓN 5: MEMBRESÍAS VIP */}
      {snapshot && section === 'plans' && (
        <AdminMemberships
          token={token}
          plans={snapshot.plans ?? []}
          onRefetch={refetch}
        />
      )}

      {/* SECCIÓN 6: HORARIO DE ATENCIÓN */}
      {snapshot && section === 'hours' && (
        <AdminBusinessHours
          token={token}
          hours={snapshot.hours ?? []}
          onRefetch={refetch}
        />
      )}

      {/* SECCIÓN 7: SOLICITUDES Y LEADS */}
      {snapshot && section === 'leads' && (
        <AdminLeads
          token={token}
          productLeads={snapshot.productLeads ?? []}
          membershipLeads={snapshot.membershipLeads ?? []}
          courseLeads={snapshot.courseLeads ?? []}
          onRefetch={refetch}
        />
      )}
    </div>
  );
}
