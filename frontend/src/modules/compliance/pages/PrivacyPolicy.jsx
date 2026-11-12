import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy({ mode = 'privacy' }) {
  const isTerms = mode === 'terms';

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white border border-[#e5e7eb] rounded-[4px] p-8 sm:p-10">
        <div className="border-b border-[#e5e7eb] pb-5 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#6b7280] font-mono">
              NORMA ERP · MARCO LOPDP ECUADOR
            </p>
            <h1 className="text-xl font-semibold text-[#111827] mt-1">
              {isTerms
                ? 'Condiciones del Servicio'
                : 'Política de Privacidad y Protección de Datos Personales'}
            </h1>
          </div>
          <Link
            to="/"
            className="text-xs font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
          >
            Volver al inicio
          </Link>
        </div>

        {isTerms ? (
          <div className="space-y-5 text-[14px] text-[#374151] leading-relaxed">
            <section>
              <h2 className="text-sm font-semibold text-[#111827] mb-1">1. Alcance del Servicio</h2>
              <p>
                Norma ERP proporciona herramientas de gestión empresarial, talento humano,
                contabilidad y un asistente conversacional integrado vía WhatsApp Cloud API para
                organizaciones autorizadas y sus colaboradores activos.
              </p>
            </section>
            <section>
              <h2 className="text-sm font-semibold text-[#111827] mb-1">
                2. Uso de Información Normativa
              </h2>
              <p>
                Las respuestas jurídicas emitidas por el asistente corporativo se basan en los
                cuerpos normativos oficiales vigentes de la República del Ecuador y tienen carácter
                estrictamente informativo y orientativo.
              </p>
            </section>
          </div>
        ) : (
          <div className="space-y-5 text-[14px] text-[#374151] leading-relaxed">
            <p className="text-xs text-[#6b7280] font-mono">
              Vigencia: Noviembre 2026 · Cumplimiento de la Ley Orgánica de Protección de Datos
              Personales (LOPDP)
            </p>
            <section>
              <h2 className="text-sm font-semibold text-[#111827] mb-1">
                1. Responsable del Tratamiento
              </h2>
              <p>
                Norma ERP (norma.doicela.dev) trata datos empresariales y laborales en estricto
                cumplimiento de la LOPDP y bajo el principio de aislamiento estricto multi-empresa.
              </p>
            </section>
            <section>
              <h2 className="text-sm font-semibold text-[#111827] mb-1">
                2. Datos Tratados en el Canal WhatsApp
              </h2>
              <p>
                Al comunicarse con nuestro asistente empresarial por WhatsApp, el sistema utiliza el
                número telefónico remitente y el texto de la consulta exclusivamente para verificar
                su identidad como colaborador activo, consultar su estado de asistencias o
                vacaciones y generar respuestas normativas.
              </p>
            </section>
            <section>
              <h2 className="text-sm font-semibold text-[#111827] mb-1">
                3. Cifrado y Confidencialidad
              </h2>
              <p>
                La información salarial y financiera se resguarda mediante cifrado AES-256-GCM en
                base de datos. Ninguna conversación ni dato corporativo se utiliza para entrenar
                modelos públicos ni se comercializa con terceros.
              </p>
            </section>
            <section>
              <h2 className="text-sm font-semibold text-[#111827] mb-1">
                4. Derechos de Eliminación y Rectificación
              </h2>
              <p>
                El titular de los datos puede solicitar la actualización o desvinculación de su
                número telefónico en cualquier momento a través del departamento de Talento Humano
                de su empresa o mediante solicitud directa al correo{' '}
                <span className="font-mono text-[#111827]">jorge.doicela.m@gmail.com</span>.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
