/**
 * @file ScreenReaderAnnouncer.jsx
 * @description Región ARIA Live global y puente hacia el sintetizador de voz integrado (TalkBack Web).
 * Escucha cambios de ruta, notificaciones del sistema (toasts) y mensajes personalizados.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useToasterStore } from 'react-hot-toast';
import AccessibilityContext from './AccessibilityContext.jsx';

const ROUTE_LABELS = {
  '/': 'Inicio institucional',
  '/login': 'Iniciar Sesión',
  '/register-company': 'Registro de Empresa',
  '/careers': 'Bolsa de Empleo',
  '/terms': 'Términos de Servicio',
  '/privacy': 'Política de Privacidad',
  '/admin': 'Panel de Control Administrativo',
  '/empleado': 'Portal del Empleado',
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

const ROUTE_PREFIX_LABELS = [
  ['/admin/employees', '/employees', 'Gestión de Empleados'],
  ['/admin/attendance', '/attendance', 'Gestión de Asistencia'],
  ['/admin/payroll', '/payroll', 'Nómina y Liquidaciones'],
  ['/admin/performance', '/performance', 'Evaluaciones y Desempeño'],
  ['/admin/recruitment', '/recruitment', 'Reclutamiento y Selección'],
  ['/admin/analytics', '/analytics', 'Analíticas Predictivas'],
  ['/admin/contracts', '/contracts', 'Gestión de Contratos'],
  ['/admin/audit', '/audit', 'Auditoría del Sistema'],
];

const resolveRouteTitle = (path) => {
  if (ROUTE_LABELS[path]) return ROUTE_LABELS[path];
  for (const [adminPrefix, shortPrefix, label] of ROUTE_PREFIX_LABELS) {
    if (path.startsWith(adminPrefix) || path.startsWith(shortPrefix)) return label;
  }
  return 'Pantalla del sistema';
};

function extractToastText(t) {
  if (typeof t.message === 'string') return t.message.trim();
  if (typeof t.message === 'function') {
    try {
      return String(t.message(t)).trim();
    } catch {
      return '';
    }
  }
  return '';
}

export default function ScreenReaderAnnouncer() {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const location = useLocation();
  const { toasts } = useToasterStore();
  const accessibility = useContext(AccessibilityContext);

  const lastPathRef = useRef('');
  const announcedToastIdsRef = useRef(new Set());
  const timerRef = useRef(null);

  const announce = useCallback(
    (msg, priority = 'polite') => {
      if (!msg) return;
      if (priority === 'assertive') {
        setAssertiveMessage(msg);
      } else {
        setPoliteMessage(msg);
      }
      if (accessibility?.isSpeechEnabled && accessibility?.speak) {
        accessibility.speak(msg);
      }
    },
    [accessibility]
  );

  // 1. Anunciar cambio de rutas automáticamente
  useEffect(() => {
    if (lastPathRef.current === location.pathname) return;
    lastPathRef.current = location.pathname;

    const screenTitle = resolveRouteTitle(location.pathname);
    announce(`Pantalla ${screenTitle} cargada.`, 'polite');
  }, [location.pathname, announce]);

  // 2. Interceptar notificaciones toast del sistema para verbalizarlas
  useEffect(() => {
    if (!toasts || !toasts.length) return;

    toasts.forEach((t) => {
      if (t.visible && !announcedToastIdsRef.current.has(t.id)) {
        announcedToastIdsRef.current.add(t.id);
        const text = extractToastText(t);
        if (text) {
          const isError = t.type === 'error';
          const prefix = isError ? 'Alerta de error: ' : 'Aviso: ';
          announce(`${prefix}${text}`, isError ? 'assertive' : 'polite');
        }
      }
    });

    if (announcedToastIdsRef.current.size > 50) {
      announcedToastIdsRef.current.clear();
    }
  }, [toasts, announce]);

  // 3. Escuchar anuncios manuales o directos mediante evento norma:announce
  useEffect(() => {
    const handleCustomAnnounce = (e) => {
      const { message, priority } = e.detail || {};
      if (message) announce(message, priority || 'polite');
    };

    window.addEventListener('norma:announce', handleCustomAnnounce);
    return () => window.removeEventListener('norma:announce', handleCustomAnnounce);
  }, [announce]);

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
      <div role="status" aria-live="polite" aria-atomic="true">
        {politeMessage}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true">
        {assertiveMessage}
      </div>
    </div>
  );
}
