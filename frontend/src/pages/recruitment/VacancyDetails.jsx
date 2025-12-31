import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationsByVacancy } from '../../services/recruitment.service';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiCalendar, FiFileText } from 'react-icons/fi';

const VacancyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500/20 text-yellow-400';
            case 'REVIEWING': return 'bg-blue-500/20 text-blue-400';
            case 'INTERVIEW': return 'bg-purple-500/20 text-purple-400';
            case 'HIRED': return 'bg-green-500/20 text-green-400';
            case 'REJECTED': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                <button onClick={() => navigate('/recruitment')} className="flex items-center text-gray-400 hover:text-white mb-6">
                    <FiArrowLeft className="mr-2" /> Volver al tablero
                </button>

                <h1 className="text-3xl font-bold mb-8">Candidatos para la Vacante</h1>

                {loading ? <div>Cargando...</div> : (
                    <div className="grid grid-cols-1 gap-4">
                        {applications.length === 0 && <div className="text-gray-500">No hay postulaciones aún.</div>}

                        {applications.map(app => (
                            <div key={app.id} onClick={() => navigate(`/recruitment/applications/${app.id}`)}
                                className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-500 cursor-pointer transition-colors flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-lg">{app.firstName} {app.lastName}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </div>
                                    <div className="text-gray-400 text-sm flex gap-4">
                                        <span className="flex items-center"><FiMail className="mr-1" /> {app.email}</span>
                                        <span className="flex items-center"><FiPhone className="mr-1" /> {app.phone}</span>
                                        <span className="flex items-center"><FiCalendar className="mr-1" /> {new Date(app.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="text-gray-500">
                                    <FiFileText className="text-2xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VacancyDetails;
