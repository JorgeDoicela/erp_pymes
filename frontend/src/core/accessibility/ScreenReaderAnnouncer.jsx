/**
 * @file ScreenReaderAnnouncer.jsx
 * @description Región ARIA Live global e invisible para lectores de pantalla nativos (TalkBack/VoiceOver/NVDA).
 * Escucha cambios de ruta, notificaciones del sistema (toasts) y mensajes personalizados sin alterar la UI.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useToasterStore } from 'react-hot-toast';

const ROUTE_LABELS = {
  '/': 'Inicio institucional',
  '/login': 'Iniciar Sesión',
  '/register-company': 'Registro de Empresa',
  '/careers': 'Bolsa de Empleo',
  '/terms': 'Términos de Servicio',
  '/privacy': 'Política de Privacidad',
  '/admin': 'Panel de Control Administrativo',
  '/empleado': 'Portal del Empleado',
  '/empleado/portal': 'Portal Móvil del Empleado',
  '/empleado/asistencia': 'Marcación de Asistencia',
  '/empleado/ausencias': 'Mis Solicitudes de Ausencia',
  '/my-payments': 'Mis Roles de Pago',
  '/my-advances': 'Mis Anticipos de Sueldo',
  '/my-assets': 'Mis Bienes y Custodia',
  '/my-expedient': 'Mi Expediente Laboral',
  '/profile': 'Mi Perfil y Preferencias',
  '/notifications': 'Centro de Notificaciones',
  '/help': 'Centro de Ayuda',
  '/signatures': 'Centro de Firma Electrónica',
  '/admin/accounting': 'Contabilidad General',
  '/admin/accounting/journal': 'Libro Diario',
  '/admin/accounting/chart': 'Plan de Cuentas',
  '/admin/accounting/balance': 'Balance de Comprobación',
  '/admin/sustainability': 'Asistente Legal y Sostenibilidad',
  '/admin/entrepreneurship': 'Incubadora de Emprendimiento',
};

const resolveRouteTitle = (path) => {
  if (ROUTE_LABELS[path]) return ROUTE_LABELS[path];
  if (path.startsWith('/admin/employees') || path.startsWith('/employees'))
    return 'Gestión de Empleados';
  if (path.startsWith('/admin/attendance') || path.startsWith('/attendance'))
    return 'Gestión de Asistencia';
  if (path.startsWith('/admin/payroll') || path.startsWith('/payroll'))
    return 'Nómina y Liquidaciones';
  if (path.startsWith('/admin/performance') || path.startsWith('/performance'))
    return 'Evaluaciones y Desempeño';
  if (path.startsWith('/admin/recruitment') || path.startsWith('/recruitment'))
    return 'Reclutamiento y Selección';
  if (path.startsWith('/admin/analytics') || path.startsWith('/analytics'))
    return 'Analíticas Predictivas';
  if (path.startsWith('/admin/contracts') || path.startsWith('/contracts'))
    return 'Gestión de Contratos';
  if (path.startsWith('/admin/audit') || path.startsWith('/audit')) return 'Auditoría del Sistema';
  return 'Pantalla del sistema';
};

export default function ScreenReaderAnnouncer() {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const location = useLocation();
  const { toasts } = useToasterStore();

  const lastPathRef = useRef('');
  const announcedToastIdsRef = useRef(new Set());
  const timerRef = useRef(null);

  // 1. Anunciar cambio de rutas automáticamente a TalkBack
  useEffect(() => {
    if (lastPathRef.current === location.pathname) return;
    lastPathRef.current = location.pathname;

    const screenTitle = resolveRouteTitle(location.pathname);
    setPoliteMessage(`Pantalla ${screenTitle} cargada.`);
  }, [location.pathname]);

  // 2. Interceptar notificaciones toast del sistema para que TalkBack las verbalice
  useEffect(() => {
    if (!toasts || !toasts.length) return;

    toasts.forEach((t) => {
      if (t.visible && !announcedToastIdsRef.current.has(t.id)) {
        announcedToastIdsRef.current.add(t.id);

        let text = '';
        if (typeof t.message === 'string') {
          text = t.message;
        } else if (typeof t.message === 'function') {
          try {
            text = String(t.message(t));
          } catch {
            text = '';
          }
        }

        if (text && typeof text === 'string' && text.trim()) {
          const isError = t.type === 'error';
          const prefix = isError ? 'Alerta de error: ' : 'Aviso: ';
          const fullAnnouncement = `${prefix}${text.trim()}`;

          if (isError) {
            setAssertiveMessage(fullAnnouncement);
          } else {
            setPoliteMessage(fullAnnouncement);
          }
        }
      }
    });

    // Limpiar IDs antiguos si el set crece
    if (announcedToastIdsRef.current.size > 50) {
      announcedToastIdsRef.current.clear();
    }
  }, [toasts]);

  // 3. Escuchar anuncios manuales o directos mediante evento norma:announce
  useEffect(() => {
    const handleCustomAnnounce = (e) => {
      const { message, priority } = e.detail || {};
      if (!message) return;

      if (priority === 'assertive') {
        setAssertiveMessage(message);
      } else {
        setPoliteMessage(message);
      }
    };

    window.addEventListener('norma:announce', handleCustomAnnounce);
    return () => {
      window.removeEventListener('norma:announce', handleCustomAnnounce);
    };
  }, []);

  // Limpiar mensajes tras 6 segundos para no dejar texto residual
  useEffect(() => {
    if (!politeMessage && !assertiveMessage) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPoliteMessage('');
      setAssertiveMessage('');
    }, 6000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [politeMessage, assertiveMessage]);

  return (
    <div className="sr-only" aria-hidden="false">
      {/* Región cortés para avisos informativos y navegación */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {politeMessage}
      </div>

      {/* Región urgente para errores y validaciones críticas */}
      <div role="alert" aria-live="assertive" aria-atomic="true">
        {assertiveMessage}
      </div>
    </div>
  );
}
