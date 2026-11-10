/**
 * @file AssetActaModal.jsx
 * @description Modal oficial de impresión del Acta de Entrega - Recepción de Activos y Responsabilidad.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiPrinter } from 'react-icons/fi';
import Modal from '../../../../components/common/Modal';

const CATEGORY_MAP = {
  EQUIPMENT: 'Cómputo y Tecnología',
  UNIFORM_PPE: 'EPP e Indumentaria',
  TOOL: 'Herramienta de Trabajo',
  ACCESS_CARD: 'Tarjeta de Acceso',
};

const CONDITION_MAP = {
  NEW: 'Nuevo / Sin Uso',
  GOOD: 'Buen Estado / Operativo',
  FAIR: 'Regular con Desgaste',
  DAMAGED: 'Dañado / Requiere Reparación',
};

export const AssetActaModal = ({ isOpen, onClose, selectedAsset }) => {
  return (
    <Modal
      isOpen={isOpen && !!selectedAsset}
      onClose={onClose}
      title="Acta de Entrega - Recepción de Activos"
      subtitle="Documento Oficial de Custodia y Responsabilidad Laboral"
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-gray-900 hover:bg-black text-white text-xs px-3.5 py-1.5 rounded-[4px] flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <FiPrinter className="w-3.5 h-3.5" />
            <span>Imprimir Acta</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-4 py-1.5 rounded-[4px] cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      }
    >
      {selectedAsset && (
        <div className="space-y-4 text-xs">
          {/* Membrete del Acta */}
          <div className="border-b border-gray-200 pb-3 text-center">
            <h2 className="text-sm font-bold text-gray-900 uppercase">
              Acta de Asignación y Responsabilidad de Bienes
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5 font-mono">
              Código Único de Registro: AST-{selectedAsset.id.slice(-6).toUpperCase()}
            </p>
          </div>

          {/* Datos de las Partes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-[4px] space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">
                Empresa / Empleador
              </span>
              <p className="font-semibold text-gray-900">NORMA ERP S.A.</p>
              <p className="text-gray-500 text-[11px] font-mono tabular-nums">
                RUC: 1792345678001
              </p>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-[4px] space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">
                Custodio / Colaborador
              </span>
              <p className="font-semibold text-gray-900">
                {selectedAsset.employee?.firstName} {selectedAsset.employee?.lastName}
              </p>
              <p className="text-gray-500 text-[11px]">
                C.I.: {selectedAsset.employee?.identityCard || 'S/N'} ·{' '}
                {selectedAsset.employee?.department || 'General'}
              </p>
            </div>
          </div>

          {/* Detalle del Activo */}
          <div className="border border-gray-200 rounded-[4px] p-4 space-y-2">
            <h4 className="font-semibold text-gray-900 border-b border-gray-100 pb-1.5">
              Descripción Detallada del Bien
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-gray-500">Bien / Dotación:</span>{' '}
                <strong className="text-gray-800">{selectedAsset.name}</strong>
              </div>
              <div>
                <span className="text-gray-500">Categoría:</span>{' '}
                <strong className="text-gray-800">
                  {CATEGORY_MAP[selectedAsset.category] || selectedAsset.category}
                </strong>
              </div>
              <div>
                <span className="text-gray-500">Nº Serie / Placa:</span>{' '}
                <strong className="font-mono text-gray-800">
                  {selectedAsset.serialNumber || 'No especificado'}
                </strong>
              </div>
              <div>
                <span className="text-gray-500">Estado de Entrega:</span>{' '}
                <strong className="text-gray-800">
                  {CONDITION_MAP[selectedAsset.condition] || selectedAsset.condition}
                </strong>
              </div>
              <div>
                <span className="text-gray-500">Fecha de Entrega:</span>{' '}
                <strong className="font-mono text-gray-800 tabular-nums">
                  {new Date(selectedAsset.deliveryDate).toLocaleDateString('es-EC')}
                </strong>
              </div>
            </div>
            {selectedAsset.notes && (
              <div className="pt-2 border-t border-gray-100 text-[11px]">
                <span className="text-gray-500 block">Accesorios / Observaciones:</span>
                <p className="text-gray-700 italic mt-0.5">{selectedAsset.notes}</p>
              </div>
            )}
          </div>

          {/* Cláusula Legal */}
          <div className="p-3 bg-gray-50/70 border border-gray-200 rounded-[4px] text-[11px] text-gray-600 space-y-1.5 leading-relaxed text-justify">
            <p className="font-semibold text-gray-900">TÉRMINOS Y CONDICIONES DE CUSTODIA:</p>
            <p>
              El colaborador declara recibir en perfecto estado de funcionamiento el bien
              descrito, comprometiéndose a utilizarlo exclusivamente para fines laborales y a velar
              por su adecuado cuidado y custodia. En caso de desvinculación laboral, el bien deberá
              ser devuelto a la empresa de forma obligatoria e inmediata.
            </p>
          </div>

          {/* Firmas */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
            <div>
              <div className="border-t border-gray-400 pt-2 w-48 mx-auto font-semibold text-gray-900">
                Entregado por (RRHH)
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">Administración de Talento</p>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-2 w-48 mx-auto font-semibold text-gray-900">
                Recibido Conforme (Custodio)
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {selectedAsset.employee?.firstName} {selectedAsset.employee?.lastName}
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AssetActaModal;
