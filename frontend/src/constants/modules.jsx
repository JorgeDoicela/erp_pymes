import {
    FiUsers, FiClock, FiCalendar, FiUserX, FiDollarSign, FiGift,
    FiClipboard, FiBriefcase, FiFileText, FiBarChart2, FiHelpCircle,
    FiTrendingUp, FiShield, FiSettings, FiTarget
} from 'react-icons/fi';

export const adminModules = [
    { title: 'Empleados', icon: <FiUsers />, color: 'bg-blue-500', path: '/admin/employees' },
    { title: 'Asistencia', icon: <FiClock />, color: 'bg-indigo-500', path: '/attendance' },
    { title: 'Turnos', icon: <FiCalendar />, color: 'bg-purple-500', path: '/admin/shifts' },
    { title: 'Ausencias', icon: <FiUserX />, color: 'bg-rose-500', path: '/admin/absences' },
    { title: 'Nómina', icon: <FiDollarSign />, color: 'bg-green-500', path: '/admin/payroll/generator' },
    { title: 'Beneficios', icon: <FiGift />, color: 'bg-yellow-500', path: '/admin/payroll/benefits' },
    { title: 'Evaluaciones', icon: <FiTrendingUp />, color: 'bg-orange-500', path: '/performance' },
    { title: 'Reclutamiento', icon: <FiBriefcase />, color: 'bg-pink-500', path: '/recruitment' },
    { title: 'Reportes', icon: <FiFileText />, color: 'bg-cyan-500', path: '/admin/reports' },
    { title: 'Analíticas', icon: <FiBarChart2 />, color: 'bg-indigo-500', path: '/analytics' },
    { title: 'Auditoría', icon: <FiShield />, color: 'bg-slate-500', path: '/admin/audit' },
    { title: 'Configuración', icon: <FiSettings />, color: 'bg-slate-600', path: '/admin/settings' },
    { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
];

export const employeeModules = [
    { title: 'Dashboard', icon: <FiBarChart2 />, color: 'bg-blue-500', path: '/empleado' },
    { title: 'Mi Perfil', icon: <FiUsers />, color: 'bg-blue-500', path: '/profile' },
    { title: 'Asistencia', icon: <FiClock />, color: 'bg-indigo-500', path: '/empleado/asistencia' },
    { title: 'Permisos', icon: <FiCalendar />, color: 'bg-rose-500', path: '/empleado/ausencias' },
    { title: 'Mis Pagos', icon: <FiDollarSign />, color: 'bg-green-500', path: '/my-payments' },
    { title: 'Mis Evaluaciones', icon: <FiClipboard />, color: 'bg-orange-500', path: '/performance/my-evaluations' },
    { title: 'Mis Objetivos', icon: <FiTarget />, color: 'bg-cyan-500', path: '/performance/goals' },
    { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
];
