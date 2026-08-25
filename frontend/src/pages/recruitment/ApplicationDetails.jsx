import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationDetails, updateApplicationStatus, deleteApplication, addApplicationNote, scheduleInterview, evaluateCandidate, hireCandidate } from '../../services/recruitment.service';
import { FiArrowLeft, FiMail, FiPhone, FiCalendar, FiFileText, FiTrash2, FiEye, FiExternalLink, FiSend, FiStar, FiCheckCircle, FiCopy, FiCheck, FiDownload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const PIPELINE_STAGES = [
    { key: 'PENDING', label: '1. Postulado' },
    { key: 'REVIEWING', label: '2. Revisión' },
    { key: 'INTERVIEW', label: '3. Entrevistas' },
    { key: 'TESTING', label: '4. Pruebas' },
    { key: 'OFFER', label: '5. Oferta' },
    { key: 'HIRED', label: '6. Contratado' }
];

const ApplicationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedPhone, setCopiedPhone] = useState(false);

    // Modals State
    const [showModal, setShowModal] = useState(false); // Interview
    const [showEvaModal, setShowEvaModal] = useState(false); // Evaluation
    const [showHireModal, setShowHireModal] = useState(false); // Hire
    const [showDeleteModal, setShowDeleteModal] = useState(false); // Delete candidate
    const [showPdfModal, setShowPdfModal] = useState(false); // View PDF Modal
    const [deletingCandidate, setDeletingCandidate] = useState(false);

    const [interviewData, setInterviewData] = useState({ date: '', time: '', type: 'VIRTUAL', location: '', notes: '' });
    const [evaData, setEvaData] = useState({
        overallScore: '4.5',
        recommendation: 'HIRE',
        comments: '',
        ratings: {
            'Competencia Técnica': 5,
            'Habilidades Blandas': 4,
            'Experiencia Laboral': 4,
            'Ajuste a la Cultura': 5,
            'Motivación e Interés': 5
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
        startDate: new Date().toISOString().split('T')[0],
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
            if (data?.salary) {
                setHireData(prev => ({ ...prev, salary: data.salary }));
            }
        } catch (error) {
            console.error('Error al cargar postulación:', error);
            toast.error('Error al cargar los detalles de la postulación');
        } finally {
            setLoading(false);
        }
    };

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

    const handleStatusChange = async (newStatus) => {
        try {
            await updateApplicationStatus(id, newStatus, false);
            setApp(prev => ({ ...prev, status: newStatus }));
            toast.success('Etapa del proceso actualizada');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al actualizar estado');
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!note.trim()) return;
        try {
            setSubmitting(true);
            const newNote = await addApplicationNote(id, note.trim());
            setApp(prev => ({
                ...prev,
                notes: [newNote, ...(prev.notes || [])]
            }));
            setNote('');
            toast.success('Nota de seguimiento registrada');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al guardar la nota');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const dateTime = new Date(`${interviewData.date}T${interviewData.time}`);
            const created = await scheduleInterview(id, { ...interviewData, date: dateTime.toISOString() });
            setApp(prev => ({
                ...prev,
                status: prev.status === 'PENDING' ? 'INTERVIEW' : prev.status,
                interviews: [created, ...(prev.interviews || [])]
            }));
            setShowModal(false);
            setInterviewData({ date: '', time: '', type: 'VIRTUAL', location: '', notes: '' });
            toast.success('Entrevista agendada exitosamente');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al agendar entrevista');
        } finally {
            setSubmitting(false);
        }
    };

    const updateRating = (criterion, star) => {
        const updated = { ...evaData.ratings, [criterion]: star };
        const values = Object.values(updated);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        setEvaData({
            ...evaData,
            ratings: updated,
            overallScore: avg.toFixed(1)
        });
    };

    const handleEvaluate = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const created = await evaluateCandidate(id, {
                ...evaData,
                overallScore: parseFloat(evaData.overallScore) * 20 // 1-5 a 0-100
            });
            setApp(prev => ({
                ...prev,
                evaluations: [created, ...(prev.evaluations || [])]
            }));
            setShowEvaModal(false);
            toast.success('Evaluación de equipo registrada');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al registrar evaluación');
        } finally {
            setSubmitting(false);
        }
    };

    const handleHire = async (e) => {
        e.preventDefault();
        if (!hireData.identityCard || !hireData.salary || !hireData.password) {
            toast.error('Cédula, salario y contraseña son obligatorios');
            return;
        }
        try {
            setSubmitting(true);
            await hireCandidate(id, hireData);
            toast.success('¡Candidato contratado e incorporado a la nómina con éxito!');
            setShowHireModal(false);
            setApp(prev => ({ ...prev, status: 'HIRED' }));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al contratar candidato');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCandidate = async () => {
        try {
            setDeletingCandidate(true);
            await deleteApplication(id);
            toast.success('Candidato eliminado');
            navigate(app?.vacancyId ? `/recruitment/${app.vacancyId}` : '/recruitment');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al eliminar el candidato');
        } finally {
            setDeletingCandidate(false);
            setShowDeleteModal(false);
        }
    };

    const copyText = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'email') {
            setCopiedEmail(true);
            setTimeout(() => setCopiedEmail(false), 2000);
        } else {
            setCopiedPhone(true);
            setTimeout(() => setCopiedPhone(false), 2000);
        }
        toast.success('Copiado al portapapeles');
    };

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">Cargando expediente del postulante...</p>
            </div>
        );
    }

    if (!app) {
        return (
            <div className="bg-white border border-gray-200 rounded p-12 text-center text-gray-400">
                <p className="text-sm font-medium text-gray-700">Postulación no encontrada</p>
                <button
                    onClick={() => navigate('/recruitment')}
                    className="mt-3 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                >
                    ← Volver a Reclutamiento
                </button>
            </div>
        );
    }

    const initials = `${app.firstName?.[0] || ''}${app.lastName?.[0] || ''}`.toUpperCase();
    const vacancyTitle = app.vacancy?.title || 'Vacante General';

    return (
        <div className="space-y-5">
            {/* Header ERP */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-200">
                <div>
                    <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <button
                            onClick={() => navigate(app.vacancyId ? `/recruitment/${app.vacancyId}` : '/recruitment')}
                            className="hover:text-gray-900 transition-colors flex items-center gap-1 text-gray-600 cursor-pointer"
                        >
                            <FiArrowLeft size={12} /> {app.vacancy?.title || 'Volver al Proceso'}
                        </button>
                        <span>·</span>
                        <span>Expediente de Candidato</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-gray-100 border border-gray-200 text-gray-800 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                            {initials}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">
                                {app.firstName} {app.lastName}
                            </h1>
                            <p className="text-xs text-gray-500 mt-1">
                                Postulación recibida el <span className="font-mono tabular-nums font-medium text-gray-700">{new Date(app.createdAt).toLocaleDateString('es-EC')}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    <select
                        value={app.status}
                        onChange={e => handleStatusChange(e.target.value)}
                        className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                        <option value="PENDING">Postulado</option>
                        <option value="REVIEWING">En Revisión</option>
                        <option value="INTERVIEW">Entrevistas</option>
                        <option value="TESTING">Pruebas</option>
                        <option value="OFFER">Oferta Enviada</option>
                        <option value="HIRED">Contratado</option>
                        <option value="REJECTED">Descartado</option>
                    </select>

                    <button
                        onClick={() => setShowModal(true)}
                        className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <FiCalendar size={13} />
                        <span>Agendar</span>
                    </button>

                    <button
                        onClick={() => setShowEvaModal(true)}
                        className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <FiStar size={13} />
                        <span>Evaluar</span>
                    </button>

                    {app.status !== 'HIRED' ? (
                        <button
                            onClick={() => setShowHireModal(true)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                            <FiCheckCircle size={13} />
                            <span>Contratar</span>
                        </button>
                    ) : (
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold font-mono">
                            ✓ Empleado Activo
                        </span>
                    )}

                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar candidato"
                    >
                        <FiTrash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Stepper Pipeline */}
            <div className="bg-white border border-gray-200 rounded p-3 overflow-x-auto custom-scrollbar">
                <div className="flex items-center justify-between min-w-[620px] gap-2">
                    {PIPELINE_STAGES.map((stage, idx) => {
                        const isCurrent = app.status === stage.key;
                        const isCompleted = PIPELINE_STAGES.findIndex(s => s.key === app.status) >= idx;

                        return (
                            <button
                                key={stage.key}
                                onClick={() => handleStatusChange(stage.key)}
                                className={`flex-1 py-1.5 px-2 rounded text-xs font-medium text-center border transition-colors cursor-pointer ${
                                    isCurrent
                                        ? 'bg-blue-50 text-blue-800 border-blue-300 font-semibold'
                                        : isCompleted
                                        ? 'bg-gray-50 text-gray-700 border-gray-200'
                                        : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                                }`}
                            >
                                {stage.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left 2 Cols: Profile, Cover Letter, CV, Interviews & Evaluations */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Contact & Overview Card */}
                    <div className="bg-white border border-gray-200 rounded p-4 text-xs space-y-3">
                        <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Información de Contacto y Perfil
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] uppercase font-semibold text-gray-400">Correo Electrónico</div>
                                    <div className="text-gray-900 font-medium mt-0.5">{app.email}</div>
                                </div>
                                <button
                                    onClick={() => copyText(app.email, 'email')}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded transition-colors"
                                    title="Copiar email"
                                >
                                    {copiedEmail ? <FiCheck className="text-emerald-600" size={13} /> : <FiCopy size={13} />}
                                </button>
                            </div>

                            <div className="p-3 bg-gray-50 border border-gray-200 rounded flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] uppercase font-semibold text-gray-400">Teléfono / WhatsApp</div>
                                    <div className="text-gray-900 font-mono font-medium mt-0.5 tabular-nums">{app.phone || 'No registrado'}</div>
                                </div>
                                {app.phone && (
                                    <button
                                        onClick={() => copyText(app.phone, 'phone')}
                                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded transition-colors"
                                        title="Copiar teléfono"
                                    >
                                        {copiedPhone ? <FiCheck className="text-emerald-600" size={13} /> : <FiCopy size={13} />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Carta de Presentación */}
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
                            <div className="text-[10px] uppercase font-semibold text-gray-400 flex items-center gap-1">
                                <FiFileText size={12} /> Carta de Presentación / Mensaje
                            </div>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-xs">
                                {app.coverLetter || 'El postulante no adjuntó carta de presentación formal.'}
                            </p>
                        </div>

                        {/* CV Document Action Bar */}
                        {app.resumeUrl && (
                            <div className="pt-2 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-red-50 text-red-700 border border-red-200 font-mono font-bold text-[10px] flex items-center justify-center">
                                        PDF
                                    </div>
                                    <span className="text-xs font-medium text-gray-800">Currículum Vitae Adjunto</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowPdfModal(true)}
                                        className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                        <FiEye size={12} />
                                        <span>Visualizar</span>
                                    </button>
                                    <button
                                        onClick={() => window.open(getResumeUrl(app.resumeUrl), '_blank')}
                                        className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                        <FiExternalLink size={12} />
                                        <span>Abrir en Pestaña</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Entrevistas Programadas */}
                    <div className="bg-white border border-gray-200 rounded p-4 text-xs space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <FiCalendar size={13} /> Entrevistas y Sesiones ({app.interviews?.length || 0})
                            </h2>
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium transition-colors cursor-pointer"
                            >
                                + Nueva Entrevista
                            </button>
                        </div>

                        {app.interviews && app.interviews.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {app.interviews.map(int => (
                                    <div key={int.id} className="py-2.5 flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                <span>{int.type === 'VIRTUAL' ? 'Videollamada' : int.type === 'PRESENTIAL' ? 'Presencial' : 'Telefónica'}</span>
                                                <span className="font-mono text-[11px] text-gray-500 font-normal">
                                                    {new Date(int.date).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })} · {new Date(int.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-gray-500 mt-0.5">
                                                Ubicación / Enlace: <span className="text-gray-700 font-mono">{int.location || 'Por definir'}</span>
                                            </div>
                                            {int.notes && (
                                                <div className="text-[11px] text-gray-600 mt-1 italic">
                                                    "{int.notes}"
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-mono text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200 shrink-0">
                                            {int.status || 'PROGRAMADA'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-gray-400 bg-gray-50/50 rounded border border-dashed border-gray-200">
                                No se han registrado entrevistas con este candidato.
                            </div>
                        )}
                    </div>

                    {/* Evaluaciones de Equipo (Scorecard) */}
                    <div className="bg-white border border-gray-200 rounded p-4 text-xs space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <FiStar size={13} /> Evaluaciones de Selección ({app.evaluations?.length || 0})
                            </h2>
                            <button
                                onClick={() => setShowEvaModal(true)}
                                className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium transition-colors cursor-pointer"
                            >
                                + Evaluar Candidato
                            </button>
                        </div>

                        {app.evaluations && app.evaluations.length > 0 ? (
                            <div className="space-y-3">
                                {app.evaluations.map(eva => {
                                    const parsedRatings = typeof eva.ratings === 'string' ? JSON.parse(eva.ratings) : eva.ratings || {};

                                    return (
                                        <div key={eva.id} className="p-3 bg-gray-50 border border-gray-200 rounded space-y-2">
                                            <div className="flex justify-between items-center">
                                                <div className="font-medium text-gray-900">
                                                    Evaluador: <span className="font-semibold">{eva.evaluator?.firstName || 'Equipo'} {eva.evaluator?.lastName || 'RRHH'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 font-mono">
                                                    <span className="text-xs font-bold text-gray-900">
                                                        {eva.overallScore}/100 pts
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                        eva.recommendation === 'HIRE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                                        eva.recommendation === 'MAYBE' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                                        'bg-red-50 text-red-800 border border-red-200'
                                                    }`}>
                                                        {eva.recommendation === 'HIRE' ? 'RECOMENDADO' : eva.recommendation === 'MAYBE' ? 'EN DUDA' : 'NO CONTRATAR'}
                                                    </span>
                                                </div>
                                            </div>

                                            {Object.keys(parsedRatings).length > 0 && (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-gray-200/60 text-[11px]">
                                                    {Object.entries(parsedRatings).map(([crit, val]) => (
                                                        <div key={crit} className="flex justify-between bg-white px-2 py-1 rounded border border-gray-200">
                                                            <span className="text-gray-600 truncate">{crit}</span>
                                                            <span className="font-mono font-bold text-gray-900">{val}/5</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {eva.comments && (
                                                <p className="text-gray-700 italic text-[11px] pt-1 leading-relaxed">
                                                    "{eva.comments}"
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-gray-400 bg-gray-50/50 rounded border border-dashed border-gray-200">
                                Aún no se han completado evaluaciones técnicas o psicométricas para este postulante.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right 1 Col: Team Notes & Internal Activity */}
                <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded flex flex-col h-[540px] text-xs">
                        <div className="p-3 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">
                                Notas de Seguimiento Interno
                            </h3>
                            <p className="text-gray-400 text-[11px] mt-0.5">Visibles únicamente para el equipo de selección</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-gray-50/30">
                            {app.notes && app.notes.length > 0 ? (
                                app.notes.map(n => (
                                    <div key={n.id} className="p-2.5 bg-white border border-gray-200 rounded space-y-1">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="font-semibold text-gray-800">{n.createdBy || 'Sistema'}</span>
                                            <span className="font-mono text-gray-400">{new Date(n.createdAt).toLocaleDateString('es-EC')}</span>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed text-xs">{n.content}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                                    <p className="text-xs">Sin observaciones registradas.</p>
                                    <p className="text-[11px] text-gray-400 mt-1">Escribe abajo para dejar notas sobre el candidato.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-white border-t border-gray-200">
                            <form onSubmit={handleAddNote} className="space-y-2">
                                <textarea
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Escribir observación interna sobre la entrevista o perfil..."
                                    className="w-full bg-white border border-gray-200 rounded p-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500 h-16 resize-none"
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={!note.trim() || submitting}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                    >
                                        <FiSend size={11} />
                                        <span>{submitting ? 'Guardando...' : 'Añadir Nota'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Agendar Entrevista */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded max-w-md w-full shadow-xl border border-gray-200 text-xs">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 text-sm">Agendar Entrevista</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">Programar sesión con {app.firstName} {app.lastName}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleSchedule} className="p-5 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                                    <input
                                        required
                                        type="date"
                                        value={interviewData.date}
                                        onChange={e => setInterviewData({ ...interviewData, date: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Hora</label>
                                    <input
                                        required
                                        type="time"
                                        value={interviewData.time}
                                        onChange={e => setInterviewData({ ...interviewData, time: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Modalidad</label>
                                <select
                                    value={interviewData.type}
                                    onChange={e => setInterviewData({ ...interviewData, type: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="VIRTUAL">Videollamada (Google Meet / Zoom)</option>
                                    <option value="PRESENTIAL">Presencial en Oficinas</option>
                                    <option value="PHONE">Llamada Telefónica</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Ubicación o Enlace de Reunión</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej: https://meet.google.com/xyz o Sala de Juntas 2"
                                    value={interviewData.location}
                                    onChange={e => setInterviewData({ ...interviewData, location: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Notas Preparatorias (Opcional)</label>
                                <textarea
                                    placeholder="Puntos clave a evaluar en la sesión..."
                                    value={interviewData.notes}
                                    onChange={e => setInterviewData({ ...interviewData, notes: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded p-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500 h-16 resize-none"
                                />
                            </div>

                            <div className="px-0 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors shadow-xs disabled:opacity-50"
                                >
                                    {submitting ? 'Guardando...' : 'Confirmar Entrevista'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Evaluar Candidato */}
            {showEvaModal && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded max-w-lg w-full shadow-xl border border-gray-200 text-xs max-h-[90vh] overflow-y-auto">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                            <div>
                                <h3 className="font-semibold text-gray-900 text-sm">Evaluación de Selección</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">Puntuación de {app.firstName} {app.lastName}</p>
                            </div>
                            <button onClick={() => setShowEvaModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleEvaluate} className="p-5 space-y-4">
                            <div className="space-y-2.5">
                                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    Criterios de Evaluación (1 al 5)
                                </div>
                                {Object.keys(evaData.ratings).map(crit => (
                                    <div key={crit} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-200 rounded">
                                        <span className="text-gray-700 font-medium">{crit}</span>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => updateRating(crit, star)}
                                                    className={`w-6 h-6 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                                                        evaData.ratings[crit] >= star
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white border border-gray-200 text-gray-400 hover:border-gray-300'
                                                    }`}
                                                >
                                                    {star}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-3 bg-gray-50 border border-gray-200 rounded flex justify-between items-center">
                                <span className="font-medium text-gray-700">Promedio General</span>
                                <span className="font-mono text-base font-bold text-blue-700 tabular-nums">
                                    {evaData.overallScore} / 5.0
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones Finales</label>
                                <textarea
                                    required
                                    placeholder="Detalles sobre fortalezas, debilidades y ajuste al puesto..."
                                    value={evaData.comments}
                                    onChange={e => setEvaData({ ...evaData, comments: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded p-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500 h-20 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Recomendación del Evaluador</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { key: 'HIRE', label: 'Recomendar' },
                                        { key: 'MAYBE', label: 'En Duda' },
                                        { key: 'NO_HIRE', label: 'Descartar' }
                                    ].map(opt => (
                                        <button
                                            key={opt.key}
                                            type="button"
                                            onClick={() => setEvaData({ ...evaData, recommendation: opt.key })}
                                            className={`py-2 px-2 rounded text-xs font-medium border text-center transition-colors cursor-pointer ${
                                                evaData.recommendation === opt.key
                                                    ? 'border-gray-900 bg-gray-900 text-white font-semibold'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEvaModal(false)}
                                    className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors shadow-xs disabled:opacity-50"
                                >
                                    {submitting ? 'Guardando...' : 'Guardar Evaluación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Contratar (Onboarding a Nómina) */}
            {showHireModal && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded max-w-lg w-full shadow-xl border border-gray-200 text-xs max-h-[90vh] overflow-y-auto">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                            <div>
                                <h3 className="font-semibold text-gray-900 text-sm">Contratación e Incorporación a Nómina</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">Crear ficha de colaborador para {app.firstName} {app.lastName}</p>
                            </div>
                            <button onClick={() => setShowHireModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleHire} className="p-5 space-y-3.5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Cédula de Identidad *</label>
                                    <input
                                        required
                                        type="text"
                                        maxLength={10}
                                        placeholder="17xxxxxxxx"
                                        value={hireData.identityCard}
                                        onChange={e => setHireData({ ...hireData, identityCard: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Salario Mensual (USD) *</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        placeholder="Ej: 1200.00"
                                        value={hireData.salary}
                                        onChange={e => setHireData({ ...hireData, salary: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 font-mono tabular-nums"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Contrato</label>
                                    <select
                                        value={hireData.contractType}
                                        onChange={e => setHireData({ ...hireData, contractType: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="Indefinido">Indefinido con periodo de prueba</option>
                                        <option value="Eventual">Eventual / Obra cierta</option>
                                        <option value="Plazo Fijo">Plazo Fijo</option>
                                        <option value="Pasantía">Pasantía / Formativo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de Ingreso *</label>
                                    <input
                                        required
                                        type="date"
                                        value={hireData.startDate}
                                        onChange={e => setHireData({ ...hireData, startDate: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña Inicial de Acceso al Portal *</label>
                                <input
                                    required
                                    type="password"
                                    placeholder="Mínimo 8 caracteres..."
                                    value={hireData.password}
                                    onChange={e => setHireData({ ...hireData, password: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-600 text-[11px] leading-relaxed">
                                Al confirmar, el postulante será dado de alta como colaborador en el departamento de <strong className="text-gray-900">{app.vacancy?.department}</strong> y se creará su usuario para el portal de autoservicio y nómina.
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowHireModal(false)}
                                    className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors shadow-xs disabled:opacity-50"
                                >
                                    {submitting ? 'Procesando Contrato...' : 'Confirmar Contratación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Visualizador PDF Integrado */}
            {showPdfModal && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded max-w-4xl w-full h-[85vh] shadow-xl border border-gray-200 text-xs flex flex-col">
                        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                            <div className="font-semibold text-gray-900 text-xs">
                                Currículum Vitae — {app.firstName} {app.lastName}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.open(getResumeUrl(app.resumeUrl), '_blank')}
                                    className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                                >
                                    <FiExternalLink size={12} /> Abrir Externo
                                </button>
                                <button onClick={() => setShowPdfModal(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">✕</button>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-100 p-2">
                            <iframe
                                src={getResumeUrl(app.resumeUrl)}
                                title="Visor CV"
                                className="w-full h-full border border-gray-300 rounded bg-white"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Eliminar Candidato */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded max-w-md w-full shadow-xl border border-gray-200 text-xs">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 text-sm">¿Eliminar candidato?</h3>
                            <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-5 space-y-2 text-gray-600 leading-relaxed">
                            <p>
                                Se eliminará la postulación de <strong className="text-gray-900">{app.firstName} {app.lastName}</strong> y todos sus archivos asociados.
                            </p>
                        </div>
                        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
                            <button
                                disabled={deletingCandidate}
                                onClick={() => setShowDeleteModal(false)}
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationDetails;
