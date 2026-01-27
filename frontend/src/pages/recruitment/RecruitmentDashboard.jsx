import { useState, useEffect } from 'react';
import { getVacancies, updateVacancyStatus } from '../../services/recruitment.service';
import { FiPlus, FiBriefcase, FiUsers, FiGlobe, FiEye, FiCheckCircle, FiSlash, FiCopy } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const RecruitmentDashboard = () => {
    const navigate = useNavigate();
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadVacancies();
    }, []);

    const loadVacancies = async () => {
        try {
            const data = await getVacancies();
            setVacancies(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
            await updateVacancyStatus(id, newStatus);
            loadVacancies();
        } catch (error) {
            alert("Error");
        }
    };

    const copyLink = (id) => {
        const link = `${window.location.origin}/careers/${id}`;
        navigator.clipboard.writeText(link);
        alert("Enlace copiado al portapapeles: " + link);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                            Reclutamiento y Selección
                        </h1>
                        <p className="text-gray-400">Gestiona vacantes y candidatos</p>
                    </div>
                    <button
                        onClick={() => navigate('/recruitment/create')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center shadow-lg transition-transform hover:scale-105"
                    >
                        <FiPlus className="mr-2" /> Nueva Vacante
                    </button>
                </header>

                {loading ? (
                    <div className="text-center">Cargando...</div>
                ) : (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700/50 text-gray-400 uppercase text-xs">
                                <tr>
                                    <th className="p-6">Título</th>
                                    <th className="p-6">Departamento</th>
                                    <th className="p-6">Ubicación</th>
                                    <th className="p-6">Candidatos</th>
                                    <th className="p-6">Estado</th>
                                    <th className="p-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {vacancies.map(v => (
                                    <tr key={v.id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="p-6 font-bold text-white">{v.title}</td>
                                        <td className="p-6 text-gray-300">{v.department}</td>
                                        <td className="p-6 text-gray-300">{v.location}</td>
                                        <td className="p-6 cursor-pointer hover:text-white transition-colors" onClick={() => navigate(`/recruitment/${v.id}`)}>
                                            <span className="flex items-center text-white font-bold"><FiUsers className="mr-2" /> Ver Candidatos</span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${v.status === 'OPEN' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                                {v.status === 'OPEN' ? 'PUBLICADA' : 'CERRADA'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right space-x-2">
                                            <button onClick={() => copyLink(v.id)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white" title="Copiar Enlace">
                                                <FiGlobe />
                                            </button>
                                            <button onClick={() => toggleStatus(v.id, v.status)} className={`p-2 rounded-lg ${v.status === 'OPEN' ? 'bg-red-900/30 text-white hover:bg-red-900/50' : 'bg-green-900/30 text-white hover:bg-green-900/50'}`} title={v.status === 'OPEN' ? 'Cerrar Vacante' : 'Reabrir Vacante'}>
                                                {v.status === 'OPEN' ? <FiSlash /> : <FiCheckCircle />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {vacancies.length === 0 && <div className="p-12 text-center text-gray-500">No hay vacantes registradas.</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecruitmentDashboard;
