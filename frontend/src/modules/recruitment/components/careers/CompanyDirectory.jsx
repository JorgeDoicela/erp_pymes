/**
 * @file CompanyDirectory.jsx
 * @description Norma ERP - Selector intermedio de empresas para la bolsa de empleo pública
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FiArrowRight, FiBriefcase, FiSearch } from 'react-icons/fi';
import { Button, EmptyState, Skeleton } from '@core/ui';
import { ErrorState } from '@core/feedback';

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'EM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatVacancyCount = (count) => {
  if (count === 0) return 'Sin vacantes abiertas';
  if (count === 1) return '1 vacante abierta';
  return `${count} vacantes abiertas`;
};

const CompanyDirectory = ({ companies, status, error, onSelectCompany, onViewAll, onRetry }) => {
  const [search, setSearch] = useState('');

  const filteredCompanies = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter(
      (c) => c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term)
    );
  }, [companies, search]);

  if (status === 'loading') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-md p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-8 w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (companies.length === 0) {
    return (
      <EmptyState
        icon={<FiBriefcase size={24} />}
        title="No hay empresas registradas"
        description="Actualmente no existen organizaciones activas en el portal de empleo."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 rounded-md p-3">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="company-directory-search" className="sr-only">
            Buscar empresa por nombre
          </label>
          <FiSearch
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            id="company-directory-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empresa por nombre..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900"
          />
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-gray-500 font-mono tabular-nums">
            {filteredCompanies.length} {filteredCompanies.length === 1 ? 'empresa' : 'empresas'}
          </span>
          <Button variant="secondary" size="sm" onClick={onViewAll}>
            Ver todas las vacantes
          </Button>
        </div>
      </div>

      {filteredCompanies.length === 0 ? (
        <EmptyState
          icon={<FiSearch size={24} />}
          title="Sin coincidencias"
          description={`No se encontraron empresas que coincidan con "${search}".`}
          actionLabel="Limpiar búsqueda"
          onAction={() => setSearch('')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => {
            const hasOpen = company.openVacanciesCount > 0;
            return (
              <div
                key={company.id}
                className="bg-white border border-gray-200 rounded-md p-4 flex flex-col justify-between gap-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded bg-gray-100 text-gray-700 font-mono font-semibold text-xs flex items-center justify-center shrink-0">
                    {getInitials(company.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-gray-900 truncate">{company.name}</h2>
                    <p className="text-[11px] font-mono text-gray-400 truncate">/{company.slug}</p>
                    <p
                      className={`mt-1.5 text-xs font-mono tabular-nums ${
                        hasOpen ? 'text-gray-700 font-medium' : 'text-gray-400'
                      }`}
                    >
                      {formatVacancyCount(company.openVacanciesCount)}
                    </p>
                  </div>
                </div>

                <Button
                  variant={hasOpen ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => onSelectCompany(company.slug)}
                  className="w-full justify-between"
                >
                  <span>Ver vacantes</span>
                  <FiArrowRight size={13} />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

CompanyDirectory.propTypes = {
  companies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      openVacanciesCount: PropTypes.number.isRequired,
    })
  ).isRequired,
  status: PropTypes.oneOf(['loading', 'error', 'success']).isRequired,
  error: PropTypes.string,
  onSelectCompany: PropTypes.func.isRequired,
  onViewAll: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired,
};

export default CompanyDirectory;
