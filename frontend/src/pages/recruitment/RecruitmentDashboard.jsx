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
        <div className="space-y-6 px-4 sm:px-0">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                            Reclutamiento y Selección
                        </h1>
                        <p className="text-slate-500 mt-1">Gestiona vacantes y candidatos de manera eficiente.</p>
                    </div>
                    <button
                        onClick={() => navigate('/recruitment/create')}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center shadow-sm hover:shadow-md transition-all"
                    >
                        <FiPlus className="mr-2" /> Nueva Vacante
                    </button>
                </header>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-500">Cargando...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[800px] md:min-w-full">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="p-6">Título</th>
                                        <th className="p-6">Departamento</th>
                                        <th className="p-6">Ubicación</th>
                                        <th className="p-6">Candidatos</th>
                                        <th className="p-6">Estado</th>
                                        <th className="p-6 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {vacancies.map(v => (
                                        <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-6 font-bold text-slate-800">{v.title}</td>
                                            <td className="p-6 text-slate-600">{v.department}</td>
                                            <td className="p-6 text-slate-600">{v.location}</td>
                                            <td className="p-6 cursor-pointer group" onClick={() => navigate(`/recruitment/${v.id}`)}>
                                                <span className="flex items-center text-blue-600 font-medium group-hover:text-blue-800 transition-colors">
                                                    <FiUsers className="mr-2" /> Ver Candidatos
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${v.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                    {v.status === 'OPEN' ? 'PUBLICADA' : 'CERRADA'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right space-x-2">
                                                <button onClick={() => copyLink(v.id)} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-blue-600 transition-colors" title="Copiar Enlace">
                                                    <FiGlobe />
                                                </button>
                                                <button onClick={() => toggleStatus(v.id, v.status)} className={`p-2 rounded-lg border transition-colors ${v.status === 'OPEN' ? 'bg-white border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100' : 'bg-white border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100'}`} title={v.status === 'OPEN' ? 'Cerrar Vacante' : 'Reabrir Vacante'}>
                                                    {v.status === 'OPEN' ? <FiSlash /> : <FiCheckCircle />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {vacancies.length === 0 && <div className="p-12 text-center text-slate-500">No hay vacantes registradas.</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecruitmentDashboard;
