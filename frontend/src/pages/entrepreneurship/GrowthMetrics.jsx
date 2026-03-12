import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import entrepreneurshipService from '../../services/entrepreneurship.service';
import { FiTrendingUp, FiActivity, FiUsers, FiDollarSign, FiBarChart2, FiArrowUpRight } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GrowthMetrics = () => {
    const { id } = useParams();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    // Mock data para el gráfico de evolución (MRR)
    const chartData = [
        { month: 'Ene', value: 0 },
        { month: 'Feb', value: 400 },
        { month: 'Mar', value: 800 },
        { month: 'Abr', value: 1200 },
        { month: 'May', value: 1800 },
        { month: 'Jun', value: 2500 }
    ];

    useEffect(() => {
        fetchMetrics();
    }, [id]);

    const fetchMetrics = async () => {
        try {
            const response = await entrepreneurshipService.getGrowthMetrics(id);
            setMetrics(response.data);
        } catch (error) {
            console.error("Error loading metrics", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando métricas de crecimiento...</div>;

    const cards = [
        { title: 'MRR', value: `$${metrics?.mrr || 0}`, icon: <FiDollarSign />, color: 'emerald', detail: 'Ingresos Mensuales' },
        { title: 'Usuarios', value: metrics?.users || 0, icon: <FiUsers />, color: 'indigo', detail: 'Activos' },
        { title: 'CAC', value: `$${metrics?.cac || 0}`, icon: <FiActivity />, color: 'rose', detail: 'Costo Adquisición' },
        { title: 'LTV', value: `$${metrics?.ltv || 0}`, icon: <FiBarChart2 />, color: 'amber', detail: 'Valor de Vida' }
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <FiTrendingUp className="text-indigo-600" /> Motor de Crecimiento
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Métricas clave de tracción y rentabilidad del negocio.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-2xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center text-xl`}>
                                {card.icon}
                            </div>
                            <span className="text-emerald-500 text-xs font-black flex items-center gap-1">
                                +12% <FiArrowUpRight />
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 mb-1">{card.value}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.title}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400 font-medium">{card.detail}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-slate-700 uppercase tracking-tight text-sm">Evolución de Ingresos (MRR)</h3>
                        <select className="bg-slate-50 border-none rounded-xl text-[10px] font-black px-4 py-2 uppercase tracking-widest focus:ring-0">
                            <option>Últimos 6 meses</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip 
                                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#4f46e5" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorValue)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Units Economics */}
                <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl flex flex-col justify-between">
                    <div>
                        <h3 className="font-black uppercase tracking-[0.2em] text-indigo-400 text-[10px] mb-8">Economía de Unidad</h3>
                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-bold text-slate-400">LTV / CAC Ratio</span>
                                    <span className={`text-2xl font-black ${metrics?.isSustainable ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {metrics?.unitEconomics || '0.0'}
                                    </span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${metrics?.isSustainable ? 'bg-emerald-400' : 'bg-amber-400'}`} 
                                        style={{ width: `${Math.min((metrics?.unitEconomics || 0) * 10, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-3 font-medium">Un ratio mayor a 3.0 se considera un negocio saludable y escalable.</p>
                            </div>

                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Sostenibilidad</span>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${metrics?.isSustainable ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                                    <span className="text-xs font-black uppercase">{metrics?.isSustainable ? 'Estructura Saludable' : 'Optimización Requerida'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs transition-all border border-white/10">
                        Exportar Reporte
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GrowthMetrics;
