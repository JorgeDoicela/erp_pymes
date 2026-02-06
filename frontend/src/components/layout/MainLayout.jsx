import { Outlet, useLocation } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';

const MainLayout = ({ user, onLogout }) => {
    const location = useLocation();
    const path = location.pathname;

    let title = "Panel de Control";
    if (path.includes('/intelligence')) title = "Agente Inteligente";
    else if (path.includes('/employees') || path === '/admin/register-employee') title = "Gestión de Empleados";
    else if (path.includes('/attendance') || path.includes('/shifts') || path.includes('/absences')) title = "Gestión de Asistencia";
    else if (path.includes('/payroll') || path.includes('/my-payments')) title = "Nómina y Pagos";
    else if (path.includes('/performance') || path.includes('/evaluations')) title = "Evaluaciones y Desempeño";
    else if (path.includes('/recruitment') || path.includes('/careers')) title = "Reclutamiento";
    else if (path.includes('/analytics') || path.includes('/reports')) title = "Analíticas y Reportes";
    else if (path.includes('/contracts')) title = "Gestión de Contratos";
    else if (path.includes('/notifications')) title = "Notificaciones";
    else if (path.includes('/audit')) title = "Auditoría del Sistema";
    else if (path.includes('/help')) title = "Centro de Ayuda";
    else if (path.includes('/profile')) title = "Mi Perfil";

    return (
        <DashboardLayout user={user} onLogout={onLogout} title={title}>
            <Outlet />
        </DashboardLayout>
    );
};

export default MainLayout;
