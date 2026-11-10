/**
 * @file ConfirmActionModal.jsx
 * @description Modal de confirmación para acciones críticas (aprobación, pago, eliminación)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { Modal } from '@/core/ui/Modal.jsx';
import { Button } from '@/core/ui/Button.jsx';

export const ConfirmActionModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Acción',
  message = '¿Está seguro de continuar con esta operación?',
  confirmText = 'Confirmar',
  isDestructive = false,
  loading = false,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant={isDestructive ? 'destructive' : 'primary'}
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          {confirmText}
        </Button>
      </>
    }
  >
    <div className="text-xs text-gray-600 leading-relaxed">{message}</div>
  </Modal>
);

export default ConfirmActionModal;
