/**
 * @file SuperAdminProfileView.jsx
 * @description Vista especializada del perfil de SuperAdministrador Global de la plataforma.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

export const SuperAdminProfileView = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="bg-white rounded-[4px] p-5 border border-gray-200">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className="w-10 h-10 rounded-[4px] bg-gray-900 text-white flex items-center justify-center font-mono font-semibold text-xs shrink-0">
            SA
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {user?.firstName || 'SuperAdmin'} {user?.lastName || 'SaaS'}
            </h1>
            <p className="text-xs font-mono text-purple-700 mt-0.5">
              SuperAdministrador Global · Dueño de Plataforma
            </p>
            <p className="text-xs text-gray-400 font-mono tabular-nums">
              {user?.email || 'admin@normaerp.com'}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Detalles de la Cuenta de Plataforma
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-gray-50 rounded-[4px] border border-gray-200">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block font-sans">
                Rol en el Sistema
              </span>
              <span className="font-semibold text-gray-900 text-xs mt-0.5 block">
                SuperAdmin (Dueño de Software)
              </span>
            </div>
            <div className="p-3 bg-gray-50 rounded-[4px] border border-gray-200">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block font-sans">
                Alcance de Aislamiento
              </span>
              <span className="font-semibold text-emerald-700 text-xs mt-0.5 block font-mono">
                Multi-Tenant Global
              </span>
            </div>
            <div className="p-3 bg-gray-50 rounded-[4px] border border-gray-200">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block font-sans">
                Permisos Especiales
              </span>
              <span className="font-semibold text-blue-700 text-xs mt-0.5 block">
                Inspección, Gestión SaaS & Auditoría
              </span>
            </div>
            <div className="p-3 bg-gray-50 rounded-[4px] border border-gray-200">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block font-sans">
                Estado de Sesión
              </span>
              <span className="font-semibold text-emerald-700 text-xs mt-0.5 block">
                Autenticación Activa
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/superadmin/dashboard')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-[4px] transition-colors cursor-pointer"
            >
              Ir al Backoffice SuperAdmin
            </button>
            <button
              type="button"
              onClick={() => navigate('/superadmin/audit')}
              className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-[4px] transition-colors cursor-pointer"
            >
              Ver Auditoría Global
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminProfileView;
