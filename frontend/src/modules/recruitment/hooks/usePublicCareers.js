/**
 * @file usePublicCareers.js
 * @description Norma ERP - Hook para el portal público de empresas y vacantes
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, useEffect, useCallback } from 'react';
import { getPublicCompanies, getPublicVacancies } from '../services/recruitment.service';

export const usePublicCareers = ({ companySlug, tenantId, showAll }) => {
  const isCompanySelectorMode = !companySlug && !tenantId && !showAll;

  const [companies, setCompanies] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [selectedCompanyName, setSelectedCompanyName] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => {
    setReloadTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isActive = true;
    setStatus('loading');
    setError('');

    if (isCompanySelectorMode) {
      getPublicCompanies()
        .then((data) => {
          if (!isActive) return;
          setCompanies(Array.isArray(data) ? data : []);
          setSelectedCompanyName('');
          setStatus('success');
        })
        .catch((err) => {
          if (!isActive) return;
          setError(err.response?.data?.message || 'No se pudo cargar el directorio de empresas.');
          setStatus('error');
        });
    } else {
      const params = {};
      if (companySlug) params.companySlug = companySlug;
      if (tenantId) params.tenantId = tenantId;

      getPublicVacancies(params)
        .then((data) => {
          if (!isActive) return;
          const list = Array.isArray(data) ? data : [];
          setVacancies(list);
          if ((companySlug || tenantId) && list.length > 0 && list[0].tenant?.name) {
            setSelectedCompanyName(list[0].tenant.name);
          } else {
            setSelectedCompanyName('');
          }
          setStatus('success');
        })
        .catch((err) => {
          if (!isActive) return;
          setError(
            err.response?.data?.message || 'No se pudieron cargar las vacantes disponibles.'
          );
          setStatus('error');
        });
    }

    return () => {
      isActive = false;
    };
  }, [isCompanySelectorMode, companySlug, tenantId, reloadTick]);

  return {
    isCompanySelectorMode,
    companies,
    vacancies,
    selectedCompanyName,
    status,
    error,
    reload,
  };
};
