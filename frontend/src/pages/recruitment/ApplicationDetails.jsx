import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationDetails, updateApplicationStatus, addApplicationNote, scheduleInterview, evaluateCandidate } from '../../services/recruitment.service';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiDownload, FiMessageSquare, FiSend, FiCalendar, FiMapPin, FiStar, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const ApplicationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal State - Interview
    const [showModal, setShowModal] = useState(false);
    const [interviewData, setInterviewData] = useState({ date: '', time: '', type: 'VIRTUAL', location: '', notes: '' });

    // Modal State - Evaluation
    const [showEvaModal, setShowEvaModal] = useState(false);
    const [evaData, setEvaData] = useState({
        overallScore: 0,
        recommendation: 'MAYBE', // HIRE, NO_HIRE, MAYBE
        comments: '',
        ratings: { 'Tecnico': 0, 'Blandas': 0, 'Experiencia': 0 } // Default criteria
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const data = await getApplicationDetails(id);
            setApp(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await updateApplicationStatus(id, newStatus);
            loadData();
        } catch (error) {
            alert("Error al actualizar estado");
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!note.trim()) return;
        try {
            await addApplicationNote(id, note);
            setNote('');
            loadData();
        } catch (error) {
            alert("Error al agregar nota");
        }
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        try {
            const dateTime = new Date(`${interviewData.date}T${interviewData.time}`);
            await scheduleInterview(id, { ...interviewData, date: dateTime });
            setShowModal(false);
            setInterviewData({ date: '', time: '', type: 'VIRTUAL', location: '', notes: '' });
            alert("Entrevista programada");
            loadData();
        } catch (error) {
            alert("Error al programar entrevista");
        }
    };

    const handleEvaluate = async (e) => {
        e.preventDefault();
        try {
            await evaluateCandidate(id, evaData);
            setShowEvaModal(false);
            setEvaData({ overallScore: 0, recommendation: 'MAYBE', comments: '', ratings: { 'Tecnico': 0, 'Blandas': 0, 'Experiencia': 0 } });
            alert("Evaluación registrada");
            loadData();
        } catch (error) {
            alert("Error al registrar evaluación");
        }
    };

    if (loading) return <div className="p-8 text-white">Cargando...</div>;
    if (!app) return <div className="p-8 text-white">No encontrado</div>;

    const SERVER_URL = 'http://localhost:4000/';

    // Calculate Average Score from ratings if overallScore not manual
    const updateRating = (criteria, value) => {
        const newRatings = { ...evaData.ratings, [criteria]: parseInt(value) };
        const values = Object.values(newRatings);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        setEvaData({ ...evaData, ratings: newRatings, overallScore: avg.toFixed(1) });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 relative">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Profile Column */}
                <div className="lg:col-span-2 space-y-6">
                    <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-white">
                        <FiArrowLeft className="mr-2" /> Volver
                    </button>

                    {/* Header Card */}
                    <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-bold mb-1">{app.firstName} {app.lastName}</h1>
                                <p className="text-blue-400 text-lg">{app.vacancy?.title}</p>
                            </div>
                            <select
                                value={app.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="bg-gray-700 border-gray-600 rounded-lg p-2 text-white font-bold"
                            >
                                <option value="PENDING">Pendiente</option>
                                <option value="REVIEWING">En Revisión</option>
                                <option value="INTERVIEW">Entrevista</option>
                                <option value="OFFER">Oferta</option>
                                <option value="HIRED">Contratado</option>
                                <option value="REJECTED">Rechazado</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-gray-300 mb-8">
                            <div className="flex items-center"><FiMail className="mr-3 text-gray-500" /> {app.email}</div>
                            <div className="flex items-center"><FiPhone className="mr-3 text-gray-500" /> {app.phone}</div>
                        </div>

                        <div className="bg-gray-700/50 p-6 rounded-xl mb-6">
                            <h3 className="font-bold mb-3 text-gray-300">Carta de Presentación</h3>
                            <p className="text-gray-400 whitespace-pre-line">{app.coverLetter || "No incluida."}</p>
                        </div>

                        {app.resumeUrl && (
                            <a href={`${SERVER_URL}${app.resumeUrl}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors">
                                <FiDownload className="mr-2" /> Ver Hoja de Vida (PDF)
                            </a>
                        )}
                    </div>

                    {/* Interviews Section */}
                    <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center"><FiCalendar className="mr-2" /> Entrevistas</h3>
                            <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-sm">
                                + Programar
                            </button>
                        </div>
                        {app.interviews?.length === 0 ? <p className="text-gray-500">No hay entrevistas programadas.</p> : (
                            <div className="space-y-4">
                                {app.interviews?.map(int => (
                                    <div key={int.id} className="bg-gray-700/30 p-4 rounded-lg flex justify-between items-center border border-gray-600">
                                        <div>
                                            <p className="font-bold text-lg mb-1">{new Date(int.date).toLocaleDateString()} - {new Date(int.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            <div className="flex items-center text-sm text-gray-400 gap-4">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${int.type === 'VIRTUAL' ? 'bg-purple-900 text-purple-300' : 'bg-orange-900 text-orange-300'}`}>{int.type}</span>
                                                <span className="flex items-center"><FiMapPin className="mr-1" /> {int.location || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Evaluations Section */}
                    <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center"><FiStar className="mr-2" /> Evaluaciones</h3>
                            <button onClick={() => setShowEvaModal(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-sm">
                                + Evaluar
                            </button>
                        </div>
                        {app.evaluations?.length === 0 ? <p className="text-gray-500">No hay evaluaciones registradas.</p> : (
                            <div className="space-y-4">
                                {app.evaluations?.map(eva => (
                                    <div key={eva.id} className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-blue-300">{eva.evaluator?.firstName} {eva.evaluator?.lastName}</p>
                                                <p className="text-xs text-gray-400">{new Date(eva.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-yellow-500">{eva.overallScore}</span>
                                                <span className="text-sm text-gray-400">/5</span>
                                            </div>
                                        </div>
                                        <div className="mb-2">
                                            {eva.recommendation === 'HIRE' && <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs font-bold">RECOMENDADO</span>}
                                            {eva.recommendation === 'NO_HIRE' && <span className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs font-bold">NO RECOMENDADO</span>}
                                            {eva.recommendation === 'MAYBE' && <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded text-xs font-bold">EN DUDA</span>}
                                        </div>
                                        <p className="text-gray-300 italic">"{eva.comments}"</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes Column */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-full flex flex-col">
                        <h3 className="text-xl font-bold mb-4 flex items-center"><FiMessageSquare className="mr-2" /> Notas Internas</h3>
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[500px]">
                            {app.notes?.length === 0 && <p className="text-gray-500 text-sm">No hay notas registradas.</p>}
                            {app.notes?.map(note => (
                                <div key={note.id} className="bg-gray-700/50 p-3 rounded-lg">
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span className="font-bold text-blue-300">{note.createdBy}</span>
                                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-200">{note.content}</p>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddNote} className="relative">
                            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Escribe una nota..."
                                className="w-full bg-gray-700 border-gray-600 rounded-lg pl-4 pr-10 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            <button type="submit" className="absolute right-2 top-2 p-2 text-blue-400 hover:text-white"><FiSend /></button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Schedule Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 text-white">Programar Entrevista</h2>
                        <form onSubmit={handleSchedule} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm text-gray-400 mb-1">Fecha</label><input required type="date" className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white" value={interviewData.date} onChange={e => setInterviewData({ ...interviewData, date: e.target.value })} /></div>
                                <div><label className="block text-sm text-gray-400 mb-1">Hora</label><input required type="time" className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white" value={interviewData.time} onChange={e => setInterviewData({ ...interviewData, time: e.target.value })} /></div>
                            </div>
                            <div><label className="block text-sm text-gray-400 mb-1">Tipo</label><select className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white" value={interviewData.type} onChange={e => setInterviewData({ ...interviewData, type: e.target.value })}><option value="VIRTUAL">Virtual</option><option value="PRESENTIAL">Presencial</option></select></div>
                            <div><label className="block text-sm text-gray-400 mb-1">Ubicación/Enlace</label><input required type="text" className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white" value={interviewData.location} onChange={e => setInterviewData({ ...interviewData, location: e.target.value })} /></div>
                            <div className="flex justify-end pt-4 gap-3"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400">Cancelar</button><button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">Guardar</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Evaluation Modal */}
            {showEvaModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-8 rounded-xl max-w-lg w-full border border-gray-700 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-bold mb-6 text-white">Evaluar Candidato</h2>
                        <form onSubmit={handleEvaluate} className="space-y-6">

                            {/* Criteria Ratings */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-300 border-b border-gray-700 pb-2">Criterios (1-5)</h3>
                                {Object.keys(evaData.ratings).map(criterion => (
                                    <div key={criterion} className="flex justify-between items-center">
                                        <label className="text-gray-400 w-1/3">{criterion}</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button key={star} type="button"
                                                    onClick={() => updateRating(criterion, star)}
                                                    className={`p-2 rounded-full transition-colors ${evaData.ratings[criterion] >= star ? 'text-yellow-400' : 'text-gray-600'}`}>
                                                    <FiStar className="text-xl" fill={evaData.ratings[criterion] >= star ? "currentColor" : "none"} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center bg-gray-700/30 p-4 rounded-lg">
                                <span className="font-bold">Puntuación Global:</span>
                                <span className="text-3xl font-bold text-yellow-500">{evaData.overallScore}</span>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Comentarios (Obligatorio)</label>
                                <textarea required className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white h-24"
                                    value={evaData.comments} onChange={e => setEvaData({ ...evaData, comments: e.target.value })}></textarea>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Recomendación</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button type="button" onClick={() => setEvaData({ ...evaData, recommendation: 'HIRE' })}
                                        className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${evaData.recommendation === 'HIRE' ? 'bg-green-600/20 border-green-500 text-green-400' : 'border-gray-600 text-gray-500'}`}>
                                        <FiCheckCircle size={20} /> CONTRATAR
                                    </button>
                                    <button type="button" onClick={() => setEvaData({ ...evaData, recommendation: 'MAYBE' })}
                                        className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${evaData.recommendation === 'MAYBE' ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400' : 'border-gray-600 text-gray-500'}`}>
                                        <FiStar size={20} /> VER MÁS
                                    </button>
                                    <button type="button" onClick={() => setEvaData({ ...evaData, recommendation: 'NO_HIRE' })}
                                        className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${evaData.recommendation === 'NO_HIRE' ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-gray-600 text-gray-500'}`}>
                                        <FiXCircle size={20} /> RECHAZAR
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 gap-3">
                                <button type="button" onClick={() => setShowEvaModal(false)} className="px-4 py-2 text-gray-400">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold">Registrar Evaluación</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationDetails;
