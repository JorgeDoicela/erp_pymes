/**
 * @file CareersPage.jsx
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiClock,
  FiDollarSign,
  FiMapPin,
} from 'react-icons/fi';
import { Button, EmptyState, Skeleton } from '@core/ui';
import { ErrorState } from '@core/feedback';
import { usePublicCareers } from '../hooks/usePublicCareers';
import CompanyDirectory from '../components/careers/CompanyDirectory';

const CareersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companySlug = searchParams.get('company') || searchParams.get('slug');
  const tenantId = searchParams.get('tenantId');
  const showAll = searchParams.get('all') === 'true';

  const {
    isCompanySelectorMode,
    companies,
    vacancies,
    selectedCompanyName,
    status,
    error,
    reload,
  } = usePublicCareers({ companySlug, tenantId, showAll });

  const handleSelectCompany = (slug) => {
    navigate(`/careers?company=${encodeURIComponent(slug)}`);
  };

  const handleViewAll = () => {
    navigate('/careers?all=true');
  };

  const headerTitle = isCompanySelectorMode
    ? 'Selecciona una empresa'
    : selectedCompanyName
      ? `Vacantes en ${selectedCompanyName}`
      : 'Todas las vacantes disponibles';

  const headerSubtitle = isCompanySelectorMode
    ? 'Elige la organización en la que deseas explorar oportunidades laborales y postularte.'
    : 'Revisa las oportunidades activas y envía tu postulación directamente al equipo de talento humano.';

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <header className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft size={13} />
              <span>Volver al inicio</span>
            </Link>

            {!isCompanySelectorMode && (
              <Button variant="secondary" size="sm" onClick={() => navigate('/careers')}>
                <FiArrowLeft size={13} />
                <span>Elegir otra empresa</span>
              </Button>
            )}
          </div>

          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">
              {selectedCompanyName
                ? `Portal de Empleo · ${selectedCompanyName}`
                : 'Bolsa de Empleo'}
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
              {headerTitle}
            </h1>
            <p className="text-sm text-gray-600">{headerSubtitle}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {isCompanySelectorMode ? (
          <CompanyDirectory
            companies={companies}
            status={status}
            error={error}
            onSelectCompany={handleSelectCompany}
            onViewAll={handleViewAll}
            onRetry={reload}
          />
        ) : status === 'loading' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full rounded" />
              </div>
            ))}
          </div>
        ) : status === 'error' ? (
          <ErrorState message={error} onRetry={reload} />
        ) : vacancies.length === 0 ? (
          <EmptyState
            icon={<FiBriefcase size={24} />}
            title="Sin vacantes disponibles"
            description="No existen ofertas de empleo activas para esta selección en este momento."
            actionLabel="Elegir otra empresa"
            onAction={() => navigate('/careers')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vacancies.map((v) => (
              <div
                key={v.id}
                className="bg-white border border-gray-200 rounded-md p-4 flex flex-col justify-between text-xs hover:border-gray-300 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">
                      {v.department}
                    </span>
                    {v.tenant?.name && !selectedCompanyName && (
                      <span className="text-[11px] text-gray-500 font-medium truncate max-w-[140px]">
                        {v.tenant.name}
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900 leading-snug">{v.title}</h2>
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center">
                      <FiMapPin className="mr-1.5 text-gray-400 shrink-0" size={13} />
                      <span>{v.location}</span>
                    </div>
                    <div className="flex items-center">
                      <FiClock className="mr-1.5 text-gray-400 shrink-0" size={13} />
                      <span>{v.employmentType}</span>
                    </div>
                    {v.salaryMin && (
                      <div className="flex items-center font-mono tabular-nums">
                        <FiDollarSign className="mr-1 text-gray-400 shrink-0" size={13} />
                        <span>
                          ${v.salaryMin} - ${v.salaryMax} USD
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/careers/${v.id}`)}
                  className="w-full mt-4 justify-center"
                >
                  <span>Ver Oferta</span>
                  <FiArrowRight size={13} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CareersPage;
