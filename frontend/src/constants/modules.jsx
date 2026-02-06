import {
    FiUsers, FiClock, FiCalendar, FiUserX, FiDollarSign, FiGift,
    FiClipboard, FiBriefcase, FiFileText, FiBarChart2, FiHelpCircle,
    FiTrendingUp, FiShield
} from 'react-icons/fi';

export const adminModules = [
    { title: 'Empleados', icon: <FiUsers />, color: 'bg-blue-500', path: '/admin/employees' },
    { title: 'Asistencia', icon: <FiClock />, color: 'bg-indigo-500', path: '/attendance' },
    { title: 'Turnos', icon: <FiCalendar />, color: 'bg-purple-500', path: '/admin/shifts' },
    { title: 'Ausencias', icon: <FiUserX />, color: 'bg-rose-500', path: '/admin/absences' },
    { title: 'Nómina', icon: <FiDollarSign />, color: 'bg-green-500', path: '/admin/payroll/generator' },
    { title: 'Beneficios', icon: <FiGift />, color: 'bg-yellow-500', path: '/admin/payroll/benefits' },
    { title: 'Evaluaciones', icon: <FiTrendingUp />, color: 'bg-orange-500', path: '/performance' },
    { title: 'Mis Evaluaciones', icon: <FiClipboard />, color: 'bg-orange-500', path: '/performance/my-evaluations' },
    { title: 'Reclutamiento', icon: <FiBriefcase />, color: 'bg-pink-500', path: '/recruitment' },
    { title: 'Reportes', icon: <FiFileText />, color: 'bg-cyan-500', path: '/admin/reports' },
    { title: 'Analíticas', icon: <FiBarChart2 />, color: 'bg-indigo-500', path: '/analytics' },
    { title: 'Auditoría', icon: <FiShield />, color: 'bg-slate-500', path: '/admin/audit' },
    { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
];
