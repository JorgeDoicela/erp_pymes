import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationDetails, updateApplicationStatus, addApplicationNote, scheduleInterview, evaluateCandidate, hireCandidate } from '../../services/recruitment.service';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiDownload, FiMessageSquare, FiSend, FiCalendar, FiMapPin, FiStar, FiCheckCircle, FiXCircle, FiBriefcase, FiFileText, FiInfo, FiClock } from 'react-icons/fi';
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
                <div className="lg:col-span-2 space-y-6">
                    <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium">
                        <FiArrowLeft className="mr-2" /> Volver al Listado
                    </button>

                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 z-0 opacity-50"></div>

                        <div className="relative z-10">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                                            {app.firstName} {app.lastName}
                                        </h1>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(app.status)}`}>
                                            {statusLabels[app.status] || app.status}
                                        </span>
                                    </div>
                                    <p className="text-blue-600 text-lg md:text-xl font-semibold flex items-center">
                                        <FiBriefcase className="mr-2" /> {app.vacancy?.title}
                                    </p>
                                </div>

                                <div className="flex gap-2 flex-wrap sm:justify-end w-full sm:w-auto">
                                    <select
                                        value={app.status}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        className="flex-1 sm:flex-none bg-slate-100 border-slate-200 rounded-xl p-2.5 text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-slate-200 transition-all text-sm shadow-sm"
                                    >
                                        <option value="PENDING">Marcar Pendiente</option>
                                        <option value="REVIEWING">En Revisión</option>
                                        <option value="INTERVIEW">Fase de Entrevistas</option>
                                        <option value="TESTING">Pruebas Técnicas</option>
                                        <option value="OFFER">Enviar Oferta</option>
                                        <option value="HIRED">Contratado</option>
                                        <option value="REJECTED">Rechazado</option>
                                    </select>

                                    {app.status !== 'HIRED' && (
                                        <button
                                            onClick={() => setShowHireModal(true)}
                                            className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all text-sm active:scale-95"
                                        >
                                            <FiCheckCircle className="mr-2" /> Contratar Ahora
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-slate-600 mb-8 border-y border-slate-100 py-6">
                                <div className="flex items-center group cursor-copy" onClick={() => { navigator.clipboard.writeText(app.email); toast?.success("Email copiado") }}>
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-blue-50 transition-colors">
                                        <FiMail className="text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Email</p>
                                        <p className="font-semibold text-slate-800 truncate">{app.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mr-3">
                                        <FiPhone className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Teléfono</p>
                                        <p className="font-semibold text-slate-800">{app.phone}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                                <h3 className="font-bold mb-4 text-slate-800 flex items-center text-lg">
                                    <FiFileText className="mr-2 text-blue-500" /> Carta de Presentación
                                </h3>
                                <p className="text-slate-600 whitespace-pre-line leading-relaxed text-base">
                                    {app.coverLetter || "El candidato no incluyó una carta de presentación."}
                                </p>
                            </div>

                            {app.resumeUrl && (
                                <button
                                    onClick={() => {
                                        const token = localStorage.getItem('token');
                                        const baseUrl = SERVER_URL.endsWith('/') ? SERVER_URL.slice(0, -1) : SERVER_URL;
                                        const resumePath = app.resumeUrl.startsWith('/') ? app.resumeUrl : `/${app.resumeUrl}`;
                                        const finalUrl = `${baseUrl}${resumePath}?token=${token}`;
                                        window.open(finalUrl, '_blank');
                                    }}
                                    className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold transition-all shadow-xl shadow-blue-100 active:scale-95"
                                >
                                    <FiDownload className="mr-2" /> Descargar CV (PDF)
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Timeline / Interviews Section */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center">
                                <FiCalendar className="mr-2 text-purple-600" /> Próximas Entrevistas
                            </h3>
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-5 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold text-sm transition-all border border-purple-100"
                            >
                                + Agendar
                            </button>
                        </div>

                        <div className="space-y-4">
                            {app.interviews?.map(int => (
                                <div key={int.id} className="group relative pl-8 pb-4">
                                    {/* Timeline connector */}
                                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-100 group-last:bottom-auto group-last:h-4"></div>
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-purple-500 flex items-center justify-center z-10">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    </div>

                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 group-hover:border-purple-300 transition-all group-hover:shadow-md">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div>
                                                <p className="font-extrabold text-slate-800 text-lg">
                                                    {new Date(int.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="flex items-center text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                                                        <FiClock className="mr-1.5" /> {new Date(int.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="flex items-center text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                                                        <FiMapPin className="mr-1.5" /> {int.type}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right w-full md:w-auto">
                                                <p className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{int.location}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {app.interviews?.length === 0 && (
                                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                    <p className="text-slate-400 font-medium">No hay entrevistas programadas.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Evaluations Section */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center">
                                <FiStar className="mr-2 text-yellow-500" /> Evaluaciones de Equipo
                            </h3>
                            <button
                                onClick={() => setShowEvaModal(true)}
                                className="px-5 py-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-xl font-bold text-sm transition-all border border-yellow-100"
                            >
                                + Evaluar Candidato
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {app.evaluations?.map(eva => (
                                <div key={eva.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-lg transition-all relative group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-600 font-bold">
                                                {eva.evaluator?.firstName[0]}{eva.evaluator?.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 leading-tight">{eva.evaluator?.firstName} {eva.evaluator?.lastName}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Evaluador</p>
                                            </div>
                                        </div>
                                        <span className="text-lg font-black text-yellow-600 bg-yellow-50 px-3 py-1 rounded-xl border border-yellow-100 flex items-center gap-1.5 shadow-sm">
                                            {eva.overallScore} <FiStar className="fill-current text-yellow-500" size={16} />
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <FiMessageSquare className="absolute top-0 left-0 text-slate-100 -mt-2 -ml-2" size={32} />
                                        <p className="text-slate-600 italic text-sm relative z-10 pl-2">"{eva.comments}"</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${eva.recommendation === 'HIRE' ? 'bg-emerald-50 text-emerald-600' : eva.recommendation === 'MAYBE' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                                            REC: {eva.recommendation}
                                        </span>
                                        <span className="text-[10px] text-slate-300">{new Date(eva.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {app.evaluations?.length === 0 && (
                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                <p className="text-slate-400 font-medium">Aún no se han registrado evaluaciones.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[600px] flex flex-col sticky top-6 overflow-hidden">
                        <div className="p-6 bg-slate-800 text-white">
                            <h3 className="text-lg font-bold flex items-center">
                                <FiMessageSquare className="mr-2 text-blue-400" /> Notas de Seguimiento
                            </h3>
                            <p className="text-slate-400 text-xs mt-1">Solo visible para el equipo interno</p>
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
                <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in transition-all">
                    <div className="bg-white p-8 rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl scale-in-center">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                                <FiCalendar size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Agendar Cita</h2>
                                <p className="text-slate-500 text-sm">Define el encuentro con el candidato</p>
                            </div>
                        </div>

                        <form onSubmit={handleSchedule} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Fecha</label>
                                    <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm" value={interviewData.date} onChange={e => setInterviewData({ ...interviewData, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Hora</label>
                                    <input required type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm" value={interviewData.time} onChange={e => setInterviewData({ ...interviewData, time: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Canal de Entrevista</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm font-bold" value={interviewData.type} onChange={e => setInterviewData({ ...interviewData, type: e.target.value })}>
                                    <option value="VIRTUAL">Videollamada (Virtual)</option>
                                    <option value="PRESENTIAL">En Oficina (Presencial)</option>
                                    <option value="PHONE">Llamada Telefónica</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ubicación o Enlace</label>
                                <div className="relative">
                                    <FiMapPin className="absolute left-3 top-3.5 text-slate-400" />
                                    <input required type="text" placeholder="Ej: Google Meet o Dirección..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 p-3 text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm" value={interviewData.location} onChange={e => setInterviewData({ ...interviewData, location: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-slate-500 hover:text-slate-800 font-bold transition-all">Cancelar</button>
                                <button type="submit" disabled={submitting} className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all flex items-center">
                                    {submitting ? 'Confirmando...' : 'Agendar Ahora'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Evaluation Modal */}
            {showEvaModal && (
                <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in transition-all">
                    <div className="bg-white p-8 rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-y-auto max-h-[90vh] scale-in-center">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center text-yellow-600">
                                <FiStar size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Evaluación de Talento</h2>
                                <p className="text-slate-500 text-sm">Registra tu impresión técnica y profesional</p>
                            </div>
                        </div>

                        <form onSubmit={handleEvaluate} className="space-y-8">
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Criterios de Selección (1-5)</h3>
                                {Object.keys(evaData.ratings).map(criterion => (
                                    <div key={criterion} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                        <label className="text-slate-700 font-extrabold capitalize text-base">{criterion}</label>
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => updateRating(criterion, star)}
                                                    className={`p-2 rounded-xl transition-all active:scale-90 ${evaData.ratings[criterion] >= star ? 'bg-yellow-400 text-white shadow-sm' : 'bg-white text-slate-200 border border-slate-100 hover:border-yellow-200'}`}
                                                >
                                                    <FiStar className="text-xl" fill={evaData.ratings[criterion] >= star ? "currentColor" : "none"} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl shadow-xl shadow-slate-200">
                                <span className="font-bold text-white uppercase tracking-widest text-xs">Puntuación Promedio</span>
                                <span className="text-4xl font-black text-yellow-400 flex items-baseline gap-1">
                                    {evaData.overallScore} <span className="text-xs text-slate-500 font-medium">/ 5.0</span>
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Comentarios Detallados</label>
                                <textarea required placeholder="Explica por qué has dado esta calificación..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 h-32 focus:ring-2 focus:ring-yellow-500 outline-none transition-all shadow-inner" value={evaData.comments} onChange={e => setEvaData({ ...evaData, comments: e.target.value })}></textarea>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Recomendación Final</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setEvaData({ ...evaData, recommendation: 'HIRE' })}
                                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all font-bold ${evaData.recommendation === 'HIRE' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-4 ring-emerald-50' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                    >
                                        <FiCheckCircle size={24} /> <span className="text-xs">CONTRATAR</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEvaData({ ...evaData, recommendation: 'MAYBE' })}
                                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all font-bold ${evaData.recommendation === 'MAYBE' ? 'bg-yellow-50 border-yellow-500 text-yellow-700 ring-4 ring-yellow-50' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                    >
                                        <FiStar size={24} /> <span className="text-xs">EN DUDA</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEvaData({ ...evaData, recommendation: 'NO_HIRE' })}
                                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all font-bold ${evaData.recommendation === 'NO_HIRE' ? 'bg-red-50 border-red-500 text-red-700 ring-4 ring-red-50' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                    >
                                        <FiXCircle size={24} /> <span className="text-xs">RECHAZAR</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 gap-3">
                                <button type="button" onClick={() => setShowEvaModal(false)} className="px-6 py-3 text-slate-400 hover:text-slate-800 font-bold transition-all">Omitir</button>
                                <button type="submit" disabled={submitting} className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center active:scale-95">
                                    {submitting ? 'Guardando...' : 'Finalizar Evaluación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Hire Modal */}
            {showHireModal && (
                <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in transition-all">
                    <div className="bg-white p-8 rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-y-auto max-h-[90vh] scale-in-center">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-100">
                                <FiBriefcase size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 leading-tight">Vincular a la Empresa</h2>
                                <p className="text-slate-500 font-medium">Contratación formal de {app.firstName}</p>
                            </div>
                        </div>

                        <div className="bg-blue-50/80 p-5 rounded-2xl mb-8 flex items-start gap-4 border border-blue-100/50">
                            <div className="w-8 h-8 rounded-full bg-blue-200 flex flex-shrink-0 items-center justify-center text-blue-700 font-bold text-sm">!</div>
                            <div>
                                <p className="text-blue-900 font-extrabold text-sm mb-1">Nota importante:</p>
                                <p className="text-blue-700 text-xs leading-relaxed font-medium">La cuenta de empleado se activará tras confirmar. La contraseña provisional será el número de cédula.</p>
                            </div>
                        </div>

                        <form onSubmit={handleHire} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Identificación Personal (Cédula)</label>
                                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-none" value={hireData.identityCard} onChange={e => setHireData({ ...hireData, identityCard: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">F. Nacimiento</label>
                                        <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm" value={hireData.birthDate} onChange={e => setHireData({ ...hireData, birthDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">F. Inicio Laboral</label>
                                        <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm" value={hireData.startDate} onChange={e => setHireData({ ...hireData, startDate: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Dirección de Domicilio</label>
                                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none transition-all" value={hireData.address} onChange={e => setHireData({ ...hireData, address: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Estado Civil</label>
                                        <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-800 font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all" value={hireData.civilStatus} onChange={e => setHireData({ ...hireData, civilStatus: e.target.value })}>
                                            <option>Soltero/a</option>
                                            <option>Casado/a</option>
                                            <option>Divorciado/a</option>
                                            <option>Unión Libre</option>
                                            <option>Viudo/a</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contrato</label>
                                        <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-800 font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all" value={hireData.contractType} onChange={e => setHireData({ ...hireData, contractType: e.target.value })}>
                                            <option>Indefinido</option>
                                            <option>Plazo Fijo</option>
                                            <option>Servicios Prof.</option>
                                            <option>Por Obra</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Remuneración Mensual (Bruto USD)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3.5 font-bold text-slate-400">$</span>
                                        <input required type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 p-3.5 text-slate-800 font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all" value={hireData.salary} onChange={e => setHireData({ ...hireData, salary: e.target.value })} />
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4 transition-all hover:border-blue-400 cursor-pointer select-none" onClick={() => setHireData({ ...hireData, closeVacancy: !hireData.closeVacancy })}>
                                    <div className={`w-6 h-6 rounded flex items-center justify-center transition-all border-2 ${hireData.closeVacancy ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200'}`}>
                                        {hireData.closeVacancy && <FiCheckCircle size={16} />}
                                    </div>
                                    <p className="text-slate-700 text-sm font-bold flex-1">Finalizar esta vacante automáticamente</p>
                                </div>

                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-4 transition-all hover:border-blue-400 cursor-pointer select-none" onClick={() => setHireData({ ...hireData, sendEmail: !hireData.sendEmail })}>
                                    <div className={`w-6 h-6 rounded flex items-center justify-center transition-all border-2 ${hireData.sendEmail ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200'}`}>
                                        {hireData.sendEmail && <FiCheckCircle size={16} />}
                                    </div>
                                    <p className="text-blue-700 text-sm font-bold flex-1">Enviar email de bienvenida automáticamente</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 gap-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowHireModal(false)} className="px-6 py-3 text-slate-400 hover:text-slate-800 font-bold transition-all">Cancelar</button>
                                <button type="submit" disabled={submitting} className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-2xl shadow-blue-200 transition-all flex items-center active:scale-95">
                                    {submitting ? 'Formalizando...' : 'Completar Contratación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationDetails;
