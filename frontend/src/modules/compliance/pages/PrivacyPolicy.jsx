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
                2. Datos Tratados en el Canal WhatsApp y Consentimiento Previo
              </h2>
              <p>
                Al comunicarse con nuestro asistente empresarial por WhatsApp, el sistema utiliza el
                número telefónico remitente y el texto de la consulta exclusivamente para verificar
                su identidad como colaborador activo en su empresa empleadora, consultar su estado
                de asistencias o vacaciones y generar respuestas normativas oficiales.
              </p>
              <p className="mt-2 text-xs text-[#4b5563]">
                Conforme a los Arts. 8 y 12 de la LOPDP, el uso del canal WhatsApp requiere el
                consentimiento previo, libre, específico e informado del titular mediante la
                instrucción <strong className="font-mono text-[#111827]">ACEPTO</strong>.
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
                4. Derechos LOPDP: Revocatoria, Rectificación y Eliminación
              </h2>
              <p>
                En estricto cumplimiento del Art. 15 de la LOPDP, el colaborador puede{' '}
                <strong className="font-semibold text-[#111827]">
                  revocar su consentimiento en cualquier momento
                </strong>{' '}
                respondiendo con la palabra{' '}
                <strong className="font-mono text-[#111827]">REVOCAR</strong> en el chat de
                WhatsApp. Al revocar, cesará de inmediato el procesamiento de sus datos por dicho
                canal.
              </p>
              <p className="mt-2 text-xs text-[#4b5563]">
                Asimismo, el titular puede solicitar la actualización o desvinculación definitiva a
                través del departamento de Talento Humano de su empresa o escribiendo a{' '}
                <span className="font-mono text-[#111827]">jorge.doicela.m@gmail.com</span>.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
