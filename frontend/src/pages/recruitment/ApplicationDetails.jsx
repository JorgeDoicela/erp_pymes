import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationDetails, updateApplicationStatus, addApplicationNote, scheduleInterview, evaluateCandidate, hireCandidate } from '../../services/recruitment.service';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiDownload, FiMessageSquare, FiSend, FiCalendar, FiMapPin, FiStar, FiCheckCircle, FiXCircle, FiBriefcase, FiFileText, FiInfo } from 'react-icons/fi';

const ApplicationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);

    // Modals State
    const [showModal, setShowModal] = useState(false); // Interview
    const [showEvaModal, setShowEvaModal] = useState(false); // Evaluation
    const [showHireModal, setShowHireModal] = useState(false); // Hire

    const [interviewData, setInterviewData] = useState({ date: '', time: '', type: 'VIRTUAL', location: '', notes: '' });
    const [evaData, setEvaData] = useState({ overallScore: 0, recommendation: 'MAYBE', comments: '', ratings: { 'Tecnico': 0, 'Blandas': 0, 'Experiencia': 0 } });

    // Hire Data
    const [hireData, setHireData] = useState({
        identityCard: '',
        birthDate: '',
        address: '',
        civilStatus: 'Soltero',
        contractType: 'Indefinido',
        salary: '',
        startDate: '',
        closeVacancy: false
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

    const handleHire = async (e) => {
        e.preventDefault();
        if (!window.confirm("¿Estás seguro de contratar a este candidato? Se creará una cuenta de empleado.")) return;
        try {
            await hireCandidate(id, hireData);
            setShowHireModal(false);
            alert("Candidato Contratado Exitosamente. Cuenta de Empleado Creada.");
            loadData();
            navigate('/recruitment'); // Redirect back to board
        } catch (error) {
            alert("Error al contratar candidato. Verifique que la cédula no esté duplicada.");
        }
    };

    if (loading) return <div className="p-8 text-white">Cargando...</div>;
    if (!app) return <div className="p-8 text-white">No encontrado</div>;

    const SERVER_URL = import.meta.env.VITE_API_URL || '/';

    const updateRating = (criteria, value) => {
        const newRatings = { ...evaData.ratings, [criteria]: parseInt(value) };
        const values = Object.values(newRatings);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        setEvaData({ ...evaData, ratings: newRatings, overallScore: avg.toFixed(1) });
    };

    return (
        <div className="space-y-6 relative">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Profile Column */}
                <div className="lg:col-span-2 space-y-6">
                    <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                        <FiArrowLeft className="mr-2" /> Volver
                    </button>

                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-6 w-full">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800 mb-1">{app.firstName} {app.lastName}</h1>
                                <p className="text-blue-600 text-lg font-medium">{app.vacancy?.title}</p>
                            </div>

                            <div className="flex gap-2 flex-wrap justify-end">
                                <select value={app.status} onChange={(e) => handleStatusChange(e.target.value)} className="bg-slate-50 border-slate-200 rounded-lg p-2 text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-slate-100 transition-colors text-sm">
                                    <option value="PENDING">Pendiente</option>
                                    <option value="REVIEWING">En Revisión</option>
                                    <option value="INTERVIEW">Entrevista</option>
                                    <option value="OFFER">Oferta</option>
                                    <option value="HIRED">Contratado</option>
                                    <option value="REJECTED">Rechazado</option>
                                </select>

                                {app.status !== 'HIRED' && (
                                    <button onClick={() => setShowHireModal(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center shadow-sm hover:shadow-md transition-all text-sm">
                                        <FiBriefcase className="mr-2" /> Contratar
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600 mb-8">
                            <div className="flex items-center"><FiMail className="mr-3 text-slate-400" /> {app.email}</div>
                            <div className="flex items-center"><FiPhone className="mr-3 text-slate-400" /> {app.phone}</div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl mb-6 border border-slate-100">
                            <h3 className="font-bold mb-3 text-slate-800 flex items-center"><FiFileText className="mr-2 text-slate-400" /> Carta de Presentación</h3>
                            <p className="text-slate-600 whitespace-pre-line leading-relaxed">{app.coverLetter || "No incluida."}</p>
                        </div>

                        {app.resumeUrl && (
                            <a href={`${SERVER_URL}${app.resumeUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-bold transition-colors">
                                <FiDownload className="mr-2" /> Ver Hoja de Vida (PDF)
                            </a>
                        )}
                    </div>

                    {/* Interviews Section */}
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center"><FiCalendar className="mr-2 text-blue-600" /> Entrevistas</h3>
                            <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-sm transition-all">+ Programar</button>
                        </div>
                        {app.interviews?.map(int => (
                            <div key={int.id} className="bg-slate-50 p-4 rounded-lg flex justify-between items-center border border-slate-200 mb-2 hover:border-blue-300 transition-colors">
                                <div>
                                    <p className="font-bold text-slate-700 text-lg mb-1">{new Date(int.date).toLocaleDateString()} - {new Date(int.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <span className="text-sm text-slate-500 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">{int.type} - {int.location}</span>
                                </div>
                            </div>
                        ))}
                        {app.interviews?.length === 0 && <p className="text-slate-400 italic">No hay entrevistas programadas.</p>}
                    </div>

                    {/* Evaluations Section */}
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center"><FiStar className="mr-2 text-yellow-500" /> Evaluaciones</h3>
                            <button onClick={() => setShowEvaModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-sm transition-all">+ Evaluar</button>
                        </div>
                        {app.evaluations?.map(eva => (
                            <div key={eva.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-2">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-bold text-slate-700">{eva.evaluator?.firstName} {eva.evaluator?.lastName}</p>
                                    <span className="text-lg font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100 flex items-center gap-1">
                                        {eva.overallScore}/5 <FiStar className="fill-current text-yellow-500" size={14} />
                                    </span>
                                </div>
                                <p className="text-slate-600 italic text-sm">"{eva.comments}"</p>
                            </div>
                        ))}
                        {app.evaluations?.length === 0 && <p className="text-slate-400 italic">No hay evaluaciones registradas.</p>}
                    </div>
                </div>

                {/* Notes Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col sticky top-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><FiMessageSquare className="mr-2 text-slate-400" /> Notas Internas</h3>
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[500px] pr-2 custom-scrollbar">
                            {app.notes?.map(note => (
                                <div key={note.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span className="font-bold text-blue-600">{note.createdBy}</span>
                                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-700">{note.content}</p>
                                </div>
                            ))}
                            {app.notes?.length === 0 && <p className="text-slate-400 text-sm italic">No hay notas.</p>}
                        </div>
                        <form onSubmit={handleAddNote} className="relative mt-auto pt-4 border-t border-slate-100">
                            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Escribe una nota..."
                                className="w-full bg-slate-50 border-slate-200 rounded-lg pl-4 pr-10 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400" />
                            <button type="submit" className="absolute right-2 bottom-2 p-2 text-blue-600 hover:text-blue-800 transition-colors"><FiSend /></button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Interviews Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
                    <div className="bg-white p-8 rounded-xl max-w-md w-full border border-slate-200 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800">Programar Entrevista</h2>
                        <form onSubmit={handleSchedule} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm text-slate-600 mb-1 font-medium">Fecha</label><input required type="date" className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" value={interviewData.date} onChange={e => setInterviewData({ ...interviewData, date: e.target.value })} /></div>
                                <div><label className="block text-sm text-slate-600 mb-1 font-medium">Hora</label><input required type="time" className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" value={interviewData.time} onChange={e => setInterviewData({ ...interviewData, time: e.target.value })} /></div>
                            </div>
                            <div><label className="block text-sm text-slate-600 mb-1 font-medium">Tipo</label><select className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" value={interviewData.type} onChange={e => setInterviewData({ ...interviewData, type: e.target.value })}><option value="VIRTUAL">Virtual</option><option value="PRESENTIAL">Presencial</option></select></div>
                            <div><label className="block text-sm text-slate-600 mb-1 font-medium">Ubicación/Enlace</label><input required type="text" className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" value={interviewData.location} onChange={e => setInterviewData({ ...interviewData, location: e.target.value })} /></div>
                            <div className="flex justify-end pt-4 gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Evaluation Modal */}
            {showEvaModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
                    <div className="bg-white p-8 rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800">Evaluar Candidato</h2>
                        <form onSubmit={handleEvaluate} className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-700 border-b border-slate-100 pb-2">Criterios (1-5)</h3>
                                {Object.keys(evaData.ratings).map(criterion => (
                                    <div key={criterion} className="flex justify-between items-center">
                                        <label className="text-slate-600 w-1/3 capitalize font-medium">{criterion}</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button key={star} type="button" onClick={() => updateRating(criterion, star)} className={`p-2 rounded-full transition-colors ${evaData.ratings[criterion] >= star ? 'text-yellow-500' : 'text-slate-300'}`}><FiStar className="text-xl" fill={evaData.ratings[criterion] >= star ? "currentColor" : "none"} /></button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100"><span className="font-bold text-slate-700">Puntuación Global:</span><span className="text-3xl font-bold text-yellow-500">{evaData.overallScore}</span></div>
                            <div><label className="block text-sm text-slate-600 mb-2 font-medium">Comentarios (Obligatorio)</label><textarea required className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 h-24 focus:ring-2 focus:ring-blue-500 outline-none" value={evaData.comments} onChange={e => setEvaData({ ...evaData, comments: e.target.value })}></textarea></div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-2 font-medium">Recomendación</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button type="button" onClick={() => setEvaData({ ...evaData, recommendation: 'HIRE' })} className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${evaData.recommendation === 'HIRE' ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}><FiCheckCircle size={20} /> CONTRATAR</button>
                                    <button type="button" onClick={() => setEvaData({ ...evaData, recommendation: 'MAYBE' })} className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${evaData.recommendation === 'MAYBE' ? 'bg-yellow-50 border-yellow-500 text-yellow-700 ring-1 ring-yellow-500' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}><FiStar size={20} /> VER MÁS</button>
                                    <button type="button" onClick={() => setEvaData({ ...evaData, recommendation: 'NO_HIRE' })} className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${evaData.recommendation === 'NO_HIRE' ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}><FiXCircle size={20} /> RECHAZAR</button>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 gap-3">
                                <button type="button" onClick={() => setShowEvaModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm">Registrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Hire Modal */}
            {showHireModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
                    <div className="bg-white p-8 rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                            <FiBriefcase className="text-blue-600" /> Contratar {app.firstName}
                        </h2>
                        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 text-sm border border-blue-100 flex items-start gap-2">
                            <FiInfo className="mt-0.5 flex-shrink-0" />
                            <p>Se creará una cuenta de empleado automáticamente. La contraseña por defecto será la Cédula/DNI.</p>
                        </div>
                        <form onSubmit={handleHire} className="space-y-4">
                            <div><label className="block text-sm text-slate-600 mb-1 font-medium">Cédula / DNI</label><input required type="text" className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" value={hireData.identityCard} onChange={e => setHireData({ ...hireData, identityCard: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm text-slate-600 mb-1 font-medium">Fecha Nacimiento</label><input required type="date" className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" value={hireData.birthDate} onChange={e => setHireData({ ...hireData, birthDate: e.target.value })} /></div>
                                <div><label className="block text-sm text-slate-600 mb-1 font-medium">Fecha Inicio</label><input required type="date" className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" value={hireData.startDate} onChange={e => setHireData({ ...hireData, startDate: e.target.value })} /></div>
                            </div>
                            <div><label className="block text-sm text-slate-600 mb-1 font-medium">Dirección</label><input required type="text" className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" value={hireData.address} onChange={e => setHireData({ ...hireData, address: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm text-slate-600 mb-1 font-medium">Estado Civil</label><select className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" value={hireData.civilStatus} onChange={e => setHireData({ ...hireData, civilStatus: e.target.value })}><option>Soltero</option><option>Casado</option><option>Divorciado</option><option>Unión Libre</option></select></div>
                                <div><label className="block text-sm text-slate-600 mb-1 font-medium">Tipo Contrato</label><select className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" value={hireData.contractType} onChange={e => setHireData({ ...hireData, contractType: e.target.value })}><option>Indefinido</option><option>Plazo Fijo</option><option>Servicios Profesionales</option></select></div>
                            </div>
                            <div><label className="block text-sm text-slate-600 mb-1 font-medium">Salario Mensual</label><input required type="number" className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" value={hireData.salary} onChange={e => setHireData({ ...hireData, salary: e.target.value })} /></div>

                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2">
                                <input type="checkbox" id="closeVacancy" className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500" checked={hireData.closeVacancy} onChange={e => setHireData({ ...hireData, closeVacancy: e.target.checked })} />
                                <label htmlFor="closeVacancy" className="text-slate-700 text-sm">Cerrar vacante automáticamente (Ya no se aceptarán más candidatos)</label>
                            </div>

                            <div className="flex justify-end pt-4 gap-3">
                                <button type="button" onClick={() => setShowHireModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-sm">Confirmar Contratación</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationDetails;
