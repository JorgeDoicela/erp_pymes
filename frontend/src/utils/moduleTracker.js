/**
 * Utilidad de seguimiento y analítica de módulos para ERP PyMEs
 * Permite registrar y consultar los accesos más frecuentes y recientes de cada colaborador según su rol.
 */

const STORAGE_PREFIX = 'erp_module_tracker_';

// Accesos predeterminados inteligentes según rol cuando no hay historial previo
const ROLE_DEFAULTS = {
    admin: [
        { path: '/admin/employees', title: 'Empleados y Fichas', category: 'Gestión de Capital Humano' },
        { path: '/attendance', title: 'Control de Asistencia', category: 'Tiempo y Asistencia' },
        { path: '/admin/payroll/generator', title: 'Gestión de Nómina', category: 'Nómina y Compensaciones' },
        { path: '/admin/absences', title: 'Ausencias y Permisos', category: 'Tiempo y Asistencia' },
        { path: '/performance', title: 'Evaluaciones y Objetivos', category: 'Gestión del Talento' },
        { path: '/recruitment', title: 'Reclutamiento y Vacantes', category: 'Gestión del Talento' }
    ],
    hr: [
        { path: '/admin/employees', title: 'Empleados y Fichas', category: 'Gestión de Capital Humano' },
        { path: '/attendance', title: 'Control de Asistencia', category: 'Tiempo y Asistencia' },
        { path: '/admin/absences', title: 'Ausencias y Permisos', category: 'Tiempo y Asistencia' },
        { path: '/recruitment', title: 'Reclutamiento y Vacantes', category: 'Gestión del Talento' },
        { path: '/performance', title: 'Evaluaciones y Objetivos', category: 'Gestión del Talento' },
        { path: '/admin/expedientes', title: 'Expedientes Digitales', category: 'Gestión de Capital Humano' }
    ],
    accounting: [
        { path: '/admin/accounting', title: 'Dashboard Contable', category: 'Gestión Contable' },
        { path: '/admin/accounting/journals', title: 'Asientos Contables', category: 'Gestión Contable' },
        { path: '/admin/accounting/chart', title: 'Catálogo de Cuentas', category: 'Gestión Contable' },
        { path: '/admin/payroll/generator', title: 'Gestión de Nómina', category: 'Nómina y Finanzas' },
        { path: '/admin/payroll/advances', title: 'Anticipos y Préstamos', category: 'Nómina y Finanzas' },
        { path: '/analytics', title: 'BI & Analíticas', category: 'Inteligencia y Personal' }
    ],
    superadmin: [
        { path: '/superadmin/tenants', title: 'Gestión de Empresas Registradas', category: 'Administración Global Plataforma' },
        { path: '/superadmin/metrics', title: 'Métricas de la Plataforma', category: 'Administración Global Plataforma' },
        { path: '/superadmin/audit', title: 'Auditoría Global Plataforma', category: 'Gobernanza & Seguridad' },
        { path: '/analytics', title: 'Indicadores Globales (BI)', category: 'Gobernanza & Seguridad' }
    ],
    employee: [
        { path: '/empleado/asistencia', title: 'Asistencia y Marcaciones', category: 'Mi Tiempo y Permisos' },
        { path: '/empleado/ausencias', title: 'Solicitud de Permisos', category: 'Mi Tiempo y Permisos' },
        { path: '/my-payments', title: 'Mis Recibos de Pago', category: 'Mis Pagos y Beneficios' },
        { path: '/my-advances', title: 'Mis Anticipos', category: 'Mis Pagos y Beneficios' },
        { path: '/performance/my-evaluations', title: 'Mis Evaluaciones', category: 'Mi Desempeño' },
        { path: '/announcements', title: 'Comunicados y Anuncios', category: 'Mi Portal' }
    ]
};

const getStorageKey = (user) => {
    const id = user?.id || user?.email || user?.role || 'default';
    return `${STORAGE_PREFIX}${id}`;
};

/**
 * Obtiene el historial crudo almacenado
 */
export const getRawModuleHistory = (user) => {
    try {
        const raw = localStorage.getItem(getStorageKey(user));
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

/**
 * Registra una visita a un módulo
 */
export const recordModuleVisit = (user, module) => {
    if (!module || !module.path) return;
    try {
        const key = getStorageKey(user);
        const history = getRawModuleHistory(user);
        const current = history[module.path] || {
            path: module.path,
            title: module.title,
            category: module.category || 'General',
            visitCount: 0,
            lastVisited: Date.now()
        };

        history[module.path] = {
            ...current,
            title: module.title || current.title,
            category: module.category || current.category,
            visitCount: (current.visitCount || 0) + 1,
            lastVisited: Date.now()
        };

        localStorage.setItem(key, JSON.stringify(history));
    } catch (e) {
        console.warn('Error recording module visit:', e);
    }
};

/**
 * Obtiene la lista de módulos más frecuentes / más vistos
 */
export const getFrequentModules = (user, allModules = [], limit = 6) => {
    const history = getRawModuleHistory(user);
    const historyEntries = Object.values(history).filter(item => item.visitCount > 0);

    // Mapear con la definición actual de módulos para asegurar iconos y rutas válidas
    const moduleMap = new Map(allModules.map(m => [m.path, m]));

    const sortedHistory = historyEntries
        .filter(item => moduleMap.has(item.path))
        .map(item => ({
            ...moduleMap.get(item.path),
            visitCount: item.visitCount,
            lastVisited: item.lastVisited,
            badge: `${item.visitCount} ${item.visitCount === 1 ? 'visita' : 'visitas'}`
        }))
        .sort((a, b) => b.visitCount - a.visitCount);

    if (sortedHistory.length >= limit) {
        return sortedHistory.slice(0, limit);
    }

    // Rellenar con los defaults del rol si el usuario aún no tiene suficiente historial
    const roleKey = (user?.role || 'employee').toLowerCase();
    const defaults = ROLE_DEFAULTS[roleKey] || ROLE_DEFAULTS.admin;
    const existingPaths = new Set(sortedHistory.map(m => m.path));

    for (const def of defaults) {
        if (sortedHistory.length >= limit) break;
        if (!existingPaths.has(def.path) && moduleMap.has(def.path)) {
            sortedHistory.push({
                ...moduleMap.get(def.path),
                visitCount: 0,
                lastVisited: null,
                badge: 'Destacado'
            });
            existingPaths.add(def.path);
        }
    }

    return sortedHistory.slice(0, limit);
};

/**
 * Obtiene la lista de módulos visitados recientemente
 */
export const getRecentModules = (user, allModules = [], limit = 6) => {
    const history = getRawModuleHistory(user);
    const historyEntries = Object.values(history).filter(item => item.lastVisited);

    const moduleMap = new Map(allModules.map(m => [m.path, m]));

    const sortedRecent = historyEntries
        .filter(item => moduleMap.has(item.path))
        .map(item => ({
            ...moduleMap.get(item.path),
            visitCount: item.visitCount,
            lastVisited: item.lastVisited,
            relativeTime: formatRelativeTime(item.lastVisited)
        }))
        .sort((a, b) => b.lastVisited - a.lastVisited);

    return sortedRecent.slice(0, limit);
};

/**
 * Formateador de tiempo relativo sobrio y conciso
 */
export const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Reciente';
    const now = Date.now();
    const diffSec = Math.floor((now - timestamp) / 1000);

    if (diffSec < 60) return 'Hace un momento';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return new Date(timestamp).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
};
