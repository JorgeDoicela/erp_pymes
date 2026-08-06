import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationsByVacancy, deleteVacancy } from '../../services/recruitment.service';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiCalendar, FiFileText, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const VacancyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadApplications();
    }, [id]);

    const loadApplications = async () => {
        try {
            const data = await getApplicationsByVacancy(id);
            setApplications(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await deleteVacancy(id);
            toast.success("Vacante y todos sus archivos asociados eliminados correctamente");
            navigate('/recruitment');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error al eliminar la vacante");
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'REVIEWING': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'INTERVIEW': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'TESTING': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'OFFER': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'HIRED': return 'bg-blue-600 text-white border-blue-700';
            case 'REJECTED': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const statusLabels = {
        'PENDING': 'Pendiente',
        'REVIEWING': 'En Revisión',
        'INTERVIEW': 'Entrevista',
        'TESTING': 'Pruebas',
        'OFFER': 'Oferta',
        'HIRED': 'Contratado',
        'REJECTED': 'Rechazado'
    };

    return (
        <div className="space-y-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <button onClick={() => navigate('/recruitment')} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors text-sm md:text-base font-medium">
                        <FiArrowLeft className="mr-2" /> Volver al tablero
                    </button>

                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold flex items-center transition-all border border-red-200 shadow-sm active:scale-95 text-sm"
                    >
                        <FiTrash2 className="mr-2" size={18} /> Eliminar Vacante
                    </button>
                </div>

                <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-8 tracking-tight">Candidatos para la Vacante</h1>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-500">Cargando...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {applications.length === 0 && (
                            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                                <FiUser className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                <p className="text-slate-500 text-lg font-medium">No hay postulaciones aún para esta vacante.</p>
                            </div>
                        )}

                        {applications.map(app => (
                            <div key={app.id} onClick={() => navigate(`/recruitment/applications/${app.id}`)}
                                className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                                <div className="w-full sm:w-auto">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h3 className="font-bold text-base md:text-lg text-slate-800 group-hover:text-blue-600 transition-colors uppercase truncate max-w-[200px] sm:max-w-none">{app.firstName} {app.lastName}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold border shrink-0 ${getStatusColor(app.status)}`}>
                                            {statusLabels[app.status] || app.status}
                                        </span>
                                    </div>
                                    <div className="text-slate-500 text-xs md:text-sm flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4 lg:gap-6">
                                        <span className="flex items-center truncate"><FiMail className="mr-2 text-slate-400 shrink-0" /> <span className="truncate">{app.email}</span></span>
                                        <span className="flex items-center"><FiPhone className="mr-2 text-slate-400 shrink-0" /> {app.phone}</span>
                                        <span className="flex items-center"><FiCalendar className="mr-2 text-slate-400 shrink-0" /> {new Date(app.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="hidden sm:block text-slate-300 group-hover:text-blue-500 transition-colors">
                                    <FiFileText className="text-2xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Confirmar Eliminación */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
                        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <FiAlertTriangle size={28} />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black text-slate-800">¿Eliminar esta vacante?</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Esta acción es irreversible. Se eliminará la vacante de empleo, las <strong className="text-slate-800">{applications.length} postulaciones</strong> recibidas y <strong className="text-slate-800">todos los archivos de Hojas de Vida (PDF)</strong> subidos por los postulantes.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                disabled={deleting}
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                disabled={deleting}
                                onClick={handleDelete}
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

export default VacancyDetails;
