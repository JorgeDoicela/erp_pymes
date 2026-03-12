import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import entrepreneurshipService from '../../services/entrepreneurship.service';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    PieChart, Pie, Cell
} from 'recharts';
import { FiTrendingUp, FiDollarSign, FiZap, FiActivity } from 'react-icons/fi';

const AnalyticsView = () => {
    const { id } = useParams();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await entrepreneurshipService.getAnalytics(id);
                setAnalytics(response.data);
            } catch (error) {
                console.error("Error loading analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [id]);

    if (loading) return <div className="p-8 text-center">Analizando datos...</div>;
    if (!analytics) return <div className="p-8 text-center text-red-500">No se pudieron cargar las analíticas.</div>;

    const { successScore, financialAnalysis } = analytics;

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Resumen Superior */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2 text-indigo-600">
                        <FiZap className="text-xl" />
                        <span className="font-semibold uppercase tracking-wider text-xs">Success Score</span>
                    </div>
                    <div className="text-3xl font-bold">{successScore.totalScore}%</div>
                    <div className="text-sm text-slate-500 mt-1">{successScore.level}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2 text-emerald-600">
                        <FiDollarSign className="text-xl" />
                        <span className="font-semibold uppercase tracking-wider text-xs">Runway</span>
                    </div>
                    <div className="text-3xl font-bold">{financialAnalysis.runway} <span className="text-sm font-normal text-slate-500">meses</span></div>
                    <div className={`text-xs inline-block px-2 py-0.5 rounded-full mt-2 ${
                        financialAnalysis.healthStatus === 'HEALTHY' ? 'bg-emerald-100 text-emerald-700' :
                        financialAnalysis.healthStatus === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {financialAnalysis.healthStatus}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2 text-amber-600">
                        <FiActivity className="text-xl" />
                        <span className="font-semibold uppercase tracking-wider text-xs">Burn Rate</span>
                    </div>
                    <div className="text-3xl font-bold">${financialAnalysis.burnRate.toLocaleString()}</div>
                    <div className="text-sm text-slate-500 mt-1">Gasto mensual</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2 text-purple-600">
                        <FiTrendingUp className="text-xl" />
                        <span className="font-semibold uppercase tracking-wider text-xs">Levantado</span>
                    </div>
                    <div className="text-3xl font-bold">${financialAnalysis.totalRaised.toLocaleString()}</div>
                    <div className="text-sm text-slate-500 mt-1">Capital total</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Radar Chart de Capacidades */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Matriz de Potencial</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={successScore.factors}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 30]} tick={false} axisLine={false} />
                                <Radar
                                    name="Startup"
                                    dataKey="score"
                                    stroke="#4F46E5"
                                    fill="#4F46E5"
                                    fillOpacity={0.6}
                                />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Composición Financiera */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Salud Financiera</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Capital', value: financialAnalysis.totalRaised },
                                { name: 'Presupuesto', value: financialAnalysis.availableCash },
                                { name: 'Gasto', value: financialAnalysis.burnRate }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    { [0,1,2].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Mentores Recomendados */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Mentores Recomendados (Match AI)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {analytics.recommendedMentors.map((mentor) => (
                        <div key={mentor.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                    {mentor.name.charAt(0)}
                                </div>
                                <span className="bg-white px-2 py-0.5 rounded-lg border border-slate-100 text-[10px] font-bold text-emerald-600">
                                    {mentor.matchScore}% MATCH
                                </span>
                            </div>
                            <h4 className="font-bold text-slate-800">{mentor.name}</h4>
                            <p className="text-xs text-slate-500">{mentor.position}</p>
                            <p className="text-[10px] font-medium text-indigo-600 mt-2 uppercase">{mentor.department}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
