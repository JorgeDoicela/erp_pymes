/**
 * @file ConfirmDeactivateModal.jsx
 * @description Modal de confirmación para cancelar/desactivar un beneficio asignado
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { Modal } from '../../../../core/ui/Modal.jsx';
import { Button } from '../../../../core/ui/Button.jsx';

export const ConfirmDeactivateModal = ({
  isOpen,
  onClose,
  benefit,
  onConfirm,
  loading = false,
}) => {
  if (!benefit) return null;

  const employeeName = benefit.employee
    ? `${benefit.employee.firstName || ''} ${benefit.employee.lastName || ''}`.trim()
    : 'el colaborador';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="¿Cancelar este beneficio?"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Mantener
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            Confirmar Cancelación
          </Button>
        </>
      }
    >
      <div className="text-xs text-gray-600 leading-relaxed space-y-2">
        <p>
          Se cancelará el beneficio <strong>"{benefit.name}"</strong> por un monto de{' '}
          <strong className="font-mono">${Number(benefit.amount || 0).toFixed(2)}</strong> asignado a{' '}
          <strong>{employeeName}</strong>.
        </p>
        <p className="text-gray-400">
          Esta bonificación dejará de liquidarse en los próximos roles de pago.
        </p>
      </div>
    </Modal>
  );
};

export default ConfirmDeactivateModal;
