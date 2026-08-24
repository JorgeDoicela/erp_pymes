import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationDetails, updateApplicationStatus, deleteApplication, addApplicationNote, scheduleInterview, evaluateCandidate, hireCandidate } from '../../services/recruitment.service';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiDownload, FiMessageSquare, FiSend, FiCalendar, FiMapPin, FiStar, FiCheckCircle, FiXCircle, FiBriefcase, FiFileText, FiInfo, FiClock, FiTrash2, FiAlertTriangle, FiEye, FiExternalLink, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast'; // Assuming toast is available, if not fallback to alert

const ApplicationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Modals State
    const [showModal, setShowModal] = useState(false); // Interview
    const [showEvaModal, setShowEvaModal] = useState(false); // Evaluation
    const [showHireModal, setShowHireModal] = useState(false); // Hire
    const [showDeleteModal, setShowDeleteModal] = useState(false); // Delete candidate
    const [showPdfModal, setShowPdfModal] = useState(false); // View PDF Modal
    const [deletingCandidate, setDeletingCandidate] = useState(false);

    const getResumeUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;

        const token = localStorage.getItem('token') || '';
        let cleanPath = url;
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
        if (cleanPath.startsWith('resumes/')) cleanPath = `uploads/${cleanPath}`;
        if (!cleanPath.startsWith('api/')) cleanPath = `api/${cleanPath}`;

        const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
        const apiBase = import.meta.env.VITE_API_URL || '/api';
        let finalUrl = `/${cleanPath}${tokenParam}`;
        if (apiBase.startsWith('http')) {
            const baseUrl = apiBase.replace(/\/api\/?$/, '');
            finalUrl = `${baseUrl}/${cleanPath}${tokenParam}`;
        }
        return finalUrl;
    };

    const handleDeleteCandidate = async () => {
        try {
            setDeletingCandidate(true);
            await deleteApplication(id);
            toast?.success("Candidato y sus archivos eliminados correctamente");
            navigate(app?.vacancyId ? `/recruitment/${app.vacancyId}` : '/recruitment');
        } catch (error) {
            console.error(error);
            toast?.error(error.response?.data?.message || "Error al eliminar el candidato");
        } finally {
            setDeletingCandidate(false);
            setShowDeleteModal(false);
        }
    };

    const [interviewData, setInterviewData] = useState({ date: '', time: '', type: 'VIRTUAL', location: '', notes: '' });
    const [evaData, setEvaData] = useState({
        overallScore: 0,
        recommendation: 'MAYBE',
        comments: '',
        ratings: {
            'Técnico': 0,
            'Blandas': 0,
            'Experiencia': 0,
            'Ajuste Cultural': 0,
            'Motivación': 0
        }
    });

    // Hire Data
    const [hireData, setHireData] = useState({
        identityCard: '',
        birthDate: '',
        address: '',
        civilStatus: 'Soltero',
        contractType: 'Indefinido',
        salary: '',
        startDate: '',
        password: '',
        closeVacancy: false,
        sendEmail: true
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getApplicationDetails(id);
            setApp(data);
        } catch (error) {
            console.error(error);
            toast?.error("Error al cargar los detalles de la postulación");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        let sendEmail = true;
        if (newStatus === 'REJECTED') {
            const confirmEmail = window.confirm("¿Deseas enviar un email automático de rechazo al candidato?");
            if (confirmEmail === false) sendEmail = false;
        }

        try {
            await updateApplicationStatus(id, newStatus, sendEmail);
            toast?.success(sendEmail && newStatus === 'REJECTED' ? "Estado actualizado y email enviado" : "Estado actualizado");
            loadData();
        } catch (error) {
            toast?.error("Error al actualizar estado");
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!note.trim() || submitting) return;
        try {
            setSubmitting(true);
            await addApplicationNote(id, note);
            setNote('');
            toast?.success("Nota agregada");
            loadData();
        } catch (error) {
            toast?.error("Error al agregar nota");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            // Ensure date and time are valid
            if (!interviewData.date || !interviewData.time) {
                toast?.error("Fecha y hora son requeridas");
                return;
            }
            const dateTime = new Date(`${interviewData.date}T${interviewData.time}`);
            await scheduleInterview(id, { ...interviewData, date: dateTime });
            setShowModal(false);
            setInterviewData({ date: '', time: '', type: 'VIRTUAL', location: '', notes: '' });
            toast?.success("Entrevista programada");
            loadData();
        } catch (error) {
            toast?.error("Error al programar entrevista");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEvaluate = async (e) => {
        e.preventDefault();
        if (!evaData.comments.trim()) {
            toast?.error("Los comentarios son obligatorios");
            return;
        }
        try {
            setSubmitting(true);
            await evaluateCandidate(id, evaData);
            setShowEvaModal(false);
            setEvaData({
                overallScore: 0,
                recommendation: 'MAYBE',
                comments: '',
                ratings: {
                    'Técnico': 0,
                    'Blandas': 0,
                    'Experiencia': 0,
                    'Ajuste Cultural': 0,
                    'Motivación': 0
                }
            });
            toast?.success("Evaluación registrada");
            loadData();
        } catch (error) {
            toast?.error("Error al registrar evaluación");
        } finally {
            setSubmitting(false);
        }
    };

    const handleHire = async (e) => {
        e.preventDefault();

        // Validar mayoría de edad (18 años)
        const birth = new Date(hireData.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        if (age < 18) {
            toast?.error("El candidato debe ser mayor de 18 años (Ley de Ecuador)");
            return;
        }

        if (!hireData.password || hireData.password.length < 8) {
            toast?.error("La contraseña debe tener al menos 8 caracteres");
            return;
        }

        if (!window.confirm("¿Estás seguro de contratar a este candidato? Se creará una cuenta de empleado.")) return;
        try {
            setSubmitting(true);
            await hireCandidate(id, hireData);
            setShowHireModal(false);
            toast?.success("Candidato Contratado Exitosamente");
            navigate('/recruitment');
        } catch (error) {
            toast?.error(error.response?.data?.message || "Error al contratar candidato");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-500 font-medium">Cargando detalles...</p>
        </div>
    );

    if (!app) return (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <FiInfo className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">Postulación no encontrada</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 font-bold">Volver atrás</button>
        </div>
    );

    const SERVER_URL = import.meta.env.VITE_API_URL || '/';

    const updateRating = (criteria, value) => {
        const newRatings = { ...evaData.ratings, [criteria]: parseInt(value) };
        const values = Object.values(newRatings);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        setEvaData({ ...evaData, ratings: newRatings, overallScore: avg.toFixed(1) });
    };

    const getStatusColor = (status) => {
        const colors = {
            'PENDING': 'bg-amber-50 text-amber-700 border-amber-100',
            'REVIEWING': 'bg-blue-50 text-blue-700 border-blue-100',
            'INTERVIEW': 'bg-purple-50 text-purple-700 border-purple-100',
            'TESTING': 'bg-indigo-50 text-indigo-700 border-indigo-100',
            'OFFER': 'bg-emerald-50 text-emerald-700 border-emerald-100',
            'HIRED': 'bg-blue-600 text-white border-blue-700',
            'REJECTED': 'bg-red-50 text-red-700 border-red-100'
        };
        return colors[status] || 'bg-slate-50 text-slate-700 border-slate-100';
    };

    const statusLabels = {
        'PENDING': 'Pendiente',
        'REVIEWING': 'En Revisión',
        'INTERVIEW': 'Entrevistas',
        'TESTING': 'Pruebas Técnicas',
        'OFFER': 'Oferta Enviada',
        'HIRED': 'Contratado',
        'REJECTED': 'Rechazado'
    };

    return (
        <div className="space-y-6 relative pb-12">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Profile Column */}
                <div className="lg:col-span-2 space-y-4">
                    <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-800 transition-colors text-xs font-medium cursor-pointer">
                        <FiArrowLeft className="mr-1.5" size={13} /> Volver al Listado
                    </button>

                    <div className="bg-white p-5 rounded border border-gray-200 text-xs space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-gray-100">
                            <div>
                                <div className="flex items-center gap-2.5 mb-1">
                                    <h1 className="text-lg font-semibold text-gray-900 leading-tight">
                                        {app.firstName} {app.lastName}
                                    </h1>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getStatusColor(app.status)}`}>
                                        {statusLabels[app.status] || app.status}
                                    </span>
                                </div>
                                <p className="text-blue-600 font-medium text-xs flex items-center">
                                    <FiBriefcase className="mr-1.5" size={13} /> {app.vacancy?.title}
                                </p>
                            </div>

                            <div className="flex gap-2 flex-wrap sm:justify-end w-full sm:w-auto">
                                <select
                                    value={app.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-700 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="PENDING">Pendiente</option>
                                    <option value="REVIEWING">En Revisión</option>
                                    <option value="INTERVIEW">Entrevista</option>
                                    <option value="TESTING">Pruebas Técnicas</option>
                                    <option value="OFFER">Oferta</option>
                                    <option value="HIRED">Contratado</option>
                                    <option value="REJECTED">Rechazado</option>
                                </select>

                                {app.status !== 'HIRED' && (
                                    <button
                                        onClick={() => setShowHireModal(true)}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                                    >
                                        <FiCheckCircle className="mr-1.5" size={13} /> Contratar
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(true)}
                                    className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded text-xs font-medium flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    <FiTrash2 className="mr-1.5" size={13} /> Eliminar
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600 py-2">
                            <div className="flex items-center cursor-pointer" onClick={() => { navigator.clipboard.writeText(app.email); toast?.success("Email copiado") }}>
                                <FiMail className="text-gray-400 mr-2 shrink-0" size={14} />
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Email</p>
                                    <p className="font-medium text-gray-800">{app.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <FiPhone className="text-gray-400 mr-2 shrink-0" size={14} />
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Teléfono</p>
                                    <p className="font-medium text-gray-800 font-mono">{app.phone}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-3.5 rounded border border-gray-200 space-y-1.5">
                            <h3 className="font-semibold text-gray-800 flex items-center text-xs">
                                <FiFileText className="mr-1.5 text-blue-600" size={13} /> Carta de Presentación
                            </h3>
                            <p className="text-gray-600 whitespace-pre-line leading-relaxed text-xs">
                                {app.coverLetter || "El candidato no incluyó una carta de presentación."}
                            </p>
                        </div>

                        {app.resumeUrl && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowPdfModal(true)}
                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded text-xs font-medium transition-colors shadow-xs cursor-pointer"
                                >
                                    <FiEye className="mr-1.5" size={13} /> Ver CV (PDF)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.open(getResumeUrl(app.resumeUrl), '_blank')}
                                    className="inline-flex items-center px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-50 rounded text-xs font-medium transition-colors border border-gray-300 cursor-pointer"
                                >
                                    <FiExternalLink className="mr-1.5" size={13} /> Abrir en nueva pestaña
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Timeline / Interviews Section */}
                    <div className="bg-white p-5 rounded border border-gray-200 text-xs space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 text-xs uppercase tracking-wider flex items-center">
                                <FiCalendar className="mr-1.5 text-blue-600" size={13} /> Entrevistas Programadas
                            </h3>
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium transition-colors cursor-pointer"
                            >
                                + Agendar
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            {app.interviews?.map(int => (
                                <div key={int.id} className="p-3 bg-gray-50 rounded border border-gray-200 space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-gray-900">
                                            {new Date(int.date).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </p>
                                        <div className="flex gap-2">
                                            <span className="font-mono text-[11px] text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                                                {new Date(int.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="text-[11px] font-medium text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                                                {int.type}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-500 truncate">{int.location}</p>
                                </div>
                            ))}
                            {app.interviews?.length === 0 && (
                                <div className="text-center py-6 bg-gray-50 rounded border border-dashed border-gray-200">
                                    <p className="text-gray-400">No hay entrevistas programadas.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Evaluations Section */}
                    <div className="bg-white p-5 rounded border border-gray-200 text-xs space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 text-xs uppercase tracking-wider flex items-center">
                                <FiStar className="mr-1.5 text-amber-500" size={13} /> Evaluaciones de Equipo
                            </h3>
                            <button
                                onClick={() => setShowEvaModal(true)}
                                className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium transition-colors cursor-pointer"
                            >
                                + Evaluar
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {app.evaluations?.map(eva => (
                                <div key={eva.id} className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">
                                                {eva.evaluator?.firstName[0]}{eva.evaluator?.lastName[0]}
                                            </div>
                                            <p className="font-medium text-gray-900 leading-tight">{eva.evaluator?.firstName} {eva.evaluator?.lastName}</p>
                                        </div>
                                        <span className="font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                            {eva.overallScore} <FiStar className="fill-current text-amber-500" size={12} />
                                        </span>
                                    </div>
                                    <p className="text-gray-600 italic leading-normal">"{eva.comments}"</p>
                                    <div className="pt-1.5 border-t border-gray-200 flex justify-between items-center text-[10px]">
                                        <span className={`font-mono font-medium px-1.5 py-0.5 rounded ${eva.recommendation === 'HIRE' ? 'bg-green-50 text-green-700 border border-green-200' : eva.recommendation === 'MAYBE' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                            {eva.recommendation}
                                        </span>
                                        <span className="text-gray-400 font-mono">{new Date(eva.createdAt).toLocaleDateString('es-EC')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {app.evaluations?.length === 0 && (
                            <div className="text-center py-6 bg-gray-50 rounded border border-dashed border-gray-200">
                                <p className="text-gray-400">Aún no se han registrado evaluaciones.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded border border-gray-200 h-[600px] flex flex-col sticky top-4 overflow-hidden text-xs">
                        <div className="p-3.5 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 text-xs uppercase tracking-wider flex items-center">
                                <FiMessageSquare className="mr-1.5 text-blue-600" size={13} /> Notas de Seguimiento
                            </h3>
                            <p className="text-gray-400 text-[11px] mt-0.5">Visibles únicamente para el equipo evaluador</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
                            {app.notes?.map(note => (
                                <div key={note.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{note.createdBy}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{new Date(note.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">{note.content}</p>
                                </div>
                            ))}
                            {app.notes?.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                    <FiInfo className="text-slate-200 mb-2" size={40} />
                                    <p className="text-slate-400 text-sm italic">Agrega una nota para comenzar el seguimiento.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-slate-100">
                            <form onSubmit={handleAddNote} className="relative">
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Escribe una observación interna..."
                                    className="w-full bg-slate-50 border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 min-h-[80px] resize-none shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!note.trim() || submitting}
                                    className="absolute right-3 bottom-3 p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-90"
                                >
                                    <FiSend />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interviews Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded p-5 max-w-md w-full border border-gray-200 shadow-xl text-xs space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <div>
                                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-900">Agendar Entrevista</h2>
                                <p className="text-[11px] text-gray-500">Programar sesión con {app.firstName} {app.lastName}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleSchedule} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Fecha</label>
                                    <input required type="date" className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-blue-500 font-mono" value={interviewData.date} onChange={e => setInterviewData({ ...interviewData, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Hora</label>
                                    <input required type="time" className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-blue-500 font-mono" value={interviewData.time} onChange={e => setInterviewData({ ...interviewData, time: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Modalidad</label>
                                <select className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-blue-500" value={interviewData.type} onChange={e => setInterviewData({ ...interviewData, type: e.target.value })}>
                                    <option value="VIRTUAL">Videollamada (Virtual)</option>
                                    <option value="PRESENTIAL">En Oficina (Presencial)</option>
                                    <option value="PHONE">Telefónica</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Ubicación o Enlace</label>
                                <input required type="text" placeholder="Ej: Meet, Teams o Sala 2B..." className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-blue-500" value={interviewData.location} onChange={e => setInterviewData({ ...interviewData, location: e.target.value })} />
                            </div>
                            <div className="flex justify-end pt-3 border-t border-gray-100 gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded font-medium transition-colors">Cancelar</button>
                                <button type="submit" disabled={submitting} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors shadow-xs">
                                    {submitting ? 'Guardando...' : 'Confirmar Entrevista'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Evaluation Modal */}
            {showEvaModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded p-5 max-w-lg w-full border border-gray-200 shadow-xl overflow-y-auto max-h-[90vh] text-xs space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <div>
                                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-900">Evaluación de Candidato</h2>
                                <p className="text-[11px] text-gray-500">Puntaje técnico y recomendación de contratación</p>
                            </div>
                            <button onClick={() => setShowEvaModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleEvaluate} className="space-y-4">
                            <div className="space-y-2.5">
                                <h3 className="font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Criterios de Evaluación (1-5)</h3>
                                {Object.keys(evaData.ratings).map(criterion => (
                                    <div key={criterion} className="flex justify-between items-center p-2.5 bg-gray-50 rounded border border-gray-200">
                                        <label className="text-gray-800 font-medium capitalize">{criterion}</label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => updateRating(criterion, star)}
                                                    className={`p-1.5 rounded transition-colors cursor-pointer ${evaData.ratings[criterion] >= star ? 'bg-amber-400 text-white' : 'bg-white text-gray-300 border border-gray-200 hover:border-amber-300'}`}
                                                >
                                                    <FiStar size={13} fill={evaData.ratings[criterion] >= star ? "currentColor" : "none"} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center bg-gray-900 p-3 rounded text-white font-mono">
                                <span className="text-xs uppercase tracking-wider">Promedio General</span>
                                <span className="text-lg font-bold text-amber-400">
                                    {evaData.overallScore} / 5.0
                                </span>
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Comentarios y Observaciones</label>
                                <textarea required placeholder="Observaciones técnicas sobre el desempeño del candidato..." className="w-full bg-white border border-gray-200 rounded p-2.5 text-gray-800 h-24 focus:outline-none focus:border-blue-500 resize-none" value={evaData.comments} onChange={e => setEvaData({ ...evaData, comments: e.target.value })}></textarea>
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-2">Recomendación Final</label>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() => setEvaData({ ...evaData, recommendation: 'HIRE' })}
                                        className={`p-2.5 rounded border transition-colors font-semibold cursor-pointer ${evaData.recommendation === 'HIRE' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        Contratar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEvaData({ ...evaData, recommendation: 'MAYBE' })}
                                        className={`p-2.5 rounded border transition-colors font-semibold cursor-pointer ${evaData.recommendation === 'MAYBE' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        En Duda
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEvaData({ ...evaData, recommendation: 'NO_HIRE' })}
                                        className={`p-2.5 rounded border transition-colors font-semibold cursor-pointer ${evaData.recommendation === 'NO_HIRE' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-3 border-t border-gray-100 gap-2">
                                <button type="button" onClick={() => setShowEvaModal(false)} className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded font-medium transition-colors">Cancelar</button>
                                <button type="submit" disabled={submitting} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors shadow-xs">
                                    {submitting ? 'Guardando...' : 'Guardar Evaluación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Hire Modal */}
            {showHireModal && (
                <div className="app-modal-overlay">
                    <div className="bg-white rounded border border-gray-200 shadow-xl max-w-lg w-full overflow-hidden animate-scale-in">
                        <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                    <FiBriefcase className="text-blue-600" /> Vincular a la Empresa
                                </h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">Contratación formal de {app.firstName} {app.lastName}</p>
                            </div>
                            <button onClick={() => setShowHireModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={16} /></button>
                        </div>

                        <form onSubmit={handleHire} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-gray-700">
                                <span className="font-semibold text-blue-900 block text-[11px]">Activación de Cuenta</span>
                                <p className="text-[11px] text-blue-800 mt-0.5">La cuenta de colaborador se activará inmediatamente en el sistema.</p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Cédula / Identificación Personal</label>
                                    <input required type="text" className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-gray-800 font-mono focus:outline-none focus:border-blue-500" value={hireData.identityCard} onChange={e => setHireData({ ...hireData, identityCard: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                                        <input required type="date" className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-gray-800 focus:outline-none focus:border-blue-500" value={hireData.birthDate} onChange={e => setHireData({ ...hireData, birthDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-1">Fecha de Inicio Laboral</label>
                                        <input required type="date" className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-gray-800 focus:outline-none focus:border-blue-500" value={hireData.startDate} onChange={e => setHireData({ ...hireData, startDate: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Dirección de Domicilio</label>
                                    <input required type="text" className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-gray-800 focus:outline-none focus:border-blue-500" value={hireData.address} onChange={e => setHireData({ ...hireData, address: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-1">Estado Civil</label>
                                        <select className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-gray-800 focus:outline-none focus:border-blue-500" value={hireData.civilStatus} onChange={e => setHireData({ ...hireData, civilStatus: e.target.value })}>
                                            <option>Soltero/a</option>
                                            <option>Casado/a</option>
                                            <option>Divorciado/a</option>
                                            <option>Unión Libre</option>
                                            <option>Viudo/a</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                                        <select className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-gray-800 focus:outline-none focus:border-blue-500" value={hireData.contractType} onChange={e => setHireData({ ...hireData, contractType: e.target.value })}>
                                            <option>Indefinido</option>
                                            <option>Plazo Fijo</option>
                                            <option>Servicios Prof.</option>
                                            <option>Por Obra</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Remuneración Mensual (Bruto USD)</label>
                                    <input required type="number" step="0.01" className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-gray-800 font-mono focus:outline-none focus:border-blue-500" value={hireData.salary} onChange={e => setHireData({ ...hireData, salary: e.target.value })} />
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Contraseña Inicial</label>
                                    <input required type="password" placeholder="Mínimo 8 caracteres" className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-gray-800 focus:outline-none focus:border-blue-500" value={hireData.password} onChange={e => setHireData({ ...hireData, password: e.target.value })} />
                                </div>

                                <div className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center gap-3 cursor-pointer select-none" onClick={() => setHireData({ ...hireData, closeVacancy: !hireData.closeVacancy })}>
                                    <input type="checkbox" checked={hireData.closeVacancy} onChange={() => {}} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    <p className="text-gray-700 text-xs font-medium">Finalizar esta vacante automáticamente</p>
                                </div>

                                <div className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center gap-3 cursor-pointer select-none" onClick={() => setHireData({ ...hireData, sendEmail: !hireData.sendEmail })}>
                                    <input type="checkbox" checked={hireData.sendEmail} onChange={() => {}} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    <p className="text-gray-700 text-xs font-medium">Enviar email de bienvenida automáticamente</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-3 gap-2 border-t border-gray-200">
                                <button type="button" onClick={() => setShowHireModal(false)} className="px-3.5 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={submitting} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors shadow-xs">
                                    {submitting ? 'Formalizando...' : 'Completar Contratación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Eliminación de Candidato */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded p-5 max-w-md w-full shadow-xl border border-gray-200 text-xs space-y-3.5">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                            <FiAlertTriangle className="text-red-600 w-5 h-5 shrink-0" />
                            <div>
                                <h3 className="font-semibold text-gray-900 text-sm">¿Eliminar candidato?</h3>
                                <p className="text-[11px] text-gray-500">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            Se eliminará permanentemente la postulación de <strong className="text-gray-900">{app?.firstName} {app?.lastName}</strong> y todos sus archivos de currículum adjuntos.
                        </p>
                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deletingCandidate}
                                className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteCandidate}
                                disabled={deletingCandidate}
                                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors shadow-xs disabled:opacity-50"
                            >
                                {deletingCandidate ? "Eliminando..." : "Eliminar Definitivamente"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Previsualización de CV en PDF dentro del sistema */}
            {showPdfModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded w-full max-w-5xl h-[90vh] flex flex-col shadow-xl overflow-hidden border border-gray-200 text-xs">
                        {/* Header del Modal */}
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center shrink-0">
                            <div className="flex items-center space-x-2.5">
                                <FiFileText className="text-blue-600 w-4 h-4" />
                                <div>
                                    <h3 className="font-semibold text-xs text-gray-900 uppercase tracking-wider">
                                        Currículum — {app?.firstName} {app?.lastName}
                                    </h3>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => window.open(getResumeUrl(app.resumeUrl), '_blank')}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <FiExternalLink size={12} /> Abrir en Pestaña
                                </button>
                                <button
                                    onClick={() => setShowPdfModal(false)}
                                    className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                                    title="Cerrar"
                                >
                                    <FiX size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Viewer Body */}
                        <div className="flex-1 bg-gray-100 p-2 overflow-hidden relative">
                            <iframe
                                src={getResumeUrl(app.resumeUrl)}
                                className="w-full h-full rounded border border-gray-200 bg-white"
                                title={`CV - ${app?.firstName} ${app?.lastName}`}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationDetails;
