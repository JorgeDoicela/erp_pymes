import { useState, useEffect } from 'react';
import { getVacancies, updateVacancyStatus, deleteVacancy } from '../../services/recruitment.service';
import { FiPlus, FiBriefcase, FiUsers, FiGlobe, FiEye, FiCheckCircle, FiSlash, FiCopy, FiInfo, FiSearch, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const RecruitmentDashboard = () => {
    const navigate = useNavigate();
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [vacancyToDelete, setVacancyToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadVacancies();
    }, []);

    const loadVacancies = async () => {
        try {
            setLoading(true);
            const data = await getVacancies();
            setVacancies(data);
        } catch (error) {
            console.error(error);
            toast?.error("Error al cargar vacantes");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
            await updateVacancyStatus(id, newStatus);
            toast?.success(`Vacante ${newStatus === 'OPEN' ? 'Publicada' : 'Cerrada'}`);
            loadVacancies();
        } catch (error) {
            toast?.error("Error al actualizar estado");
        }
    };

    const handleDeleteVacancy = async () => {
        if (!vacancyToDelete) return;
        try {
            setDeleting(true);
            await deleteVacancy(vacancyToDelete.id);
            toast?.success("Vacante y archivos asociados eliminados correctamente");
            setVacancyToDelete(null);
            loadVacancies();
        } catch (error) {
            console.error(error);
            toast?.error(error.response?.data?.message || "Error al eliminar la vacante");
        } finally {
            setDeleting(false);
        }
    };

    const copyLink = (vacancy) => {
        const companySlug = vacancy?.tenant?.slug;
        const link = companySlug 
            ? `${window.location.origin}/careers/${vacancy.id}?company=${companySlug}`
            : `${window.location.origin}/careers/${vacancy.id}`;
        navigator.clipboard.writeText(link);
        toast?.success("Enlace de vacante institucional copiado");
    };

    const copyCompanyPortalLink = () => {
        const companySlug = vacancies.find(v => v.tenant?.slug)?.tenant?.slug;
        const link = companySlug 
            ? `${window.location.origin}/careers?company=${companySlug}`
            : `${window.location.origin}/careers`;
        navigator.clipboard.writeText(link);
        toast?.success("Enlace del Portal de Empleo de la empresa copiado");
    };

    const filteredVacancies = vacancies.filter(v =>
        v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Recursos Humanos · Selección de Personal</p>
                    <h1 className="text-xl font-semibold text-gray-900">Talento Humano & Reclutamiento</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Gestiona vacantes abiertas, recepción de postulaciones y candidatos.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={copyCompanyPortalLink}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0 border border-slate-200"
                        title="Copiar enlace público del Portal de Empleo de esta empresa"
                    >
                        <FiGlobe size={14} /> Portal de Empleo Empresa
                    </button>
                    <button
                        onClick={() => navigate('/recruitment/create')}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                    >
                        <FiPlus size={14} /> Crear Nueva Vacante
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative max-w-xl flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Buscar por cargo o departamento..."
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-16 bg-white rounded border border-gray-200">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-400 text-xs font-medium">Cargando vacantes...</p>
                </div>
            ) : (
                <div className="bg-white rounded border border-gray-200 overflow-hidden">
                    {/* VISTA MÓVIL: Tarjetas Apiladas (Cero scroll horizontal) */}
                    <div className="block md:hidden divide-y divide-gray-100">
                        {filteredVacancies.map(v => (
                            <div key={v.id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded text-blue-700 flex items-center justify-center shrink-0">
                                            <FiBriefcase size={14} />
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => navigate(`/recruitment/vacancy/${v.id}`)}
                                                className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors text-left cursor-pointer"
                                            >
                                                {v.title}
                                            </button>
                                            <p className="text-xs text-gray-500">{v.department} · {v.location || 'Presencial'}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded border shrink-0 ${v.status === 'OPEN' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                        {v.status === 'OPEN' ? 'Publicada' : 'Cerrada'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs">
                                    <button
                                        onClick={() => navigate(`/recruitment/applications/${v.id}`)}
                                        className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded font-mono font-medium text-gray-800 hover:bg-gray-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <FiUsers size={12} className="text-gray-500" />
                                        {v.applicationsCount || 0} postulantes
                                    </button>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => copyLink(v)}
                                            className="app-button-table cursor-pointer"
                                            title="Copiar Enlace Público"
                                        >
                                            <FiCopy size={12} />
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(v.id, v.status)}
                                            className="app-button-table cursor-pointer"
                                            title={v.status === 'OPEN' ? 'Cerrar Vacante' : 'Abrir Vacante'}
                                        >
                                            {v.status === 'OPEN' ? <FiSlash size={12} /> : <FiCheckCircle size={12} />}
                                        </button>
                                        <button
                                            onClick={() => setVacancyToDelete(v)}
                                            className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                                            title="Eliminar vacante"
                                        >
                                            <FiTrash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredVacancies.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-xs italic">
                                No se encontraron vacantes registradas.
                            </div>
                        )}
                    </div>

                    {/* VISTA ESCRITORIO: Tabla Completa */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="app-table w-full">
                            <thead>
                                <tr>
                                    <th className="app-th">Información Básica</th>
                                    <th className="app-th">Departamento</th>
                                    <th className="app-th text-center">Talento Recibido</th>
                                    <th className="app-th">Visibilidad</th>
                                    <th className="app-th text-right">Gestión</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVacancies.map(v => (
                                    <tr key={v.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="app-td">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 bg-blue-50 border border-blue-200 rounded text-blue-700 flex items-center justify-center shrink-0">
                                                    <FiBriefcase size={14} />
                                                </div>
                                                <div>
                                                    <button
                                                        onClick={() => navigate(`/recruitment/vacancy/${v.id}`)}
                                                        className="font-semibold text-gray-900 text-xs hover:text-blue-600 transition-colors text-left"
                                                    >
                                                        {v.title}
                                                    </button>
                                                    <p className="text-[11px] text-gray-400">{v.location || 'Presencial'} · {v.type || 'Tiempo Completo'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="app-td">
                                            <span className="text-xs font-medium text-gray-700">{v.department}</span>
                                        </td>
                                        <td className="app-td text-center">
                                            <button
                                                onClick={() => navigate(`/recruitment/applications/${v.id}`)}
                                                className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono font-medium text-gray-800 hover:bg-gray-200 transition-colors inline-flex items-center gap-1.5"
                                                style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
                                            >
                                                <FiUsers size={12} className="text-gray-500" />
                                                {v.applicationsCount || 0} postulantes
                                            </button>
                                        </td>
                                        <td className="app-td">
                                            <span className={`px-2 py-0.5 text-[11px] font-medium rounded border ${v.status === 'OPEN' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                {v.status === 'OPEN' ? 'Publicada' : 'Cerrada'}
                                            </span>
                                        </td>
                                        <td className="app-td text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => copyLink(v)}
                                                    className="app-button-table"
                                                    title="Copiar Enlace Público"
                                                >
                                                    <FiCopy size={12} /> Enlace
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(v.id, v.status)}
                                                    className="app-button-table"
                                                    title={v.status === 'OPEN' ? 'Cerrar Vacante' : 'Abrir Vacante'}
                                                >
                                                    {v.status === 'OPEN' ? <FiSlash size={12} /> : <FiCheckCircle size={12} />}
                                                </button>
                                                <button
                                                    onClick={() => setVacancyToDelete(v)}
                                                    className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                                                    title="Eliminar vacante"
                                                >
                                                    <FiTrash2 size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredVacancies.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="app-td text-center py-12 text-gray-400">
                                            No se encontraron vacantes registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Confirmar Eliminación desde Dashboard */}
            {vacancyToDelete && (
                <div className="app-modal-overlay">
                    <div className="app-modal-content max-w-md">
                        <div className="text-center space-y-3">
                            <div className="w-10 h-10 bg-red-50 text-red-700 border border-red-200 rounded flex items-center justify-center mx-auto">
                                <FiAlertTriangle size={20} />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900">¿Eliminar la vacante "{vacancyToDelete.title}"?</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Esta acción es irreversible. Se eliminará la oferta laboral y todas sus postulaciones recibidas.
                            </p>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-gray-200 justify-end">
                            <button
                                disabled={deleting}
                                onClick={() => setVacancyToDelete(null)}
                                className="app-button-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                disabled={deleting}
                                onClick={handleDeleteVacancy}
                                className="app-button-danger"
                            >
                                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruitmentDashboard;
