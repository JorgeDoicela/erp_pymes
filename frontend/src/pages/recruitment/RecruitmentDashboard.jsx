import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getVacancies,
    getRecruitmentStats,
    updateVacancyStatus,
    deleteVacancy
} from '../../services/recruitment.service';

const RecruitmentDashboard = () => {
    const navigate = useNavigate();

    // Estados
    const [vacancies, setVacancies] = useState([]);
    const [stats, setStats] = useState({
        totalVacancies: 0,
        openVacancies: 0,
        closedVacancies: 0,
        totalApplications: 0,
        hiredCount: 0,
        inReviewCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, OPEN, CLOSED
    const [searchTerm, setSearchTerm] = useState('');
    const [vacancyToDelete, setVacancyToDelete] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }

    useEffect(() => {
        window.scrollTo(0, 0);
        loadStats();
    }, []);

    useEffect(() => {
        loadVacanciesData();
    }, [activeTab]);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const loadStats = async () => {
        try {
            const res = await getRecruitmentStats();
            if (res.success && res.data) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Error cargando estadísticas de reclutamiento:', error);
        }
    };

    const loadVacanciesData = async () => {
        setLoading(true);
        try {
            const params = {
                status: activeTab === 'ALL' ? undefined : activeTab,
                search: searchTerm.trim() || undefined
            };

            const data = await getVacancies(params);
            if (Array.isArray(data)) {
                setVacancies(data);
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al cargar vacantes');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        loadVacanciesData();
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
            await updateVacancyStatus(id, newStatus);
            showNotification('success', `Vacante ${newStatus === 'OPEN' ? 'publicada y abierta' : 'cerrada'}`);
            loadVacanciesData();
            loadStats();
        } catch (error) {
            showNotification('error', error.message || 'Error al actualizar estado');
        }
    };

    const handleDeleteVacancy = async () => {
        if (!vacancyToDelete) return;
        setActionLoading(true);
        try {
            await deleteVacancy(vacancyToDelete.id);
            showNotification('success', 'Vacante eliminada exitosamente');
            setVacancyToDelete(null);
            loadVacanciesData();
            loadStats();
        } catch (error) {
            showNotification('error', error.message || 'Error al eliminar vacante');
        } finally {
            setActionLoading(false);
        }
    };

    const copyVacancyLink = (vacancy) => {
        const companySlug = vacancy?.tenant?.slug;
        const link = companySlug
            ? `${window.location.origin}/careers/${vacancy.id}?company=${companySlug}`
            : `${window.location.origin}/careers/${vacancy.id}`;
        navigator.clipboard.writeText(link);
        showNotification('success', 'Enlace institucional de la vacante copiado al portapapeles');
    };

    const copyCompanyPortalLink = () => {
        const companySlug = vacancies.find(v => v.tenant?.slug)?.tenant?.slug;
        const link = companySlug
            ? `${window.location.origin}/careers?company=${companySlug}`
            : `${window.location.origin}/careers`;
        navigator.clipboard.writeText(link);
        showNotification('success', 'Enlace del Portal de Empleo copiado al portapapeles');
    };

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";

    return (
        <div className="space-y-4">
            {/* Notificación Toast Sobria */}
            {notification && (
                <div
                    className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded border text-xs font-medium shadow-md transition-all ${
                        notification.type === 'success'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-red-50 text-red-900 border-red-200'
                    }`}
                >
                    {notification.message}
                </div>
            )}

            {/* Header ERP con Métricas de Selección Integradas */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Recursos Humanos · Selección de Personal</p>
                    <h1 className="text-xl font-semibold text-gray-900">Talento Humano & Reclutamiento</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Gestione ofertas laborales, recepción de postulaciones y seguimiento de candidatos.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-4 bg-white px-3.5 py-2 rounded border border-gray-200 font-mono text-xs">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Vacantes Abiertas</span>
                            <span className="font-semibold text-emerald-700 tabular-nums">
                                {stats.openVacancies} activas
                            </span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Postulaciones</span>
                            <span className="font-semibold text-gray-900 tabular-nums">
                                {stats.totalApplications} recibidas
                            </span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Contratados</span>
                            <span className="font-semibold text-blue-700 tabular-nums">
                                {stats.hiredCount}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={copyCompanyPortalLink}
                        className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                        title="Copiar enlace público del Portal de Empleo de la empresa"
                    >
                        Portal de Empleo ↗
                    </button>

                    <button
                        onClick={() => navigate('/recruitment/create')}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                    >
                        + Crear Vacante
                    </button>
                </div>
            </div>

            {/* Pestañas con Contadores Integrados (Holded/Linear Style) */}
            <div className="flex items-center justify-between border-b border-gray-200 gap-4 overflow-x-auto">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handleTabChange('ALL')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'ALL'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Todas las Vacantes <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.totalVacancies})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('OPEN')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'OPEN'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Publicadas / Abiertas <span className="ml-1.5 font-mono text-[11px] text-emerald-600">({stats.openVacancies})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('CLOSED')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'CLOSED'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Cerradas / Pausadas <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.closedVacancies})</span>
                    </button>
                </div>
            </div>

            {/* Barra de Búsqueda */}
            <div className="bg-white p-3 rounded border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por cargo, departamento o ubicación..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={inputClass}
                    />
                    <button
                        type="submit"
                        className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors shrink-0 cursor-pointer"
                    >
                        Buscar
                    </button>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                setTimeout(loadVacanciesData, 0);
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer shrink-0"
                        >
                            Limpiar
                        </button>
                    )}
                </form>
            </div>

            {/* Tabla Principal de Vacantes (Hoja de Cálculo Sobria) */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-2.5 px-4">Oferta / Cargo</th>
                                <th className="py-2.5 px-4">Departamento</th>
                                <th className="py-2.5 px-4">Modalidad & Ubicación</th>
                                <th className="py-2.5 px-4 text-center">Postulantes Recibidos</th>
                                <th className="py-2.5 px-4 text-right">Rango Salarial</th>
                                <th className="py-2.5 px-4 text-center">Fecha Límite</th>
                                <th className="py-2.5 px-4 text-center">Estado</th>
                                <th className="py-2.5 px-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-gray-400 text-xs">
                                        Cargando vacantes laborales...
                                    </td>
                                </tr>
                            ) : vacancies.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center">
                                        <p className="text-sm font-medium text-gray-700">Sin vacantes registradas</p>
                                        <p className="text-xs text-gray-400 mt-1">Crea una nueva vacante para iniciar la recepción de candidatos.</p>
                                    </td>
                                </tr>
                            ) : (
                                vacancies.map(v => (
                                    <tr key={v.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-2.5 px-4">
                                            <button
                                                onClick={() => navigate(`/recruitment/vacancy/${v.id}`)}
                                                className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-left cursor-pointer block"
                                            >
                                                {v.title}
                                            </button>
                                            <span className="text-gray-400 text-[11px]">
                                                Creada por: {v.postedBy?.firstName} {v.postedBy?.lastName || 'RRHH'}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 font-medium text-gray-700">
                                            {v.department}
                                        </td>
                                        <td className="py-2.5 px-4 text-gray-600">
                                            {v.location || 'Presencial'} · <span className="text-gray-400 text-[11px]">{v.employmentType || 'Tiempo Completo'}</span>
                                        </td>
                                        <td className="py-2.5 px-4 text-center">
                                            <button
                                                onClick={() => navigate(`/recruitment/applications/${v.id}`)}
                                                className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded font-mono font-medium text-gray-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                            >
                                                <span>{v.applicationsCount || 0} candidatos</span>
                                                <span className="text-blue-600">→</span>
                                            </button>
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-mono font-medium text-gray-900 tabular-nums">
                                            {v.salaryMin && v.salaryMax
                                                ? `$${v.salaryMin.toFixed(0)} - $${v.salaryMax.toFixed(0)}`
                                                : v.salaryMin ? `Desde $${v.salaryMin.toFixed(0)}` : 'A convenir'}
                                        </td>
                                        <td className="py-2.5 px-4 text-center font-mono text-[11px] text-gray-500 tabular-nums">
                                            {new Date(v.deadline).toLocaleDateString('es-EC')}
                                        </td>
                                        <td className="py-2.5 px-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                                v.status === 'OPEN'
                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}>
                                                {v.status === 'OPEN' ? 'Publicada' : 'Cerrada'}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => copyVacancyLink(v)}
                                                    className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                                                    title="Copiar enlace de postulación"
                                                >
                                                    Enlace
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(v.id, v.status)}
                                                    className={`border text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${
                                                        v.status === 'OPEN'
                                                            ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                                            : 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                                                    }`}
                                                    title={v.status === 'OPEN' ? 'Cerrar vacante' : 'Publicar vacante'}
                                                >
                                                    {v.status === 'OPEN' ? 'Cerrar' : 'Publicar'}
                                                </button>
                                                <button
                                                    onClick={() => setVacancyToDelete(v)}
                                                    className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                                                    title="Eliminar vacante"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
            {vacancyToDelete && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-sm w-full overflow-hidden shadow-xl">
                        <div className="p-5">
                            <h3 className="text-sm font-semibold text-gray-900">¿Eliminar la vacante "{vacancyToDelete.title}"?</h3>
                            <p className="text-xs text-gray-500 mt-2">
                                Esta acción eliminará permanentemente la oferta de empleo y todas las postulaciones y hojas de vida asociadas.
                            </p>
                        </div>
                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setVacancyToDelete(null)}
                                className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleDeleteVacancy}
                                className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {actionLoading ? 'Eliminando...' : 'Sí, Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruitmentDashboard;
