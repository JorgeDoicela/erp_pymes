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
            case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'REVIEWING': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'INTERVIEW': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'HIRED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'REJECTED': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="max-w-7xl mx-auto">
                <button onClick={() => navigate('/recruitment')} className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors text-sm md:text-base">
                    <FiArrowLeft className="mr-2" /> Volver al tablero
                </button>

                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 tracking-tight">Candidatos para la Vacante</h1>

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
                                <p className="text-slate-500 text-lg">No hay postulaciones aún para esta vacante.</p>
                            </div>
                        )}

                        {applications.map(app => (
                            <div key={app.id} onClick={() => navigate(`/recruitment/applications/${app.id}`)}
                                className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                                <div className="w-full sm:w-auto">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h3 className="font-bold text-base md:text-lg text-slate-800 group-hover:text-blue-600 transition-colors uppercase truncate max-w-[200px] sm:max-w-none">{app.firstName} {app.lastName}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold border shrink-0 ${getStatusColor(app.status)}`}>
                                            {app.status}
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
        </div>
    );
};

export default VacancyDetails;
