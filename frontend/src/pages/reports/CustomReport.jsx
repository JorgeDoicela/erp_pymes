import { useState } from 'react';
import { generateCustomReport } from '../../services/analytics.service';
import { FiDatabase, FiCheckSquare, FiFilter, FiDownload, FiPlay } from 'react-icons/fi';

const modules = [
    { id: 'employees', name: 'Empleados', fields: ['firstName', 'lastName', 'email', 'department', 'position', 'salary', 'contractType', 'hireDate', 'status'] },
    { id: 'payrolls', name: 'Nómina', fields: ['totalAmount', 'paymentDate', 'status', 'createdAt'] },
    { id: 'job_applications', name: 'Reclutamiento', fields: ['firstName', 'lastName', 'email', 'position', 'status', 'appliedAt'] },
    { id: 'evaluations', name: 'Evaluaciones', fields: ['finalScore', 'status', 'startDate', 'endDate'] }
];

const CustomReport = () => {
    const [config, setConfig] = useState({
        module: '',
        fields: [],
        filters: {}
    });
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

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

        const headers = Object.keys(results[0]).join(',');
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
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold mb-6 flex items-center">
                <FiDatabase className="mr-3 text-cyan-500" /> Exportación Personalizada
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Module Selection */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="font-bold mb-4 flex items-center text-cyan-400">1. Seleccionar Módulo</h3>
                        <div className="space-y-2">
                            {modules.map(m => (
                                <label key={m.id} className={`flex items-center p-3 rounded cursor-pointer border ${config.module === m.id ? 'bg-cyan-900/40 border-cyan-500' : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700'}`}>
                                    <input type="radio" name="module" value={m.id} checked={config.module === m.id} onChange={handleModuleChange} className="mr-3 text-cyan-500 focus:ring-cyan-500" />
                                    <span className="font-medium">{m.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Fields Selection */}
                    {selectedModuleData && (
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h3 className="font-bold mb-4 flex items-center text-cyan-400">2. Seleccionar Campos</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {selectedModuleData.fields.map(field => (
                                    <label key={field} className="flex items-center space-x-2 text-sm text-gray-300">
                                        <input type="checkbox" checked={config.fields.includes(field)} onChange={() => toggleField(field)} className="rounded text-cyan-500 focus:ring-cyan-500 bg-gray-700 border-gray-600" />
                                        <span>{field}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filters (Simplified for Demo) */}
                    {config.module && (
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h3 className="font-bold mb-4 flex items-center text-cyan-400">3. Filtros Opcionales</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-400">Departamento (Exacto)</label>
                                    <input type="text" className="w-full bg-gray-700 border-gray-600 rounded p-2 text-sm mt-1"
                                        placeholder="Ej: IT, HR"
                                        onChange={e => setConfig({ ...config, filters: { ...config.filters, department: e.target.value } })} />
                                </div>
                                <div className="pt-4">
                                    <button onClick={handleGenerate} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg flex justify-center items-center shadow-lg transition-all">
                                        {loading ? <span className="animate-spin mr-2">⏳</span> : <FiPlay className="mr-2" />} Generar Reporte
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 h-full flex flex-col">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center"><FiCheckSquare className="mr-2" /> Vista Previa</h3>
                            {results && (
                                <button onClick={downloadCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold flex items-center text-sm">
                                    <FiDownload className="mr-2" /> Descargar CSV
                                </button>
                            )}
                        </div>

                        <div className="p-0 flex-grow overflow-auto custom-scrollbar">
                            {!results ? (
                                <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                                    <FiDatabase size={48} className="mb-4 opacity-50" />
                                    <p>Selecciona un módulo y genera el reporte para ver los datos.</p>
                                </div>
                            ) : results.length === 0 ? (
                                <div className="h-64 flex items-center justify-center text-gray-400">No hay datos que coincidan con los filtros.</div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-900 text-gray-400 uppercase sticky top-0">
                                        <tr>
                                            {Object.keys(results[0]).map(header => (
                                                <th key={header} className="p-4 border-b border-gray-700 whitespace-nowrap">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {results.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-700/50">
                                                {Object.values(row).map((val, i) => (
                                                    <td key={i} className="p-4 whitespace-nowrap text-gray-300">
                                                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        {results && (
                            <div className="p-4 border-t border-gray-700 text-xs text-gray-500 text-right">
                                Mostrando {results.length} registros
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomReport;
