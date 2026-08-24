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
        <div className="space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <FiTrendingUp className="text-blue-600" /> Métricas de Crecimiento y Tracción
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Indicadores clave de ingresos recurrentes, adquisición de clientes y ciclo de vida.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white p-4 rounded border border-gray-200 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{card.title}</span>
                            <span className="text-gray-400">{card.icon}</span>
                        </div>
                        <h3 className="text-xl font-mono font-bold text-gray-900 tabular-nums">{card.value}</h3>
                        <p className="text-[11px] text-gray-500">{card.detail}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white rounded border border-gray-200 p-4 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900 uppercase tracking-wider text-xs">Evolución de Ingresos Recurrentes (MRR)</h3>
                        <span className="text-[11px] text-gray-400 font-mono">Semestre en curso</span>
                    </div>
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#64748b'}}
                                    dy={5}
                                />
                                <YAxis hide />
                                <Tooltip 
                                    contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '11px'}}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#2563eb" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorValue)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Units Economics */}
                <div className="bg-white rounded border border-gray-200 p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                        <h3 className="font-semibold uppercase tracking-wider text-gray-900 text-xs pb-2 border-b border-gray-100">Economía de Unidad</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-end mb-1.5 font-mono">
                                    <span className="text-xs text-gray-500 font-sans">Ratio LTV / CAC</span>
                                    <span className={`text-xl font-bold tabular-nums ${metrics?.isSustainable ? 'text-green-700' : 'text-amber-700'}`}>
                                        {metrics?.unitEconomics || '0.0'}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${metrics?.isSustainable ? 'bg-green-600' : 'bg-amber-500'}`} 
                                        style={{ width: `${Math.min((metrics?.unitEconomics || 0) * 10, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1.5 leading-tight">Un ratio {'>'} 3.0 refleja un modelo comercialmente eficiente.</p>
                            </div>

                            <div className="p-3 rounded bg-gray-50 border border-gray-200 text-xs space-y-1">
                                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Diagnóstico de Viabilidad</span>
                                <div className="flex items-center gap-1.5 font-medium">
                                    <span className={`inline-block w-2 h-2 rounded-full ${metrics?.isSustainable ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                    <span className="text-gray-800">{metrics?.isSustainable ? 'Estructura Saludable' : 'Optimización Requerida'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GrowthMetrics;
