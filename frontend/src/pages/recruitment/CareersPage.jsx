import { useState, useEffect } from 'react';
import { getPublicVacancies } from '../../services/recruitment.service';
import { FiBriefcase, FiMapPin, FiDollarSign, FiClock, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const CareersPage = () => {
    const navigate = useNavigate();
    const [vacancies, setVacancies] = useState([]);

    useEffect(() => {
        getPublicVacancies().then(setVacancies).catch(console.error);
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <header className="bg-white border-b border-slate-100 py-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl font-bold mb-4 text-slate-800 tracking-tight">Únete a Nuestro Equipo</h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto font-light">
                        Estamos buscando talento apasionado para construir el futuro. Revisa nuestras vacantes abiertas y aplica hoy.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {vacancies.map(v => (
                        <div key={v.id} className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-xl transition-shadow group relative">
                            <div className="absolute top-0 right-0 p-4">
                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                    {v.department}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{v.title}</h3>
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center text-gray-600 text-sm">
                                    <FiMapPin className="mr-2 text-gray-400" /> {v.location}
                                </div>
                                <div className="flex items-center text-gray-600 text-sm">
                                    <FiClock className="mr-2 text-gray-400" /> {v.employmentType}
                                </div>
                                {v.salaryMin && (
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <FiDollarSign className="mr-2 text-gray-400" /> {v.salaryMin} - {v.salaryMax}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => navigate(`/careers/${v.id}`)}
                                className="w-full py-3 bg-gray-50 text-gray-900 font-bold rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center"
                            >
                                Ver Detalle <FiArrowRight className="ml-2" />
                            </button>
                        </div>
                    ))}
                </div>
                {vacancies.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No hay vacantes disponibles en este momento.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CareersPage;
