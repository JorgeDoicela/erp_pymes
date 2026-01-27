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

    if (loading) return <div className="min-h-screen bg-gray-900 text-white p-8">Analizando clima laboral...</div>;

    // Fallback UI if no data
    if (!data || !data.surveyTitle) return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-4">Clima Laboral</h1>
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center">
                <p className="text-gray-400 mb-4">No hay encuestas activas o resultados disponibles.</p>
                <button className="bg-blue-600 px-4 py-2 rounded text-white font-bold">Lanzar Nueva Encuesta</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center">
                <FiHeart className="mr-3 text-white" /> Clima Laboral: {data.surveyTitle}
            </h1>
            <p className="text-gray-400 mb-8">Análisis de Satisfacción y Cultura Organizacional</p>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Índice de Satisfacción</p>
                    <div className="mt-4 flex justify-center items-end">
                        <span className="text-5xl font-bold text-white">{data.index}</span>
                        <span className="text-xl text-gray-500 mb-1">/100</span>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider">eNPS (Net Promoter Score)</p>
                    <div className="mt-4 flex justify-center items-end">
                        <span className={`text-5xl font-bold ${data.nps > 0 ? 'text-green-400' : 'text-red-400'}`}>{data.nps}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Promotores vs Detractores</p>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Participación</p>
                    <div className="mt-4 flex justify-center items-end">
                        <span className="text-5xl font-bold text-white">{data.participation}</span>
                        <span className="text-xl text-gray-500 mb-1">respuestas</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Radar Chart */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="font-bold mb-6 text-center">Análisis por Dimensiones</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.dimensions}>
                                <PolarGrid stroke="#374151" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                                <Radar name="Puntuación" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Comments Feed */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="font-bold mb-6 flex items-center"><FiMessageSquare className="mr-2" /> Comentarios Recientes</h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {data.comments.map((comment, index) => (
                            <div key={index} className="bg-gray-700/30 p-4 rounded-lg border border-gray-700">
                                <p className="text-gray-300 italic mb-2">"{comment.text}"</p>
                                <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">{comment.dept}</span>
                            </div>
                        ))}
                        {data.comments.length === 0 && <p className="text-gray-500 text-center py-8">No hay comentarios.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SatisfactionReport;
