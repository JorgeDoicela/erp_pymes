import { useState, useEffect } from 'react';
import { getSatisfactionReport } from '../../services/analytics.service';
import { FiSmile, FiMeh, FiFrown, FiHeart, FiMessageSquare } from 'react-icons/fi';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const SatisfactionReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="min-h-screen bg-slate-50 text-slate-800 p-8">Analizando clima laboral...</div>;

    // Fallback UI if no data
    if (!data || !data.surveyTitle) return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
            <h1 className="text-3xl font-bold mb-4 text-slate-800">Clima Laboral</h1>
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
                <p className="text-slate-500 mb-4 font-medium">No hay encuestas activas o resultados disponibles.</p>
                <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white font-bold transition-all shadow-md active:scale-95">Lanzar Nueva Encuesta</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex flex-wrap items-center text-slate-800">
                <FiHeart className="mr-3 text-slate-800" /> Clima Laboral: {data.surveyTitle}
            </h1>
            <p className="text-slate-500 mb-8 font-medium text-sm md:text-base">Análisis de Satisfacción y Cultura Organizacional</p>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                    <p className="text-slate-500 text-xs md:text-sm uppercase tracking-wider font-semibold">Índice de Satisfacción</p>
                    <div className="mt-4 flex justify-center items-end gap-1">
                        <span className="text-4xl md:text-5xl font-bold text-slate-800">{data.index}</span>
                        <span className="text-lg md:text-xl text-slate-400 mb-1 font-medium">/100</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
                    <p className="text-slate-500 text-xs md:text-sm uppercase tracking-wider font-semibold">eNPS (Net Promoter Score)</p>
                    <div className="mt-4 flex justify-center items-end">
                        <span className={`text-4xl md:text-5xl font-bold ${data.nps > 0 ? 'text-green-600' : 'text-red-600'}`}>{data.nps}</span>
                    </div>
                    <p className="text-[10px] md:text-xs text-slate-400 mt-2 font-medium">Promotores vs Detractores</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
                    <p className="text-slate-500 text-xs md:text-sm uppercase tracking-wider font-semibold">Participación</p>
                    <div className="mt-4 flex justify-center items-end gap-1">
                        <span className="text-4xl md:text-5xl font-bold text-slate-800">{data.participation}</span>
                        <span className="text-lg md:text-xl text-slate-400 mb-1 font-medium">respuestas</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Radar Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold mb-6 text-center text-slate-800">Análisis por Dimensiones</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.dimensions}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                                <Radar name="Puntuación" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Comments Feed */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold mb-6 flex items-center text-slate-800"><FiMessageSquare className="mr-2" /> Comentarios Recientes</h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {data.comments.map((comment, index) => (
                            <div key={index} className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                                <p className="text-slate-600 italic mb-2">"{comment.text}"</p>
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">{comment.dept}</span>
                            </div>
                        ))}
                        {data.comments.length === 0 && <p className="text-slate-400 text-center py-8 italic">No hay comentarios.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SatisfactionReport;
