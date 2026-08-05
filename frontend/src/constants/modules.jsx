import {
    FiUsers, FiClock, FiCalendar, FiUserX, FiDollarSign, FiGift,
    FiClipboard, FiBriefcase, FiFileText, FiBarChart2, FiHelpCircle,
    FiTrendingUp, FiShield, FiSettings, FiTarget, FiActivity, FiCompass,
    FiBookOpen, FiList, FiPlus, FiCreditCard, FiFolder, FiPackage, FiUserMinus
} from 'react-icons/fi';

export const adminModules = [
    { title: 'Empleados', icon: <FiUsers />, color: 'bg-blue-500', path: '/admin/employees' },
    { title: 'Expedientes Digitales', icon: <FiFolder />, color: 'bg-blue-600', path: '/admin/expedientes' },
    { title: 'Equipos y EPPs', icon: <FiPackage />, color: 'bg-purple-600', path: '/admin/assets' },
    { title: 'Offboarding & Liquidaciones', icon: <FiUserMinus />, color: 'bg-rose-600', path: '/admin/offboarding' },
    { title: 'Análisis Predictivo', icon: <FiActivity />, color: 'bg-indigo-600', path: '/intelligence' },
    { title: 'Asistencia', icon: <FiClock />, color: 'bg-indigo-500', path: '/attendance' },
    { title: 'Turnos', icon: <FiCalendar />, color: 'bg-purple-500', path: '/admin/shifts' },
    { title: 'Ausencias', icon: <FiUserX />, color: 'bg-rose-500', path: '/admin/absences' },
    { title: 'Nómina', icon: <FiDollarSign />, color: 'bg-green-500', path: '/admin/payroll/generator' },
    { title: 'Beneficios', icon: <FiGift />, color: 'bg-yellow-500', path: '/admin/payroll/benefits' },
    { title: 'Anticipos y Préstamos', icon: <FiCreditCard />, color: 'bg-emerald-600', path: '/admin/payroll/advances' },
    { title: 'Evaluaciones', icon: <FiTrendingUp />, color: 'bg-orange-500', path: '/performance' },
    { title: 'Mis Evaluaciones', icon: <FiClipboard />, color: 'bg-orange-500', path: '/performance/my-evaluations' },
    { title: 'Mis Objetivos', icon: <FiTarget />, color: 'bg-cyan-500', path: '/performance/goals' },
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
    { title: 'Mi Expediente Digital', icon: <FiFolder />, color: 'bg-blue-600', path: '/my-expedient' },
    { title: 'Asistencia', icon: <FiClock />, color: 'bg-indigo-500', path: '/empleado/asistencia' },
    { title: 'Permisos', icon: <FiCalendar />, color: 'bg-rose-500', path: '/empleado/ausencias' },
    { title: 'Mis Pagos', icon: <FiDollarSign />, color: 'bg-green-500', path: '/my-payments' },
    { title: 'Mis Anticipos', icon: <FiCreditCard />, color: 'bg-emerald-600', path: '/my-advances' },
    { title: 'Emprendimiento', icon: <FiCompass />, color: 'bg-amber-600', path: '/entrepreneurship' },
    { title: 'Mis Evaluaciones', icon: <FiClipboard />, color: 'bg-orange-500', path: '/performance/my-evaluations' },
    { title: 'Mis Objetivos', icon: <FiTarget />, color: 'bg-cyan-500', path: '/performance/goals' },
    { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
];

export const accountingModules = [
    { title: 'Dashboard', icon: <FiBarChart2 />, color: 'bg-blue-500', path: '/admin' },
    { title: 'Análisis Predictivo', icon: <FiActivity />, color: 'bg-indigo-600', path: '/intelligence' },
    { title: 'Contabilidad', icon: <FiBookOpen />, color: 'bg-blue-800', path: '/admin/accounting' },
    { title: 'Asientos', icon: <FiFileText />, color: 'bg-indigo-500', path: '/admin/accounting/journals' },
    { title: 'Catalogo', icon: <FiList />, color: 'bg-purple-500', path: '/admin/accounting/chart' },
    { title: 'Mi Perfil', icon: <FiUsers />, color: 'bg-blue-500', path: '/profile' },
    { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
];

export const entrepreneurModules = [
    { title: 'Dashboard', icon: <FiBarChart2 />, color: 'bg-blue-500', path: '/admin' },
    { title: 'Análisis Predictivo', icon: <FiActivity />, color: 'bg-indigo-600', path: '/intelligence' },
    { title: 'Emprendimiento', icon: <FiCompass />, color: 'bg-amber-600', path: '/admin/entrepreneurship' },
    { title: 'Nuevo Proyecto', icon: <FiPlus />, color: 'bg-green-500', path: '/admin/entrepreneurship/create' },
    { title: 'Mi Perfil', icon: <FiUsers />, color: 'bg-blue-500', path: '/profile' },
    { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
];
