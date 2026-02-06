import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEmployees } from '../../hooks/employees/useEmployees';
import ExportButtons from '../../components/common/ExportButtons';

const EmployeeList = ({ token }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Use the hook for data fetching
    const { employees, loading, error, fetchEmployees } = useEmployees(token);

    const [searchTerm, setSearchTerm] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
        if (location.state?.successMessage) {
            setSuccessMsg(location.state.successMessage);
            window.history.replaceState({}, document.title);
            const timer = setTimeout(() => setSuccessMsg(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [location]);

    useEffect(() => {
        fetchEmployees(searchTerm);
    }, [searchTerm, fetchEmployees]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Directorio de Empleados</h2>
                    <p className="text-slate-500 text-sm">Gestiona la nómina y visualiza perfiles</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <ExportButtons type="employees" fileName="lista_empleados" />
                    <button
                        onClick={() => navigate('/admin/register-employee')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium flex items-center gap-2"
                    >
                        <span>+</span> <span className="hidden sm:inline">Nuevo Colaborador</span><span className="sm:hidden">Nuevo</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm font-medium"
                    >
                        Volver
                    </button>
                </div>
            </header>

            {/* Search Bar */}
            <div className="relative max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre, cédula o ID..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                />
            </div>

            {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 flex justify-between items-center animate-fade-in-down shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-1 bg-emerald-100 rounded-full">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="font-medium">{successMsg}</span>
                    </div>
                    <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-800 transition-colors">×</button>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 shadow-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-slate-400 text-sm font-medium">Cargando directorio...</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {employees.length > 0 ? (
                        employees.map((emp) => (
                            <div key={emp.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all group duration-300">
                                <div className="flex items-start justify-between mb-5">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center font-bold text-lg text-blue-700 shadow-sm border border-blue-50">
                                        {emp.firstName[0]}
                                    </div>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${emp.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                        {emp.role === 'admin' ? 'Administrador' : 'Empleado'}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors truncate" title={`${emp.firstName} ${emp.lastName}`}>
                                        {emp.firstName} {emp.lastName}
                                    </h3>
                                    <p className="text-slate-500 text-sm truncate">{emp.position}</p>
                                    <p className="text-slate-400 text-xs mt-0.5">{emp.department}</p>
                                </div>

                                <div className="space-y-2.5 text-sm text-slate-500 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <p className="flex items-center gap-2 truncate" title={emp.email}>
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        <span className="truncate">{emp.email}</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                                        ID: {emp.identityCard || 'N/A'}
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigate(`/admin/employees/${emp.id}`)}
                                    className="w-full py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center gap-2"
                                >
                                    Ver Perfil Completo
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-16 text-center">
                            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 max-w-lg mx-auto">
                                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">No se encontraron empleados</h3>
                                <p className="text-slate-500 mt-1">Intenta con otros términos de búsqueda o agrega un nuevo colaborador.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmployeeList;
