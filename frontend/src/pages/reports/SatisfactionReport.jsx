import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSatisfactionReport } from '../../services/analytics.service';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { FiArrowLeft, FiBookOpen } from 'react-icons/fi';
import AnalyticsMethodologyModal from '../../components/analytics/AnalyticsMethodologyModal';

const SatisfactionReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        setLoading(true);
        try {
            const result = await getSatisfactionReport();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400 text-xs font-mono">Analizando indicador de clima laboral...</div>;

    if (!data || !data.surveyTitle) return (
        <div className="space-y-5">
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider font-mono">Cultura y Clima</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">Encuesta de Clima Laboral</h1>
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
            <div className="bg-white p-12 rounded border border-gray-200 text-center text-xs text-gray-500">
                <p className="font-medium text-gray-700">No hay encuestas activas o resultados disponibles.</p>
                <p className="text-xs text-gray-400 mt-1">Configura una nueva evaluación de clima laboral en la sección de gestión.</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider font-mono">Cultura & Satisfacción</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">Clima Laboral: {data.surveyTitle}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Análisis de satisfacción interna, eNPS y percepción de la cultura organizacional.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        to="/analytics"
                        className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                        <FiArrowLeft className="w-3.5 h-3.5" />
                        <span>Volver a Analíticas</span>
                    </Link>
                    <button
                        onClick={() => setIsMethodologyOpen(true)}
                        className="border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                        <FiBookOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ficha Técnica</span>
                    </button>
                </div>
            </div>

            {/* Modal de Ficha Técnica Contextual */}
            <AnalyticsMethodologyModal
                isOpen={isMethodologyOpen}
                onClose={() => setIsMethodologyOpen(false)}
                defaultSection="satisfaction"
            />

            {/* Resumen Estilo Informe Contable / Balance */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Índices Consolidados de Encuesta</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 text-xs">
                    <div className="p-4 flex items-center justify-between">
                        <span className="text-gray-600">Índice de Satisfacción General</span>
                        <span className="text-sm font-semibold font-mono text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            {data.index} / 100
                        </span>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <span className="text-gray-600">Recomendación eNPS</span>
                        <span className={`text-sm font-semibold font-mono ${data.nps > 0 ? 'text-green-700' : 'text-red-700'}`} style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            {data.nps} ptos
                        </span>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <span className="text-gray-600">Participación de Empleados</span>
                        <span className="text-sm font-semibold font-mono text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            {data.participation} respuestas
                        </span>
                    </div>
                </div>
            </div>

            {/* Gráfico Radar + Feed Comentarios ERP */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Análisis por Dimensiones</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.dimensions}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                                <Radar name="Puntuación" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Comentarios Recientes de la Plantilla</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {data.comments.map((comment, index) => (
                            <div key={index} className="bg-gray-50/70 p-3 rounded border border-gray-100 text-xs space-y-1">
                                <p className="text-gray-700 italic">"{comment.text}"</p>
                                <span className="font-mono text-[10px] text-gray-400 block">{comment.dept}</span>
                            </div>
                        ))}
                        {data.comments.length === 0 && <div className="text-gray-400 text-center py-8 text-xs italic">No hay comentarios registrados.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SatisfactionReport;
