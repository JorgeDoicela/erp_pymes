/**
 * @file MainLayout.jsx
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Outlet, useLocation } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import GlobalLegalAssistantWidget from '../../modules/sustainability/components/GlobalLegalAssistantWidget.jsx';

const MainLayout = ({ user, onLogout }) => {
  const location = useLocation();
  const path = location.pathname;

  let title = 'Panel de Control';
  if (path === '/empleado') title = 'Portal del Empleado';
  else if (path.includes('/intelligence')) title = 'Agente Inteligente';
  else if (path.includes('/employees') || path === '/admin/register-employee')
    title = 'Gestión de Empleados';
  else if (
    path.includes('/attendance') ||
    path.includes('/shifts') ||
    path.includes('/absences') ||
    path.includes('/asistencia') ||
    path.includes('/ausencias')
  )
    title = 'Gestión de Asistencia';
  else if (path.includes('/payroll') || path.includes('/my-payments')) title = 'Nómina y Pagos';
  else if (path.includes('/performance') || path.includes('/evaluations'))
    title = 'Evaluaciones y Desempeño';
  else if (path.includes('/recruitment') || path.includes('/careers')) title = 'Reclutamiento';
  else if (path.includes('/analytics') || path.includes('/reports'))
    title = 'Analíticas y Reportes';
  else if (path.includes('/contracts')) title = 'Gestión de Contratos';
  else if (path.includes('/notifications')) title = 'Notificaciones';
  else if (path.includes('/audit')) title = 'Auditoría del Sistema';
  else if (path.includes('/accounting')) title = 'Gestión Contable';
  else if (path.includes('/entrepreneurship')) title = 'Incubadora de Negocios';
  else if (path.includes('/help')) title = 'Centro de Ayuda';
  else if (path.includes('/profile')) title = 'Mi Perfil';

  return (
    <DashboardLayout user={user} onLogout={onLogout} title={title}>
      <Outlet />
      <GlobalLegalAssistantWidget />
    </DashboardLayout>
  );
};

export default MainLayout;
