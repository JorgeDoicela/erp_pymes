import {
    FiUsers, FiClock, FiCalendar, FiUserX, FiDollarSign, FiGift,
    FiClipboard, FiBriefcase, FiFileText, FiBarChart2, FiHelpCircle,
    FiTrendingUp, FiShield, FiSettings, FiTarget, FiActivity, FiCompass,
    FiBookOpen, FiList, FiPlus, FiCreditCard, FiFolder, FiPackage, FiUserMinus, FiVolume2, FiLayers
} from 'react-icons/fi';

// Definición de secciones organizadas por rol

export const superAdminSections = [
    {
        title: 'Administración SaaS',
        modules: [
            { title: 'Panel SuperAdmin SaaS', icon: <FiShield />, color: 'bg-rose-600', path: '/superadmin/dashboard' },
            { title: 'Configuración', icon: <FiSettings />, color: 'bg-slate-600', path: '/admin/settings' },
            { title: 'Auditoría', icon: <FiShield />, color: 'bg-slate-500', path: '/admin/audit' },
        ]
    },
    {
        title: 'Gestión de Personal',
        modules: [
            { title: 'Empleados', icon: <FiUsers />, color: 'bg-blue-500', path: '/admin/employees' },
            { title: 'Expedientes Digitales', icon: <FiFolder />, color: 'bg-blue-600', path: '/admin/expedientes' },
            { title: 'Equipos y EPPs', icon: <FiPackage />, color: 'bg-purple-600', path: '/admin/assets' },
            { title: 'Offboarding & Liquidaciones', icon: <FiUserMinus />, color: 'bg-rose-600', path: '/admin/offboarding' },
            { title: 'Cumplimiento y Alertas', icon: <FiShield />, color: 'bg-emerald-700', path: '/admin/compliance' },
        ]
    },
    {
        title: 'Portal y Operativo',
        modules: [
            { title: 'Comunicados y Anuncios', icon: <FiVolume2 />, color: 'bg-blue-600', path: '/announcements' },
            { title: 'Portal Móvil Operativo', icon: <FiCompass />, color: 'bg-indigo-600', path: '/empleado/portal' },
            { title: 'Mi Perfil', icon: <FiUsers />, color: 'bg-blue-500', path: '/profile' },
            { title: 'Mi Expediente Digital', icon: <FiFolder />, color: 'bg-blue-600', path: '/my-expedient' },
        ]
    },
    {
        title: 'Tiempo y Asistencia',
        modules: [
            { title: 'Control de Asistencia', icon: <FiClock />, color: 'bg-indigo-500', path: '/attendance' },
            { title: 'Registrar Asistencia', icon: <FiClock />, color: 'bg-indigo-500', path: '/empleado/asistencia' },
            { title: 'Gestión de Turnos', icon: <FiCalendar />, color: 'bg-purple-500', path: '/admin/shifts' },
            { title: 'Ausencias y Permisos', icon: <FiUserX />, color: 'bg-rose-500', path: '/admin/absences' },
            { title: 'Mis Permisos', icon: <FiCalendar />, color: 'bg-rose-500', path: '/empleado/ausencias' },
        ]
    },
    {
        title: 'Nómina y Compensaciones',
        modules: [
            { title: 'Gestión de Nómina', icon: <FiDollarSign />, color: 'bg-green-500', path: '/admin/payroll/generator' },
            { title: 'Beneficios', icon: <FiGift />, color: 'bg-yellow-500', path: '/admin/payroll/benefits' },
            { title: 'Anticipos y Préstamos', icon: <FiCreditCard />, color: 'bg-emerald-600', path: '/admin/payroll/advances' },
            { title: 'Mis Pagos', icon: <FiDollarSign />, color: 'bg-green-500', path: '/my-payments' },
            { title: 'Mis Anticipos', icon: <FiCreditCard />, color: 'bg-emerald-600', path: '/my-advances' },
        ]
    },
    {
        title: 'Desempeño y Talento',
        modules: [
            { title: 'Evaluaciones', icon: <FiTrendingUp />, color: 'bg-orange-500', path: '/performance' },
            { title: 'Mis Evaluaciones', icon: <FiClipboard />, color: 'bg-orange-500', path: '/performance/my-evaluations' },
            { title: 'Mis Objetivos', icon: <FiTarget />, color: 'bg-cyan-500', path: '/performance/goals' },
            { title: 'Reclutamiento', icon: <FiBriefcase />, color: 'bg-pink-500', path: '/recruitment' },
        ]
    },
    {
        title: 'Contabilidad y Proyectos',
        modules: [
            { title: 'Contabilidad', icon: <FiBookOpen />, color: 'bg-blue-800', path: '/admin/accounting' },
            { title: 'Asientos Contables', icon: <FiFileText />, color: 'bg-indigo-500', path: '/admin/accounting/journals' },
            { title: 'Catálogo de Cuentas', icon: <FiList />, color: 'bg-purple-500', path: '/admin/accounting/chart' },
            { title: 'Gestión Emprendimiento', icon: <FiCompass />, color: 'bg-amber-600', path: '/admin/entrepreneurship' },
            { title: 'Portal Emprendimiento', icon: <FiCompass />, color: 'bg-amber-600', path: '/entrepreneurship' },
            { title: 'Nuevo Proyecto', icon: <FiPlus />, color: 'bg-green-500', path: '/admin/entrepreneurship/create' },
        ]
    },
    {
        title: 'Inteligencia y Reportes',
        modules: [
            { title: 'Análisis Predictivo', icon: <FiActivity />, color: 'bg-indigo-600', path: '/intelligence' },
            { title: 'Reportes', icon: <FiFileText />, color: 'bg-cyan-500', path: '/admin/reports' },
            { title: 'Analíticas', icon: <FiBarChart2 />, color: 'bg-indigo-500', path: '/analytics' },
        ]
    },
    {
        title: 'Soporte',
        modules: [
            { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
        ]
    }
];

export const adminSections = [
    {
        title: 'Gestión de Personal',
        modules: [
            { title: 'Empleados', icon: <FiUsers />, color: 'bg-blue-500', path: '/admin/employees' },
            { title: 'Expedientes Digitales', icon: <FiFolder />, color: 'bg-blue-600', path: '/admin/expedientes' },
            { title: 'Equipos y EPPs', icon: <FiPackage />, color: 'bg-purple-600', path: '/admin/assets' },
            { title: 'Offboarding & Liquidaciones', icon: <FiUserMinus />, color: 'bg-rose-600', path: '/admin/offboarding' },
            { title: 'Cumplimiento y Alertas', icon: <FiShield />, color: 'bg-emerald-700', path: '/admin/compliance' },
        ]
    },
    {
        title: 'Tiempo y Asistencia',
        modules: [
            { title: 'Asistencia', icon: <FiClock />, color: 'bg-indigo-500', path: '/attendance' },
            { title: 'Turnos', icon: <FiCalendar />, color: 'bg-purple-500', path: '/admin/shifts' },
            { title: 'Ausencias', icon: <FiUserX />, color: 'bg-rose-500', path: '/admin/absences' },
        ]
    },
    {
        title: 'Nómina y Compensaciones',
        modules: [
            { title: 'Nómina', icon: <FiDollarSign />, color: 'bg-green-500', path: '/admin/payroll/generator' },
            { title: 'Beneficios', icon: <FiGift />, color: 'bg-yellow-500', path: '/admin/payroll/benefits' },
            { title: 'Anticipos y Préstamos', icon: <FiCreditCard />, color: 'bg-emerald-600', path: '/admin/payroll/advances' },
        ]
    },
    {
        title: 'Desempeño y Talento',
        modules: [
            { title: 'Evaluaciones', icon: <FiTrendingUp />, color: 'bg-orange-500', path: '/performance' },
            { title: 'Mis Evaluaciones', icon: <FiClipboard />, color: 'bg-orange-500', path: '/performance/my-evaluations' },
            { title: 'Mis Objetivos', icon: <FiTarget />, color: 'bg-cyan-500', path: '/performance/goals' },
            { title: 'Reclutamiento', icon: <FiBriefcase />, color: 'bg-pink-500', path: '/recruitment' },
        ]
    },
    {
        title: 'Inteligencia y Reportes',
        modules: [
            { title: 'Análisis Predictivo', icon: <FiActivity />, color: 'bg-indigo-600', path: '/intelligence' },
            { title: 'Reportes', icon: <FiFileText />, color: 'bg-cyan-500', path: '/admin/reports' },
            { title: 'Analíticas', icon: <FiBarChart2 />, color: 'bg-indigo-500', path: '/analytics' },
        ]
    },
    {
        title: 'Comunicación y Sistema',
        modules: [
            { title: 'Comunicados y Anuncios', icon: <FiVolume2 />, color: 'bg-blue-600', path: '/announcements' },
            { title: 'Mi Perfil', icon: <FiUsers />, color: 'bg-blue-500', path: '/profile' },
            { title: 'Auditoría', icon: <FiShield />, color: 'bg-slate-500', path: '/admin/audit' },
            { title: 'Configuración', icon: <FiSettings />, color: 'bg-slate-600', path: '/admin/settings' },
            { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
        ]
    }
];

export const employeeSections = [
    {
        title: 'Mi Portal',
        modules: [
            { title: 'Comunicados y Anuncios', icon: <FiVolume2 />, color: 'bg-blue-600', path: '/announcements' },
            { title: 'Portal Móvil Operativo', icon: <FiCompass />, color: 'bg-indigo-600', path: '/empleado/portal' },
            { title: 'Dashboard', icon: <FiBarChart2 />, color: 'bg-blue-500', path: '/empleado' },
            { title: 'Mi Perfil', icon: <FiUsers />, color: 'bg-blue-500', path: '/profile' },
            { title: 'Mi Expediente Digital', icon: <FiFolder />, color: 'bg-blue-600', path: '/my-expedient' },
        ]
    },
    {
        title: 'Mi Tiempo y Permisos',
        modules: [
            { title: 'Asistencia', icon: <FiClock />, color: 'bg-indigo-500', path: '/empleado/asistencia' },
            { title: 'Permisos', icon: <FiCalendar />, color: 'bg-rose-500', path: '/empleado/ausencias' },
        ]
    },
    {
        title: 'Mis Compensaciones',
        modules: [
            { title: 'Mis Pagos', icon: <FiDollarSign />, color: 'bg-green-500', path: '/my-payments' },
            { title: 'Mis Anticipos', icon: <FiCreditCard />, color: 'bg-emerald-600', path: '/my-advances' },
        ]
    },
    {
        title: 'Desempeño y Emprendimiento',
        modules: [
            { title: 'Mis Evaluaciones', icon: <FiClipboard />, color: 'bg-orange-500', path: '/performance/my-evaluations' },
            { title: 'Mis Objetivos', icon: <FiTarget />, color: 'bg-cyan-500', path: '/performance/goals' },
            { title: 'Emprendimiento', icon: <FiCompass />, color: 'bg-amber-600', path: '/entrepreneurship' },
        ]
    },
    {
        title: 'Soporte',
        modules: [
            { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
        ]
    }
];

export const accountingSections = [
    {
        title: 'Gestión Contable',
        modules: [
            { title: 'Dashboard Contable', icon: <FiBarChart2 />, color: 'bg-blue-500', path: '/admin' },
            { title: 'Contabilidad', icon: <FiBookOpen />, color: 'bg-blue-800', path: '/admin/accounting' },
            { title: 'Asientos', icon: <FiFileText />, color: 'bg-indigo-500', path: '/admin/accounting/journals' },
            { title: 'Catálogo de Cuentas', icon: <FiList />, color: 'bg-purple-500', path: '/admin/accounting/chart' },
        ]
    },
    {
        title: 'Nómina y Finanzas',
        modules: [
            { title: 'Nómina', icon: <FiDollarSign />, color: 'bg-green-500', path: '/admin/payroll/generator' },
            { title: 'Beneficios', icon: <FiGift />, color: 'bg-yellow-500', path: '/admin/payroll/benefits' },
            { title: 'Anticipos y Préstamos', icon: <FiCreditCard />, color: 'bg-emerald-600', path: '/admin/payroll/advances' },
        ]
    },
    {
        title: 'Inteligencia y Personal',
        modules: [
            { title: 'Análisis Predictivo', icon: <FiActivity />, color: 'bg-indigo-600', path: '/intelligence' },
            { title: 'Mi Perfil', icon: <FiUsers />, color: 'bg-blue-500', path: '/profile' },
            { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
        ]
    }
];

export const entrepreneurSections = [
    {
        title: 'Emprendimiento y Proyectos',
        modules: [
            { title: 'Dashboard', icon: <FiBarChart2 />, color: 'bg-blue-500', path: '/admin' },
            { title: 'Emprendimiento', icon: <FiCompass />, color: 'bg-amber-600', path: '/admin/entrepreneurship' },
            { title: 'Nuevo Proyecto', icon: <FiPlus />, color: 'bg-green-500', path: '/admin/entrepreneurship/create' },
            { title: 'Análisis Predictivo', icon: <FiActivity />, color: 'bg-indigo-600', path: '/intelligence' },
        ]
    },
    {
        title: 'Personal y Soporte',
        modules: [
            { title: 'Mi Perfil', icon: <FiUsers />, color: 'bg-blue-500', path: '/profile' },
            { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
        ]
    }
];

// Helper para obtener las secciones agrupadas según el rol del usuario
export const getSectionsByRole = (user) => {
    const isSuperAdmin = user?.role === 'superadmin' || user?.email === 'admin@emplifi.com';
    if (isSuperAdmin) return superAdminSections;
    switch (user?.role) {
        case 'admin': return adminSections;
        case 'accounting': return accountingSections;
        case 'entrepreneur': return entrepreneurSections;
        default: return employeeSections;
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
