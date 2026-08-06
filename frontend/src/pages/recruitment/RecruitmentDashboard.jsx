import { useState, useEffect } from 'react';
import { getVacancies, updateVacancyStatus, deleteVacancy } from '../../services/recruitment.service';
import { FiPlus, FiBriefcase, FiUsers, FiGlobe, FiEye, FiCheckCircle, FiSlash, FiCopy, FiInfo, FiSearch, FiFilter, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
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

    const copyLink = (id) => {
        const link = `${window.location.origin}/careers/${id}`;
        navigator.clipboard.writeText(link);
        toast?.success("Enlace copiado al portapapeles");
    };

    const filteredVacancies = vacancies.filter(v =>
        v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 px-4 sm:px-0 pb-12">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-2">
                            Talento Humano
                        </h1>
                        <p className="text-slate-500 font-medium">Lidera el crecimiento de la empresa gestionando vacantes y candidatos.</p>
                    </div>
                    <button
                        onClick={() => navigate('/recruitment/create')}
                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center shadow-xl shadow-blue-100 transition-all active:scale-95"
                    >
                        <FiPlus className="mr-2" size={20} /> Crear Nueva Vacante
                    </button>
                </header>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cargo o departamento..."
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando datos...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px] md:min-w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                                        <th className="p-6">Información Básica</th>
                                        <th className="p-6">Departamento</th>
                                        <th className="p-6 text-center">Talento Recibido</th>
                                        <th className="p-6">Visibilidad</th>
                                        <th className="p-6 text-right">Gestión</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredVacancies.map(v => (
                                        <tr key={v.id} className="hover:bg-blue-50/30 transition-all group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold group-hover:scale-110 transition-transform">
                                                        {v.title[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-extrabold text-slate-800 text-base">{v.title}</p>
                                                        <p className="text-xs text-slate-400 font-medium">{v.location} • {v.employmentType}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase">
                                                    {v.department}
                                                </span>
                                            </td>
                                            <td className="p-6 text-center">
                                                <button
                                                    onClick={() => navigate(`/recruitment/${v.id}`)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 hover:border-blue-200 transition-all active:scale-95 shadow-sm"
                                                >
                                                    <FiUsers /> Ver Postulaciones
                                                </button>
                                            </td>
                                            <td className="p-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${v.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                                    {v.status === 'OPEN' ? 'Publicada' : 'Cerrada'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right space-x-2">
                                                <button
                                                    onClick={() => copyLink(v.id)}
                                                    className="p-2.5 bg-white border border-slate-200 hover:bg-blue-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                                                    title="Compartir link de carrera"
                                                >
                                                    <FiGlobe size={18} />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(v.id, v.status)}
                                                    className={`p-2.5 rounded-xl border transition-all shadow-sm ${v.status === 'OPEN' ? 'bg-white border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50' : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                    title={v.status === 'OPEN' ? 'Bajar Publicación' : 'Relanzar Publicación'}
                                                >
                                                    {v.status === 'OPEN' ? <FiSlash size={18} /> : <FiCheckCircle size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => setVacancyToDelete(v)}
                                                    className="p-2.5 bg-white border border-slate-200 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-all shadow-sm"
                                                    title="Eliminar vacante"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredVacancies.length === 0 && (
                            <div className="p-20 text-center">
                                <FiInfo className="mx-auto text-slate-200 mb-4" size={50} />
                                <p className="text-slate-400 font-bold text-lg">No se encontraron resultados</p>
                                <p className="text-slate-300 text-sm mt-1">Prueba con otros términos de búsqueda.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Confirmar Eliminación desde Dashboard */}
            {vacancyToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
                        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <FiAlertTriangle size={28} />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black text-slate-800">¿Eliminar la vacante "{vacancyToDelete.title}"?</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Esta acción es irreversible. Se borrará la oferta laboral, todas sus postulaciones y <strong className="text-slate-800">los archivos PDF de las hojas de vida</strong> subidas.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                disabled={deleting}
                                onClick={() => setVacancyToDelete(null)}
                                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                disabled={deleting}
                                onClick={handleDeleteVacancy}
                                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-red-100 disabled:opacity-50"
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
