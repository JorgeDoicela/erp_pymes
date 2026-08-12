import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEmployees } from '../../hooks/employees/useEmployees';
import { FiDownload } from 'react-icons/fi';
import MaskedText from '../../components/common/MaskedText';

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

    const handleExportCSV = () => {
        if (!employees || employees.length === 0) return;

        // Escape a cell value for CSV
        const c = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

        const headers = ['Cedula', 'Nombre', 'Apellido', 'Email', 'Cargo', 'Departamento', 'Tipo Contrato', 'Estado', 'Fecha Ingreso'];

        const rows = employees.map(emp => [
            c(emp.identityCard),
            c(emp.firstName),
            c(emp.lastName),
            c(emp.email),
            c(emp.position),
            c(emp.department),
            c(emp.contractType),
            c(emp.isActive ? 'Activo' : 'Inactivo'),
            c(emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('es-EC') : ''),
        ].join(','));

        // UTF-8 BOM so Excel renders accented characters correctly
        const csv = '\uFEFF' + [headers.map(h => c(h)).join(','), ...rows].join('\r\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'lista_empleados.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Recursos Humanos · Directorio</p>
                    <h1 className="text-xl font-semibold text-gray-900">Directorio de Empleados</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Gestiona el personal activo, cargos y expedientes.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleExportCSV}
                        disabled={loading || employees.length === 0}
                        className="px-3.5 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <FiDownload size={14} />
                        <span>Exportar CSV</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin/register-employee')}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                        <span>+ Registrar Colaborador</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        Volver
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre, cédula o ID..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors placeholder-gray-400"
                />
            </div>

            {successMsg && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-xs text-green-800 flex justify-between items-center">
                    <span className="font-medium">{successMsg}</span>
                    <button onClick={() => setSuccessMsg('')} className="text-green-700 hover:text-green-900">×</button>
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <div className="text-gray-400 text-xs font-medium">Cargando directorio de empleados...</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees.length > 0 ? (
                        employees.map((emp) => (
                            <div key={emp.id} className="bg-white rounded border border-gray-200 p-4 hover:border-gray-300 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-9 h-9 rounded bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center font-mono font-semibold text-xs shrink-0">
                                        {emp.firstName?.[0] || 'E'}
                                    </div>
                                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium border ${emp.role === 'admin' ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                                        {emp.role === 'admin' ? 'Administrador' : 'Empleado'}
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate" title={`${emp.firstName} ${emp.lastName}`}>
                                        {emp.firstName} {emp.lastName}
                                    </h3>
                                    <p className="text-xs text-gray-500 truncate">{emp.position}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{emp.department}</p>
                                </div>

                                <div className="space-y-1.5 text-xs text-gray-600 mb-4 bg-gray-50 p-2.5 rounded border border-gray-100">
                                    <p className="flex items-center gap-2 truncate" title={emp.email}>
                                        <span className="text-gray-400">Email:</span>
                                        <span className="truncate text-gray-800 font-mono">{emp.email}</span>
                                    </p>
                                    <p className="flex items-center gap-2 text-xs text-gray-600">
                                        <span className="text-gray-400">Cédula:</span>
                                        <span className="font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                            <MaskedText value={emp.identityCard} label="cédula" />
                                        </span>
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigate(`/admin/employees/${emp.id}`)}
                                    className="w-full py-1.5 rounded bg-white border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    Ver Expediente Completo
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-gray-400 text-xs">
                            <p className="text-sm font-medium text-gray-700">No se encontraron empleados</p>
                            <p className="text-xs text-gray-400 mt-1">Intenta con otros términos de búsqueda o registra un nuevo colaborador.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmployeeList;
