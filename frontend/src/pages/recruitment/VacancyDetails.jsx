import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationsByVacancy, deleteVacancy, deleteApplication, updateApplicationStatus } from '../../services/recruitment.service';
import { FiArrowLeft, FiTrash2, FiCopy, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const STATUS_OPTIONS = [
    { key: 'ALL', label: 'Todos' },
    { key: 'PENDING', label: 'Postulados' },
    { key: 'REVIEWING', label: 'En Revisión' },
    { key: 'INTERVIEW', label: 'Entrevistas' },
    { key: 'TESTING', label: 'Pruebas' },
    { key: 'OFFER', label: 'Oferta' },
    { key: 'HIRED', label: 'Contratados' },
    { key: 'REJECTED', label: 'Descartados' }
];

const VacancyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [copied, setCopied] = useState(false);

    // Modals
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [appToDelete, setAppToDelete] = useState(null);
    const [deletingCandidate, setDeletingCandidate] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const apps = await getApplicationsByVacancy(id);
            setApplications(apps || []);
        } catch (error) {
            console.error('Error al cargar aplicaciones:', error);
            toast.error('Error al cargar los candidatos de la vacante');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (appId, newStatus) => {
        try {
            await updateApplicationStatus(appId, newStatus, false);
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
            toast.success('Estado del candidato actualizado');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error al cambiar estado');
        }
    };

    const handleDeleteCandidate = async () => {
        if (!appToDelete) return;
        try {
            setDeletingCandidate(true);
            await deleteApplication(appToDelete.id);
            toast.success('Candidato eliminado');
            setApplications(prev => prev.filter(a => a.id !== appToDelete.id));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al eliminar el candidato');
        } finally {
            setDeletingCandidate(false);
            setAppToDelete(null);
        }
    };

    const handleDeleteVacancy = async () => {
        try {
            setDeleting(true);
            await deleteVacancy(id);
            toast.success('Vacante eliminada correctamente');
            navigate('/recruitment');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al eliminar la vacante');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const copyPublicLink = () => {
        const url = `${window.location.origin}/careers/${id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Enlace de postulación copiado');
        setTimeout(() => setCopied(false), 2500);
    };

    // Filtered applications
    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            const matchesTab = activeTab === 'ALL' || app.status === activeTab;
            const searchLower = searchTerm.toLowerCase();
            const fullName = `${app.firstName} ${app.lastName}`.toLowerCase();
            const matchesSearch = !searchTerm || fullName.includes(searchLower) || app.email?.toLowerCase().includes(searchLower);
            return matchesTab && matchesSearch;
        });
    }, [applications, activeTab, searchTerm]);

    const statusCounts = useMemo(() => {
        const counts = { ALL: applications.length };
        STATUS_OPTIONS.forEach(opt => {
            if (opt.key !== 'ALL') {
                counts[opt.key] = applications.filter(a => a.status === opt.key).length;
            }
        });
        return counts;
    }, [applications]);

    const vacancyTitle = applications[0]?.vacancy?.title || 'Proceso de Selección';
    const vacancyDepartment = applications[0]?.vacancy?.department || 'General';

    return (
        <div className="space-y-5">
            {/* Header ERP */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-200">
                <div>
                    <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <button
                            onClick={() => navigate('/recruitment')}
                            className="hover:text-gray-900 transition-colors flex items-center gap-1 text-gray-600 cursor-pointer"
                        >
                            <FiArrowLeft size={12} /> Reclutamiento y Vacantes
                        </button>
                        <span>·</span>
                        <span>{vacancyDepartment}</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
                        {vacancyTitle}
                    </h1>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={copyPublicLink}
                        className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        {copied ? <FiCheck className="text-emerald-600" size={13} /> : <FiCopy size={13} />}
                        <span>{copied ? 'Enlace Copiado' : 'Copiar Enlace de Postulación'}</span>
                    </button>

                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <FiTrash2 size={13} />
                        <span>Eliminar</span>
                    </button>
                </div>
            </div>

            {/* Pipeline Tabs Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200">
                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
                    {STATUS_OPTIONS.map(tab => {
                        const count = statusCounts[tab.key] || 0;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                                    isActive
                                        ? 'border-gray-900 text-gray-900 font-semibold'
                                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className="font-mono text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded">
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="pb-2 sm:pb-0">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-white border border-gray-200 rounded px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-blue-500 w-full sm:w-56"
                    />
                </div>
            </div>

            {/* Candidates Table */}
            {loading ? (
                <div className="bg-white border border-gray-200 rounded p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-medium">Cargando candidatos del proceso...</p>
                </div>
            ) : filteredApplications.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded p-12 text-center text-gray-400">
                    <p className="text-sm font-medium text-gray-700">No se encontraron postulantes en esta etapa</p>
                    <p className="text-xs text-gray-400 mt-1">Comparte el enlace público para recibir candidatos o ajusta el filtro de búsqueda.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="py-2.5 px-4">Candidato</th>
                                    <th className="py-2.5 px-4">Contacto</th>
                                    <th className="py-2.5 px-4">Fecha Postulación</th>
                                    <th className="py-2.5 px-4">Etapa del Pipeline</th>
                                    <th className="py-2.5 px-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredApplications.map(app => {
                                    const initials = `${app.firstName?.[0] || ''}${app.lastName?.[0] || ''}`.toUpperCase();

                                    return (
                                        <tr key={app.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="py-2.5 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded bg-gray-100 text-gray-700 font-mono font-semibold text-xs flex items-center justify-center shrink-0">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <button
                                                            onClick={() => navigate(`/recruitment/applications/${app.id}`)}
                                                            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left block cursor-pointer"
                                                        >
                                                            {app.firstName} {app.lastName}
                                                        </button>
                                                        <span className="text-[11px] text-gray-400">
                                                            {app.coverLetter ? 'Carta adjunta' : 'Sin carta'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <div className="text-gray-800">{app.email}</div>
                                                <div className="text-[11px] text-gray-500 font-mono tabular-nums">{app.phone || 'Sin teléfono'}</div>
                                            </td>
                                            <td className="py-2.5 px-4 font-mono text-gray-600 tabular-nums">
                                                {new Date(app.createdAt).toLocaleDateString('es-EC')}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <select
                                                    value={app.status}
                                                    onChange={e => handleStatusChange(app.id, e.target.value)}
                                                    className="bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                                                >
                                                    <option value="PENDING">Postulado</option>
                                                    <option value="REVIEWING">En Revisión</option>
                                                    <option value="INTERVIEW">Entrevista</option>
                                                    <option value="TESTING">Pruebas</option>
                                                    <option value="OFFER">Oferta</option>
                                                    <option value="HIRED">Contratado</option>
                                                    <option value="REJECTED">Descartado</option>
                                                </select>
                                            </td>
                                            <td className="py-2.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => navigate(`/recruitment/applications/${app.id}`)}
                                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors cursor-pointer shadow-xs"
                                                    >
                                                        Ver Expediente →
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAppToDelete(app)}
                                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Eliminar candidato"
                                                    >
                                                        <FiTrash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Eliminar Candidato */}
            <Modal
                isOpen={!!appToDelete}
                onClose={() => setAppToDelete(null)}
                title="¿Eliminar candidato?"
                size="sm"
                footer={
                    <>
                        <button
                            disabled={deletingCandidate}
                            onClick={() => setAppToDelete(null)}
                            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            disabled={deletingCandidate}
                            onClick={handleDeleteCandidate}
                            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors shadow-xs disabled:opacity-50"
                        >
                            {deletingCandidate ? 'Eliminando...' : 'Eliminar Candidato'}
                        </button>
                    </>
                }
            >
                {appToDelete && (
                    <p className="text-gray-600 text-xs leading-relaxed">
                        Se eliminará la postulación de <strong className="text-gray-900">{appToDelete.firstName} {appToDelete.lastName}</strong> y sus registros asociados.
                    </p>
                )}
            </Modal>

            {/* Modal Eliminar Vacante */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="¿Eliminar vacante?"
                size="sm"
                footer={
                    <>
                        <button
                            disabled={deleting}
                            onClick={() => setShowDeleteModal(false)}
                            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            disabled={deleting}
                            onClick={handleDeleteVacancy}
                            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors shadow-xs disabled:opacity-50"
                        >
                            {deleting ? 'Eliminando...' : 'Eliminar Vacante'}
                        </button>
                    </>
                }
            >
                <p className="text-gray-600 text-xs leading-relaxed">
                    Esta acción eliminará permanentemente la vacante y las <strong className="text-gray-900">{applications.length} postulaciones</strong> recibidas.
                </p>
            </Modal>
        </div>
    );
};

export default VacancyDetails;
