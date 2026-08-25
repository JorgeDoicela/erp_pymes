import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateCustomReport } from '../../services/analytics.service';
import { getDepartments } from '../../services/employees/employee.service';
import { FiDatabase, FiCheckSquare, FiFilter, FiDownload, FiPlay, FiArrowLeft } from 'react-icons/fi';

const modules = [
    // 'salary' excluded: stored encrypted in DB — use the dedicated Excel export instead
    { id: 'employees', name: 'Empleados', fields: ['firstName', 'lastName', 'email', 'department', 'position', 'contractType', 'hireDate', 'isActive'] },
    { id: 'payrolls', name: 'Nómina', fields: ['totalAmount', 'paymentDate', 'status', 'createdAt'] },
    { id: 'job_applications', name: 'Reclutamiento', fields: ['firstName', 'lastName', 'email', 'position', 'status', 'appliedAt'] },
    { id: 'evaluations', name: 'Evaluaciones', fields: ['finalScore', 'status', 'startDate', 'endDate'] }
];

const fieldTranslations = {
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo',
    department: 'Departamento',
    position: 'Puesto',
    contractType: 'Tipo de Contrato',
    hireDate: 'Fecha Ingreso',
    isActive: 'Estado Activo',
    totalAmount: 'Monto Total',
    paymentDate: 'Fecha de Pago',
    status: 'Estado',
    createdAt: 'Fecha Registro',
    appliedAt: 'Fecha Postulación',
    finalScore: 'Calificación',
    startDate: 'Fecha Inicio',
    endDate: 'Fecha Fin'
};

const CustomReport = () => {
    const [config, setConfig] = useState({
        module: '',
        fields: [],
        filters: {}
    });
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        try {
            const res = await getDepartments();
            if (res.success) setDepartments(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleModuleChange = (e) => {
        setConfig({
            module: e.target.value,
            fields: [],
            filters: {}
        });
        setResults(null);
    };

    const toggleField = (field) => {
        if (config.fields.includes(field)) {
            setConfig({ ...config, fields: config.fields.filter(f => f !== field) });
        } else {
            setConfig({ ...config, fields: [...config.fields, field] });
        }
    };

    const handleGenerate = async () => {
        if (!config.module) return;
        setLoading(true);
        try {
            const data = await generateCustomReport(config);
            setResults(data);
        } catch (error) {
            console.error(error);
            alert("Error al generar reporte: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        if (!results || results.length === 0) return;

        const headers = Object.keys(results[0]).map(h => fieldTranslations[h] || h).join(',');
        const rows = results.map(row => Object.values(row).map(v => `"${v}"`).join(','));
        const csv = [headers, ...rows].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${config.module}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const selectedModuleData = modules.find(m => m.id === config.module);

    return (
        <div className="space-y-6">
            {/* Header Limpio ERP */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-gray-200">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            to="/analytics"
                            className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium transition-colors"
                        >
                            <FiArrowLeft className="w-3 h-3" />
                            <span>Analíticas</span>
                        </Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider font-mono">Personalizado</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">Exportación & Reportes a Medida</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Construye informes a medida seleccionando módulos, columnas y filtros específicos.</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        to="/analytics"
                        className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                        <FiArrowLeft className="w-3.5 h-3.5" />
                        <span>Volver a Analíticas</span>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel de Configuración */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Selección de Módulo */}
                    <div className="bg-white p-4.5 rounded border border-gray-200 space-y-3">
                        <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">1. Seleccionar Módulo</h3>
                        <div className="space-y-2">
                            {modules.map(m => (
                                <label key={m.id} className={`flex items-center p-2.5 rounded cursor-pointer border text-xs transition-colors ${config.module === m.id ? 'bg-blue-50/50 border-blue-500 font-medium text-gray-900' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                                    <input type="radio" name="module" value={m.id} checked={config.module === m.id} onChange={handleModuleChange} className="mr-2.5 text-blue-600 focus:ring-blue-500" />
                                    <span>{m.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Selección de Campos */}
                    {selectedModuleData && (
                        <div className="bg-white p-4.5 rounded border border-gray-200 space-y-3">
                            <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">2. Seleccionar Campos</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {selectedModuleData.fields.map(field => (
                                    <label key={field} className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer hover:text-blue-600 transition-colors">
                                        <input type="checkbox" checked={config.fields.includes(field)} onChange={() => toggleField(field)} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                                        <span>{fieldTranslations[field] || field}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filtros Opcionales */}
                    {config.module && (
                        <div className="bg-white p-4.5 rounded border border-gray-200 space-y-3">
                            <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">3. Filtros Opcionales</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[11px] font-medium text-gray-600 block mb-1">Departamento</label>
                                    <select
                                        className="w-full bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                        onChange={e => setConfig({ ...config, filters: { ...config.filters, department: e.target.value } })}
                                    >
                                        <option value="">Todos</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pt-2">
                                    <button onClick={handleGenerate} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded flex justify-center items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50">
                                        <FiPlay className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                        <span>{loading ? 'Generando...' : 'Generar Reporte'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Panel de Vista Previa */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded border border-gray-200 h-full flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                <FiCheckSquare className="w-3.5 h-3.5 text-blue-600" />
                                <span>Vista Previa de Resultados</span>
                            </h3>
                            {results && (
                                <button onClick={downloadCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs">
                                    <FiDownload className="w-3.5 h-3.5" />
                                    <span>Descargar CSV</span>
                                </button>
                            )}
                        </div>

                        <div className="p-0 flex-grow overflow-auto">
                            {!results ? (
                                <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-xs">
                                    <FiDatabase className="w-8 h-8 mb-2 opacity-30" />
                                    <p className="font-mono text-center px-4">Selecciona un módulo y los campos, luego genera el reporte para previsualizar los datos.</p>
                                </div>
                            ) : results.length === 0 ? (
                                <div className="h-64 flex items-center justify-center text-gray-400 text-xs italic">No hay datos que coincidan con los filtros.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs min-w-[600px]">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-semibold sticky top-0">
                                            <tr>
                                                {Object.keys(results[0]).map(header => (
                                                    <th key={header} className="py-2.5 px-4 whitespace-nowrap tracking-wider">{fieldTranslations[header] || header}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {results.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                                                    {Object.values(row).map((val, i) => (
                                                        <td key={i} className="py-2.5 px-4 whitespace-nowrap text-gray-700">
                                                            {val instanceof Date || (typeof val === 'string' && val.includes('T') && !isNaN(Date.parse(val)))
                                                                ? new Date(val).toLocaleDateString()
                                                                : typeof val === 'boolean'
                                                                    ? (val ? 'Sí' : 'No')
                                                                    : typeof val === 'object' && val !== null
                                                                        ? JSON.stringify(val)
                                                                        : String(val)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        {results && (
                            <div className="p-3 border-t border-gray-100 text-[11px] font-mono text-gray-400 text-right bg-gray-50/30">
                                Total: {results.length} registros
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomReport;

