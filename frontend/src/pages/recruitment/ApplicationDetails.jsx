import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationDetails, updateApplicationStatus, addApplicationNote } from '../../services/recruitment.service';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiDownload, FiMessageSquare, FiSend } from 'react-icons/fi';

const ApplicationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [app, setApp] = useState(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="p-8 text-white">Cargando...</div>;
    if (!app) return <div className="p-8 text-white">No encontrado</div>;

    const SERVER_URL = 'http://localhost:4000/'; // Adjust based on your backend URL

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Profile Column */}
                <div className="lg:col-span-2 space-y-6">
                    <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-white">
                        <FiArrowLeft className="mr-2" /> Volver
                    </button>

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
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Escribe una nota..."
                                className="w-full bg-gray-700 border-gray-600 rounded-lg pl-4 pr-10 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button type="submit" className="absolute right-2 top-2 p-2 text-blue-400 hover:text-white">
                                <FiSend />
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ApplicationDetails;
