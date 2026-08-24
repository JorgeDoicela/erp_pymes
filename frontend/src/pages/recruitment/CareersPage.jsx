import { useState, useEffect } from 'react';
import { getPublicVacancies } from '../../services/recruitment.service';
import { FiBriefcase, FiMapPin, FiDollarSign, FiClock, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';

const CareersPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const companySlug = searchParams.get('company') || searchParams.get('slug');
    const tenantId = searchParams.get('tenantId');

    const [vacancies, setVacancies] = useState([]);
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = {};
        if (companySlug) params.companySlug = companySlug;
        if (tenantId) params.tenantId = tenantId;

        getPublicVacancies(params)
            .then(data => {
                setVacancies(data);
                if (data.length > 0 && data[0].tenant?.name) {
                    setCompanyName(data[0].tenant.name);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [companySlug, tenantId]);

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 py-12 md:py-16 px-6 shadow-sm">
                <div className="max-w-7xl mx-auto text-center">
                    {companyName && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
                            <FiCheckCircle size={14} /> Portal de Empleo · {companyName}
                        </div>
                    )}
                    <h1 className="text-3xl md:text-5xl font-black mb-4 text-slate-900 tracking-tight">Únete a Nuestro Equipo</h1>
                    <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
                        Estamos buscando talento apasionado para construir el futuro. Revisa las oportunidades disponibles y postúlate hoy mismo.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-500 font-medium text-sm">Cargando oportunidades laborales...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {vacancies.map(v => (
                                <div key={v.id} className="bg-white border border-gray-200 rounded p-4 flex flex-col justify-between text-xs hover:border-gray-300 transition-colors">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="bg-blue-50 text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                                                {v.department}
                                            </span>
                                            {v.tenant?.name && !companyName && (
                                                <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                                                    {v.tenant.name}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-semibold text-gray-900 leading-snug">{v.title}</h3>
                                        <div className="space-y-1.5 text-xs text-gray-600">
                                            <div className="flex items-center">
                                                <FiMapPin className="mr-1.5 text-gray-400 shrink-0" size={13} /> {v.location}
                                            </div>
                                            <div className="flex items-center">
                                                <FiClock className="mr-1.5 text-gray-400 shrink-0" size={13} /> {v.employmentType}
                                            </div>
                                            {v.salaryMin && (
                                                <div className="flex items-center font-mono tabular-nums">
                                                    <FiDollarSign className="mr-1 text-gray-400 shrink-0" size={13} /> ${v.salaryMin} - ${v.salaryMax} USD
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/careers/${v.id}`)}
                                        className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-xs"
                                    >
                                        Ver Oferta <FiArrowRight size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {vacancies.length === 0 && (
                            <div className="text-center py-16 bg-white rounded border border-gray-200 p-6 text-xs text-gray-500">
                                <FiBriefcase className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                <h3 className="text-sm font-semibold text-gray-900 mb-1">Sin vacantes disponibles</h3>
                                <p className="text-gray-500 text-xs">No existen ofertas de empleo activas en este momento.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default CareersPage;
