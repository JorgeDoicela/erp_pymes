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
        <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center text-slate-800">
                <FiDatabase className="mr-3 text-cyan-600" /> Exportación Personalizada
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Module Selection */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold mb-4 flex items-center text-cyan-600">1. Seleccionar Módulo</h3>
                        <div className="space-y-2">
                            {modules.map(m => (
                                <label key={m.id} className={`flex items-center p-3 rounded-lg cursor-pointer border transition-all ${config.module === m.id ? 'bg-cyan-50 border-cyan-500 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                                    <input type="radio" name="module" value={m.id} checked={config.module === m.id} onChange={handleModuleChange} className="mr-3 text-cyan-600 focus:ring-cyan-500" />
                                    <span className="font-medium text-slate-700">{m.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Fields Selection */}
                    {selectedModuleData && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold mb-4 flex items-center text-cyan-600">2. Seleccionar Campos</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {selectedModuleData.fields.map(field => (
                                    <label key={field} className="flex items-center space-x-2 text-sm text-slate-600">
                                        <input type="checkbox" checked={config.fields.includes(field)} onChange={() => toggleField(field)} className="rounded text-cyan-600 focus:ring-cyan-500 bg-white border-slate-300" />
                                        <span>{field}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filters (Simplified for Demo) */}
                    {config.module && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold mb-4 flex items-center text-cyan-600">3. Filtros Opcionales</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Departamento (Exacto)</label>
                                    <input type="text" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm mt-1 text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                        placeholder="Ej: IT, HR"
                                        onChange={e => setConfig({ ...config, filters: { ...config.filters, department: e.target.value } })} />
                                </div>
                                <div className="pt-4">
                                    <button onClick={handleGenerate} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg flex justify-center items-center shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100">
                                        {loading ? <span className="animate-spin mr-2">⏳</span> : <FiPlay className="mr-2" />} Generar Reporte
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg flex items-center text-slate-800"><FiCheckSquare className="mr-2" /> Vista Previa</h3>
                            {results && (
                                <button onClick={downloadCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center text-sm shadow-md transition-all active:scale-95">
                                    <FiDownload className="mr-2" /> Descargar CSV
                                </button>
                            )}
                        </div>

                        <div className="p-0 flex-grow overflow-auto custom-scrollbar">
                            {!results ? (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                                    <FiDatabase size={48} className="mb-4 opacity-30" />
                                    <p className="font-medium italic">Selecciona un módulo y genera el reporte para ver los datos.</p>
                                </div>
                            ) : results.length === 0 ? (
                                <div className="h-64 flex items-center justify-center text-slate-400 italic">No hay datos que coincidan con los filtros.</div>
                            ) : (
                                    <thead className="bg-slate-50 text-slate-500 uppercase sticky top-0 font-semibold">
                                        <tr>
                                            {Object.keys(results[0]).map(header => (
                                                <th key={header} className="p-4 border-b border-slate-100 whitespace-nowrap text-xs tracking-wider">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {results.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                                {Object.values(row).map((val, i) => (
                                                    <td key={i} className="p-4 whitespace-nowrap text-slate-600">
                                                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
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
                    <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-right bg-slate-50/30">
                        Mostrando {results.length} registros
                    </div>
                )}
            </div>
        </div>
            </div >
        </div >
    );
};

export default CustomReport;
