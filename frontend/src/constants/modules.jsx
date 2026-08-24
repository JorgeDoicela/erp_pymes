import {
    FiUsers, FiClock, FiCalendar, FiUserX, FiDollarSign, FiGift,
    FiClipboard, FiBriefcase, FiFileText, FiBarChart2,
    FiTrendingUp, FiShield, FiSettings, FiTarget, FiActivity, FiCompass,
    FiBookOpen, FiList, FiPlus, FiCreditCard, FiFolder, FiPackage, FiUserMinus, FiVolume2, FiCpu, FiGitPullRequest, FiShare2, FiDatabase
} from 'react-icons/fi';
import { isSuperAdmin as checkIsSuperAdmin, ROLES } from './roles.js';

// Definición de secciones organizadas por rol sin redundancias ni módulos duplicados

export const superAdminSections = [
    {
        title: 'Administración Global Plataforma',
        modules: [
            { title: 'Panel Principal SuperAdmin', icon: <FiShield />, color: 'bg-rose-600', path: '/superadmin/dashboard' },
            { title: 'Gestión de Empresas Registradas', icon: <FiUsers />, color: 'bg-indigo-600', path: '/superadmin/tenants' },
            { title: 'Métricas de la Plataforma', icon: <FiBarChart2 />, color: 'bg-blue-600', path: '/superadmin/metrics' },
        ]
    },
    {
        title: 'Gobernanza & Seguridad',
        modules: [
            { title: 'Auditoría Global Plataforma', icon: <FiShield />, color: 'bg-slate-500', path: '/superadmin/audit' },
            { title: 'Indicadores Globales (BI)', icon: <FiBarChart2 />, color: 'bg-cyan-600', path: '/analytics' },
        ]
    },
    {
        title: 'Plataforma y Soporte',
        modules: [
            { title: 'Comunicados y Anuncios', icon: <FiVolume2 />, color: 'bg-blue-600', path: '/announcements' },
            { title: 'Mi Perfil SuperAdmin', icon: <FiUsers />, color: 'bg-blue-500', path: '/profile' },
        ]
    }
];

export const adminSections = [
    {
        title: 'Gestión de Capital Humano',
        modules: [
            { title: 'Empleados y Fichas', icon: <FiUsers />, color: 'bg-blue-500', path: '/admin/employees' },
            { title: 'Ficha 360° del Empleado', icon: <FiUsers />, color: 'bg-blue-600', path: '/admin/employees/ficha' },
            { title: 'Expedientes Digitales', icon: <FiFolder />, color: 'bg-blue-600', path: '/admin/expedientes' },
            { title: 'Vencimiento de Contratos', icon: <FiFileText />, color: 'bg-amber-600', path: '/admin/contracts/expiring' },
            { title: 'Equipos y EPPs', icon: <FiPackage />, color: 'bg-purple-600', path: '/admin/assets' },
            { title: 'Salida de Personal y Liquidaciones', icon: <FiUserMinus />, color: 'bg-rose-600', path: '/admin/offboarding' },
            { title: 'Cumplimiento Legal', icon: <FiShield />, color: 'bg-emerald-700', path: '/admin/compliance' },
        ]
    },
    {
        title: 'Tiempo y Asistencia',
        modules: [
            { title: 'Control de Asistencia', icon: <FiClock />, color: 'bg-indigo-500', path: '/attendance' },
            { title: 'Ausencias y Permisos', icon: <FiUserX />, color: 'bg-rose-500', path: '/admin/absences' },
            { title: 'Gestión de Turnos', icon: <FiCalendar />, color: 'bg-purple-500', path: '/admin/shifts' },
            { title: 'Reportes de Asistencia', icon: <FiFileText />, color: 'bg-blue-500', path: '/admin/reports' },
        ]
    },
    {
        title: 'Nómina y Compensaciones',
        modules: [
            { title: 'Gestión de Nómina', icon: <FiDollarSign />, color: 'bg-green-500', path: '/admin/payroll/generator' },
            { title: 'Configuración Nómina', icon: <FiSettings />, color: 'bg-emerald-600', path: '/admin/payroll/config' },
            { title: 'Beneficios Social/IESS', icon: <FiGift />, color: 'bg-yellow-500', path: '/admin/payroll/benefits' },
            { title: 'Anticipos y Préstamos', icon: <FiCreditCard />, color: 'bg-emerald-600', path: '/admin/payroll/advances' },
        ]
    },
    {
        title: 'Gestión del Talento',
        modules: [
            { title: 'Evaluaciones y Objetivos', icon: <FiTrendingUp />, color: 'bg-orange-500', path: '/performance' },
            { title: 'Diseñar Evaluación', icon: <FiPlus />, color: 'bg-orange-600', path: '/performance/create' },
            { title: 'Asignar Evaluaciones', icon: <FiClipboard />, color: 'bg-indigo-600', path: '/performance/assign' },
            { title: 'Reclutamiento y Vacantes', icon: <FiBriefcase />, color: 'bg-pink-500', path: '/recruitment' },
            { title: 'Publicar Vacante', icon: <FiPlus />, color: 'bg-pink-600', path: '/recruitment/create' },
        ]
    },
    {
        title: 'Inteligencia y Analíticas',
        modules: [
            { title: 'Centro de Inteligencia de Negocio', icon: <FiActivity />, color: 'bg-indigo-600', path: '/intelligence' },
            { title: 'Analíticas e Indicadores', icon: <FiBarChart2 />, color: 'bg-blue-600', path: '/analytics' },
            { title: 'Rotación de Personal', icon: <FiUserMinus />, color: 'bg-rose-600', path: '/analytics/turnover' },
            { title: 'Costos Salariales', icon: <FiDollarSign />, color: 'bg-green-600', path: '/analytics/payroll-costs' },
            { title: 'Rendimiento y Desempeño', icon: <FiTrendingUp />, color: 'bg-blue-600', path: '/analytics/performance' },
            { title: 'Satisfacción y Clima', icon: <FiActivity />, color: 'bg-purple-600', path: '/analytics/satisfaction' },
            { title: 'Calibración de Evaluaciones', icon: <FiCpu />, color: 'bg-emerald-600', path: '/analytics/rsi-optimization' },
            { title: 'Impacto de Decisiones y Políticas', icon: <FiGitPullRequest />, color: 'bg-blue-600', path: '/analytics/causal-inference' },
            { title: 'Benchmarking y Tendencias', icon: <FiShare2 />, color: 'bg-emerald-600', path: '/analytics/federated-learning' },
            { title: 'Optimización de Costos y Retención', icon: <FiTarget />, color: 'bg-amber-600', path: '/analytics/morl-pareto' },
            { title: 'Exportación Personalizada', icon: <FiDatabase />, color: 'bg-cyan-600', path: '/analytics/custom' },
        ]
    },
    {
        title: 'Comunicación y Administración',
        modules: [
            { title: 'Comunicados y Anuncios', icon: <FiVolume2 />, color: 'bg-blue-600', path: '/announcements' },
            { title: 'Notificaciones y Alertas', icon: <FiVolume2 />, color: 'bg-blue-600', path: '/admin/notifications' },
            { title: 'Configuración Notificaciones', icon: <FiSettings />, color: 'bg-slate-600', path: '/admin/notifications/settings' },
            { title: 'Auditoría de Sistema', icon: <FiShield />, color: 'bg-slate-500', path: '/admin/audit' },
            { title: 'Configuración de Empresa', icon: <FiSettings />, color: 'bg-slate-600', path: '/admin/settings' },
            { title: 'Mi Perfil', icon: <FiUsers />, color: 'bg-blue-500', path: '/profile' },
        ]
    }
];

export const employeeSections = [
    {
        title: 'Mi Portal',
        modules: [
            { title: 'Portal de Autogestión', icon: <FiBarChart2 />, color: 'bg-blue-500', path: '/empleado' },
            { title: 'Comunicados y Anuncios', icon: <FiVolume2 />, color: 'bg-blue-600', path: '/announcements' },
            { title: 'Notificaciones y Alertas', icon: <FiVolume2 />, color: 'bg-blue-600', path: '/notifications' },
            { title: 'Mi Expediente Digital', icon: <FiFolder />, color: 'bg-blue-600', path: '/my-expedient' },
            { title: 'Mi Perfil', icon: <FiUsers />, color: 'bg-blue-500', path: '/profile' },
        ]
    },
    {
        title: 'Mi Tiempo y Permisos',
        modules: [
            { title: 'Asistencia y Marcaciones', icon: <FiClock />, color: 'bg-indigo-500', path: '/empleado/asistencia' },
            { title: 'Solicitud de Permisos', icon: <FiCalendar />, color: 'bg-rose-500', path: '/empleado/ausencias' },
        ]
    },
    {
        title: 'Mis Pagos y Beneficios',
        modules: [
            { title: 'Mis Recibos de Pago', icon: <FiDollarSign />, color: 'bg-green-500', path: '/my-payments' },
            { title: 'Mis Anticipos', icon: <FiCreditCard />, color: 'bg-emerald-600', path: '/my-advances' },
            { title: 'Mis Equipos y EPPs', icon: <FiPackage />, color: 'bg-purple-600', path: '/my-assets' },
        ]
    },
    {
        title: 'Mi Desempeño',
        modules: [
            { title: 'Mis Evaluaciones', icon: <FiClipboard />, color: 'bg-orange-500', path: '/performance/my-evaluations' },
            { title: 'Mis Objetivos', icon: <FiTarget />, color: 'bg-cyan-500', path: '/performance/goals' },
        ]
    }
];

export const accountingSections = [
    {
        title: 'Gestión Contable',
        modules: [
            { title: 'Dashboard Contable', icon: <FiBarChart2 />, color: 'bg-blue-500', path: '/admin/accounting' },
            { title: 'Asientos Contables', icon: <FiFileText />, color: 'bg-indigo-500', path: '/admin/accounting/journals' },
            { title: 'Catálogo de Cuentas', icon: <FiList />, color: 'bg-purple-500', path: '/admin/accounting/chart' },
        ]
    },
    {
        title: 'Nómina y Finanzas',
        modules: [
            { title: 'Gestión de Nómina', icon: <FiDollarSign />, color: 'bg-green-500', path: '/admin/payroll/generator' },
            { title: 'Beneficios Social/IESS', icon: <FiGift />, color: 'bg-yellow-500', path: '/admin/payroll/benefits' },
            { title: 'Anticipos y Préstamos', icon: <FiCreditCard />, color: 'bg-emerald-600', path: '/admin/payroll/advances' },
        ]
    },
    {
        title: 'Inteligencia y Personal',
        modules: [
            { title: 'BI & Analíticas', icon: <FiActivity />, color: 'bg-indigo-600', path: '/analytics' },
            { title: 'Mi Perfil', icon: <FiUsers />, color: 'bg-blue-500', path: '/profile' },
        ]
    }
];

export const entrepreneurSections = [
    {
        title: 'Proyectos e Innovación',
        modules: [
            { title: 'Proyectos de Innovación', icon: <FiCompass />, color: 'bg-amber-600', path: '/admin/entrepreneurship' },
            { title: 'Nuevo Proyecto', icon: <FiPlus />, color: 'bg-green-500', path: '/admin/entrepreneurship/create' },
            { title: 'Analíticas', icon: <FiActivity />, color: 'bg-indigo-600', path: '/analytics' },
        ]
    },
    {
        title: 'Personal y Soporte',
        modules: [
            { title: 'Mi Perfil', icon: <FiUsers />, color: 'bg-blue-500', path: '/profile' },
        ]
    }
];

// Helper para obtener las secciones agrupadas según el rol del usuario
export const getSectionsByRole = (user) => {
    if (checkIsSuperAdmin(user)) return superAdminSections;
    const role = (user?.role || '').toLowerCase();
    switch (role) {
        case ROLES.ADMIN:
        case ROLES.HR:
            return adminSections;
        case ROLES.ACCOUNTING:
            return accountingSections;
        case 'entrepreneur':
            return entrepreneurSections;
        default:
            return employeeSections;
    }
};

// Helper para obtener la lista plana de módulos manteniendo compatibilidad
export const getModulesByRole = (user) => {
    const sections = getSectionsByRole(user);
    return sections.flatMap(section => section.modules);
};

// Arrays planos exportados por compatibilidad con imports anteriores
export const superAdminModules = superAdminSections.flatMap(s => s.modules);
export const adminModules = adminSections.flatMap(s => s.modules);
export const employeeModules = employeeSections.flatMap(s => s.modules);
export const accountingModules = accountingSections.flatMap(s => s.modules);
export const entrepreneurModules = entrepreneurSections.flatMap(s => s.modules);
