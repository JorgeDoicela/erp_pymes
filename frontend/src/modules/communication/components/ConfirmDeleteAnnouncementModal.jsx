/**
 * @file ConfirmDeleteAnnouncementModal.jsx
 * @description Modal de confirmación para eliminar comunicado institucional
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Modal from '../../../components/common/Modal';

export const ConfirmDeleteAnnouncementModal = ({
  announcement,
  isOpen,
  onClose,
  onConfirm,
  actionLoading,
}) => {
  return (
    <Modal
      isOpen={isOpen && !!announcement}
      onClose={onClose}
      title="¿Eliminar comunicado?"
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={actionLoading}
            onClick={onConfirm}
            className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? 'Eliminando...' : 'Sí, Eliminar'}
          </button>
        </>
      }
    >
      {announcement && (
        <p className="text-xs text-gray-500">
          Se retirará del tablón el comunicado "{announcement.title}" junto con todos sus
          registros de acuse de recibo.
        </p>
      )}
    </Modal>
  );
};

export default ConfirmDeleteAnnouncementModal;
