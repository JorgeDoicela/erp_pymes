import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmployees } from '../services/employee.service';

const EmployeeList = ({ token }) => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, [searchTerm]); // Re-fetch when search changes (debounce could be added for better performance)

    const fetchEmployees = async () => {
        try {
            const data = await getEmployees(token, searchTerm);
            setEmployees(data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Directorio de Empleados
                    </h2>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300"
                    >
                        Volver al Panel
                    </button>
                </header>

                {/* Search Bar */}
                <div className="mb-8 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500"></span>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, cédula o ID..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-slate-400">Cargando empleados...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {employees.length > 0 ? (
                            employees.map((emp) => (
                                <div key={emp.id} className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 hover:bg-slate-800 transition-all group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-bold text-lg">
                                            {emp.firstName[0]}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${emp.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                            {emp.role === 'admin' ? 'Administrador' : 'Empleado'}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition-colors">{emp.firstName} {emp.lastName}</h3>
                                    <p className="text-slate-400 text-sm mb-4">{emp.position} • {emp.department}</p>

                                    <div className="space-y-2 text-sm text-slate-500 mb-6">
                                        <p className="flex items-center gap-2">
                                            {emp.email}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            {emp.identityCard || 'N/A'}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/admin/employees/${emp.id}`)}
                                        className="w-full py-2 rounded-lg bg-white/5 hover:bg-blue-600/20 hover:text-blue-300 transition-all border border-white/10"
                                    >
                                        Ver Perfil Completo
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                                No se encontraron empleados.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeList;
