/**
 * @file TermsConsentModal.jsx
 * @description Modal mandatorio de consentimiento legal (Términos de Servicio y Privacidad LOPDP Ecuador)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiShield, FiFileText, FiLogOut } from 'react-icons/fi';
import { httpClient } from '@core/api/httpClient';
import { Modal } from '@core/ui/Modal';
import { Button } from '@core/ui/Button';

export default function TermsConsentModal({ user, onConsentSuccess, onLogout }) {
  const [activeTab, setActiveTab] = useState('terms');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = acceptTerms && acceptPrivacy && !isSubmitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const response = await httpClient.post('/auth/consent', {
        acceptTerms: true,
        acceptPrivacy: true,
        version: '2026.1',
      });

      if (response.data?.success) {
        toast.success('Consentimiento legal registrado exitosamente.');
        const updatedUser = response.data.data;
        if (onConsentSuccess) {
          onConsentSuccess(updatedUser);
        }
      } else {
        toast.error(response.data?.message || 'Error al registrar consentimiento.');
      }
    } catch (error) {
      console.error('[CONSENT ERROR]', error);
      const msg = error.response?.data?.message || 'No se pudo conectar con el servidor.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      title="Aceptación Obligatoria de Condiciones y Privacidad LOPDP"
      subtitle={`Usuario: ${user?.firstName || ''} ${user?.lastName || ''} (${user?.email || ''})`}
      size="xl"
      closeOnBackdrop={false}
      closeOnEsc={false}
      showCloseButton={false}
      footer={
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onLogout}
            disabled={isSubmitting}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition-colors cursor-pointer py-1.5 px-2"
          >
            <FiLogOut className="w-3.5 h-3.5" />
            <span>Rechazar y Cerrar Sesión</span>
          </button>

          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={isSubmitting}
            className="w-full sm:w-auto"
          >
            Aceptar y Continuar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs sm:text-sm text-gray-700">
        <div className="bg-amber-50 border border-amber-200 rounded-[4px] p-3 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
          <FiShield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block mb-0.5">
              Requerimiento Regulatorio y Contractual
            </strong>
            Para acceder y utilizar la plataforma <strong>Norma ERP</strong>, en concordancia con la
            Ley Orgánica de Protección de Datos Personales (LOPDP) de la República del Ecuador y las
            políticas de gobernanza multi-tenant, es indispensable que revise y acepte expresamente
            las condiciones del servicio y el tratamiento de sus datos laborales.
          </div>
        </div>

        {/* Pestañas de Lectura */}
        <div className="flex border-b border-gray-200 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-2 px-1 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'terms'
                ? 'border-gray-900 text-gray-900 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiFileText className="w-3.5 h-3.5" />
            <span>Condiciones de Servicio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-2 px-1 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-gray-900 text-gray-900 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiShield className="w-3.5 h-3.5" />
            <span>Política de Privacidad (LOPDP Ecuador)</span>
          </button>
        </div>

        {/* Contenedor del documento legal con scroll */}
        <div className="max-h-[38vh] overflow-y-auto border border-gray-200 rounded-[4px] p-4 bg-gray-50/50 space-y-3.5 text-xs text-gray-600 leading-relaxed font-sans">
          {activeTab === 'terms' ? (
            <>
              <div className="border-b border-gray-200 pb-2 mb-2">
                <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider block">
                  NORMA ERP · CONDICIONES DE SERVICIO B2B · VERSIÓN 2026.1
                </span>
                <h4 className="font-semibold text-gray-900 text-sm mt-0.5">
                  Términos y Condiciones de Uso de la Plataforma
                </h4>
              </div>
              <section>
                <h5 className="font-semibold text-gray-800">1. Alcance y Licencia de Uso</h5>
                <p>
                  Norma ERP concede al colaborador una licencia de acceso personal, intransferible y
                  no exclusiva para interactuar con las herramientas de gestión empresarial,
                  registro de asistencia, consulta de roles de pago, gestión de vacaciones y
                  servicios corporativos habilitados por su empleador (Tenant).
                </p>
              </section>
              <section>
                <h5 className="font-semibold text-gray-800">
                  2. Confidencialidad y Propiedad Empresarial
                </h5>
                <p>
                  Toda la información contable, financiera, de nómina, secretos comerciales e
                  información de clientes y empleados alojada en la plataforma es de estricta
                  titularidad de la empresa empleadora. Queda terminantemente prohibida la
                  extracción no autorizada, duplicación o divulgación a terceros.
                </p>
              </section>
              <section>
                <h5 className="font-semibold text-gray-800">3. Seguridad y Credenciales</h5>
                <p>
                  El usuario es responsable de salvaguardar sus credenciales de acceso (correo,
                  contraseña y biometría WebAuthn). Cualquier acción efectuada bajo su sesión se
                  imputará a su identidad y quedará registrada en el sistema de auditoría inmutable
                  de la plataforma.
                </p>
              </section>
              <section>
                <h5 className="font-semibold text-gray-800">4. Asistente Conversacional e IA</h5>
                <p>
                  Las consultas asistidas por inteligencia artificial y el asistente normativo
                  tienen carácter técnico-orientativo basado en el Código del Trabajo y normativas
                  de Ecuador. No sustituyen el asesoramiento jurídico formal.
                </p>
              </section>
            </>
          ) : (
            <>
              <div className="border-b border-gray-200 pb-2 mb-2">
                <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider block">
                  REPÚBLICA DEL ECUADOR · LEY ORGÁNICA DE PROTECCIÓN DE DATOS PERSONALES · VERSIÓN
                  2026.1
                </span>
                <h4 className="font-semibold text-gray-900 text-sm mt-0.5">
                  Política de Tratamiento y Protección de Datos Personales
                </h4>
              </div>
              <section>
                <h5 className="font-semibold text-gray-800">
                  1. Responsable del Tratamiento y Base Jurídica
                </h5>
                <p>
                  El tratamiento de sus datos personales se fundamenta en los artículos 7, 8 y 12 de
                  la LOPDP ecuatoriana, derivado de la relación contractual laboral y el
                  cumplimiento de obligaciones legales ante el Ministerio del Trabajo, el Instituto
                  Ecuatoriano de Seguridad Social (IESS) y el Servicio de Rentas Internas (SRI).
                </p>
              </section>
              <section>
                <h5 className="font-semibold text-gray-800">2. Categorías de Datos Tratados</h5>
                <p>
                  Se tratan datos identificativos (cédula, nombres, dirección), datos de contacto,
                  datos financieros (cuentas bancarias para acreditación de haberes), datos de
                  asistencia (marcaciones horarias, geolocalización de registro en geocerca) y datos
                  de rendimiento laboral. Los salarios se encuentran protegidos mediante cifrado
                  robusto AES-256-GCM.
                </p>
              </section>
              <section>
                <h5 className="font-semibold text-gray-800">
                  3. Aislamiento Multi-Tenant y Seguridad
                </h5>
                <p>
                  Norma ERP opera bajo arquitectura de particionamiento lógico estricto por tenant.
                  Ningún otro cliente o entidad externa tiene visibilidad ni acceso a sus datos
                  personales o corporativos.
                </p>
              </section>
              <section>
                <h5 className="font-semibold text-gray-800">4. Derechos ARCOP del Titular</h5>
                <p>
                  De conformidad con los artículos 13, 14, 15, 16 y 17 de la LOPDP, usted puede
                  ejercer en cualquier momento sus derechos de Acceso, Rectificación, Cancelación,
                  Oposición y Portabilidad canalizándolo a través del departamento de Recursos
                  Humanos de su empresa o dirigiendo su solicitud al Oficial de Privacidad del
                  sistema.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Checkboxes Mandatorios de Consentimiento */}
        <div className="space-y-2.5 pt-1 border-t border-gray-200">
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
            />
            <span className="text-xs text-gray-700 leading-tight select-none group-hover:text-gray-900">
              He leído íntegramente y{' '}
              <strong className="font-semibold">acepto las Condiciones de Servicio</strong> de Norma
              ERP (Versión 2026.1).
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
            />
            <span className="text-xs text-gray-700 leading-tight select-none group-hover:text-gray-900">
              Otorgo mi consentimiento expreso para el tratamiento de mis datos personales según la{' '}
              <strong className="font-semibold">
                Política de Privacidad y la LOPDP de Ecuador
              </strong>
              .
            </span>
          </label>
        </div>
      </div>
    </Modal>
  );
}
