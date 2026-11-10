/**
 * @file TrackingConsentModal.jsx
 * @description Modal de consentimiento legal para geolocalización y biometría conforme a la normativa laboral.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState } from 'react';
import { FiMapPin, FiShield, FiLock, FiCheckCircle } from 'react-icons/fi';
import { MdFingerprint } from 'react-icons/md';
import { updateConsentTracking } from '../../../services/employees/employee.service';
import Modal from '../../../components/common/Modal';

export const TrackingConsentModal = ({
  isOpen,
  onClose,
  consentStatus,
  setConsentStatus,
  onNotification,
}) => {
  const [consenting, setConsenting] = useState(false);

  const handleAccept = async () => {
    setConsenting(true);
    try {
      await updateConsentTracking(true);

      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      savedUser.trackingConsent = true;
      localStorage.setItem('user', JSON.stringify(savedUser));
      setConsentStatus(true);
      onClose();
      window.dispatchEvent(new Event('norma:user-updated'));
      window.dispatchEvent(new Event('emplifi:user-updated'));

      if (onNotification) {
        onNotification({ type: 'success', text: 'Consentimiento registrado correctamente.' });
      }
    } catch (err) {
      if (onNotification) {
        onNotification({
          type: 'error',
          text: err?.message || 'No se pudo registrar el consentimiento.',
        });
      }
    } finally {
      setConsenting(false);
    }
  };

  const handleReject = async () => {
    setConsenting(true);
    try {
      await updateConsentTracking(false);

      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      savedUser.trackingConsent = false;
      localStorage.setItem('user', JSON.stringify(savedUser));
      setConsentStatus(false);
      onClose();
      window.dispatchEvent(new Event('norma:user-updated'));
      window.dispatchEvent(new Event('emplifi:user-updated'));

      if (onNotification) {
        onNotification({
          type: 'info',
          text: 'Consentimiento retirado. No podrá marcar asistencia sin aceptar los términos.',
        });
      }
    } catch (err) {
      if (onNotification) {
        onNotification({
          type: 'error',
          text: err?.message || 'Error al procesar la solicitud.',
        });
      }
    } finally {
      setConsenting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Protección de Datos y Consentimiento"
      subtitle="Tratamiento de información laboral"
      size="md"
    >
      <div className="space-y-4 text-xs">
        <div className="space-y-2.5 text-xs bg-gray-50 p-3.5 rounded-[4px] border border-gray-200">
          <div className="flex items-start gap-2.5">
            <MdFingerprint size={16} className="text-gray-700 shrink-0 mt-0.5" />
            <p className="text-gray-700 leading-snug">
              <strong className="text-gray-900">Biometría local:</strong> Confirmación de
              identidad privada en tu dispositivo sin transmitir plantillas dactilares.
            </p>
          </div>
          <div className="flex items-start gap-2.5 border-t border-gray-200 pt-2.5">
            <FiMapPin size={15} className="text-gray-700 shrink-0 mt-0.5" />
            <p className="text-gray-700 leading-snug">
              <strong className="text-gray-900">Geolocalización:</strong> Captura de coordenadas
              GPS exclusivamente en el instante exacto del registro de jornada.
            </p>
          </div>
          <div className="flex items-start gap-2.5 border-t border-gray-200 pt-2.5">
            <FiLock size={15} className="text-gray-700 shrink-0 mt-0.5" />
            <p className="text-gray-700 leading-snug">
              <strong className="text-gray-900">Confidencialidad:</strong> Uso estrictamente laboral
              y legal conforme al Código del Trabajo ecuatoriano.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={handleAccept}
            disabled={consenting}
            className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-[4px] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {consenting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FiCheckCircle size={15} />
                <span>{consentStatus ? 'Actualizar Consentimiento' : 'Aceptar y Autorizar'}</span>
              </>
            )}
          </button>

          {consentStatus ? (
            <button
              onClick={handleReject}
              disabled={consenting}
              className="w-full py-1.5 text-gray-500 hover:text-red-600 text-xs font-medium text-center transition-colors cursor-pointer"
            >
              Retirar consentimiento
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-1 text-gray-500 hover:text-gray-700 text-xs font-medium text-center transition-colors cursor-pointer"
            >
              Cerrar sin aceptar
            </button>
          )}

          <p className="text-[10px] text-center text-gray-400 pt-0.5 leading-tight">
            Información tratada según la Ley Orgánica de Protección de Datos Personales (LOPDP).
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default TrackingConsentModal;
