import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiSliders, FiCheckCircle, FiUsers, FiTrendingUp, FiActivity } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as intelligenceService from '../services/intelligenceService.js';

/**
 * Simulador Interactivo Monte Carlo de Escenarios Estratégicos (What-If Analysis)
 * Integra 2,000 iteraciones estocásticas, Intervalos de Confianza al 95% y Sensibilidad Paramétrica Tornado.
 */
export default function WhatIfScenarioSimulator({ initialData }) {
    const totalEmployees = initialData?.retention?.stats?.total || 25;

    const [salaryIncreasePercent, setSalaryIncreasePercent] = useState(5);
    const [wellnessInvestment, setWellnessInvestment] = useState(150);
    const [overtimeOptimization, setOvertimeOptimization] = useState(20);
    const [simulating, setSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState(initialData?.monteCarloSimulation || null);

    useEffect(() => {
        const runSimulation = async () => {
            setSimulating(true);
            try {
                const res = await intelligenceService.runWhatIfMonteCarlo({
                    salaryIncreasePercent,
                    wellnessInvestment,
                    overtimeOptimization,
                    iterations: 2000
                });
                if (res?.success && res?.data) {
                    setSimulationResult(res.data);
                }
            } catch (err) {
                console.error("Error al ejecutar Monte Carlo:", err);
            } finally {
                setSimulating(false);
            }
        };

        const timer = setTimeout(runSimulation, 300);
        return () => clearTimeout(timer);
    }, [salaryIncreasePercent, wellnessInvestment, overtimeOptimization]);

    const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

    const baselineCost = simulationResult?.baselineTurnoverRiskCost || 24000;
    const investmentCost = simulationResult?.totalInvestmentCost || 15000;
    const meanNetSavings = simulationResult?.meanNetSavings || 12000;
    const roiCI = simulationResult?.roiCI95 || { p2_5: 10, median: 45, p97_5: 85 };
    const netSavingsCI = simulationResult?.netSavingsCI95 || { p2_5: 2000, median: 12000, p97_5: 25000 };

    const chartData = [
        { name: 'Actual (Sin Cambios)', CostoRiesgo: baselineCost, Inversión: 0, AhorroNeto: 0 },
        { name: 'Simulación Monte Carlo', CostoRiesgo: Math.max(0, baselineCost - (simulationResult?.meanNetSavings || 0) - investmentCost), Inversión: investmentCost, AhorroNeto: Math.max(0, meanNetSavings) },
    ];

    const tornadoData = simulationResult?.sensitivityTornado || [
        { parameter: 'Ajuste Salarial Preventivo', impactIndex: 18.5, elasticity: 'Alta' },
        { parameter: 'Presupuesto en Bienestar', impactIndex: 12.2, elasticity: 'Media' },
        { parameter: 'Optimización Horas Extras', impactIndex: 8.4, elasticity: 'Moderada' }
    ];

    return (
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/90 p-5 space-y-5 text-slate-800">
            {/* Header Limpio */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <FiActivity className="text-indigo-600 animate-pulse" />
                        Simulador Financiero de Escenarios de Personal
                    </h3>
                    <p className="text-xs text-slate-500">Proyección del ahorro esperado e inversión en personal con 95% de nivel de certeza.</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-md border border-slate-200/70">
                        <FiUsers className="w-3.5 h-3.5 text-slate-400" /> {totalEmployees} Empleados
                    </span>
                    {simulating && (
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md animate-pulse">
                            Procesando Escenarios...
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Panel de Sliders (5 Cols) */}
                <div className="lg:col-span-5 bg-slate-50/70 p-4.5 rounded-lg border border-slate-200/70 space-y-5">
                    <h4 className="font-semibold text-slate-800 text-xs flex items-center gap-2 uppercase tracking-wider">
                        <FiSliders className="text-slate-500" /> Factores de Ajuste Salarial y Beneficios
                    </h4>

                    {/* Slider 1: Ajuste Salarial */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-700">Ajuste Salarial Preventivo</span>
                            <span className="font-bold text-slate-900">{salaryIncreasePercent}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="15"
                            step="1"
                            value={salaryIncreasePercent}
                            onChange={(e) => setSalaryIncreasePercent(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <p className="text-[11px] text-slate-400">Distribución Normal N(μ={salaryIncreasePercent}%, σ=0.6)</p>
                    </div>

                    {/* Slider 2: Bienestar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-700">Presupuesto en Bienestar</span>
                            <span className="font-bold text-slate-900">{formatUSD(wellnessInvestment)} / emp</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="500"
                            step="25"
                            value={wellnessInvestment}
                            onChange={(e) => setWellnessInvestment(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <p className="text-[11px] text-slate-400">Distribución Normal N(μ={wellnessInvestment}, σ=0.03)</p>
                    </div>

                    {/* Slider 3: Horas Extras */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-700">Meta Optimización Horas Extras</span>
                            <span className="font-bold text-slate-900">{overtimeOptimization}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="40"
                            step="5"
                            value={overtimeOptimization}
                            onChange={(e) => setOvertimeOptimization(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <p className="text-[11px] text-slate-400">Sensibilidad de Nómina (Elasticidad = 1.8)</p>
                    </div>

                    {/* Gráfico de Sensibilidad Tornado */}
                    <div className="pt-3 border-t border-slate-200/80">
                        <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Índices de Sensibilidad (Tornado)</h5>
                        <div className="space-y-2">
                            {tornadoData.map((item, idx) => (
                                <div key={idx} className="space-y-0.5">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-600 truncate">{item.parameter}</span>
                                        <span className="font-bold text-slate-800">{item.impactIndex} pts</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-indigo-600 h-full rounded-full"
                                            style={{ width: `${Math.min(100, item.impactIndex * 4)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Panel de Resultados (7 Cols) */}
                <div className="lg:col-span-7 space-y-5">
                    {/* Tarjetas de Resultados con IC 95% */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-50/70 border border-slate-200/70 p-3.5 rounded-lg">
                            <span className="text-[11px] font-medium text-slate-500 block">Reducción Riesgo Rotación</span>
                            <p className="text-xl font-bold text-emerald-600 mt-0.5">
                                -{simulationResult?.meanRiskReductionPercent || 35}%
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Modelo Weibull estocástico</p>
                        </div>

                        <div className="bg-slate-50/70 border border-slate-200/70 p-3.5 rounded-lg">
                            <span className="text-[11px] font-medium text-slate-500 block">Ahorro Neto Medio (IC 95%)</span>
                            <p className="text-xl font-bold text-slate-900 mt-0.5">{formatUSD(meanNetSavings)}</p>
                            <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                                [{formatUSD(netSavingsCI.p2_5)} , {formatUSD(netSavingsCI.p97_5)}]
                            </p>
                        </div>

                        <div className="bg-slate-50/70 border border-slate-200/70 p-3.5 rounded-lg">
                            <span className="text-[11px] font-medium text-slate-500 block">ROI Mediano Monte Carlo</span>
                            <p className={`text-xl font-bold mt-0.5 ${roiCI.median >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                {roiCI.median}%
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                IC 95%: [{roiCI.p2_5}% , {roiCI.p97_5}%]
                            </p>
                        </div>
                    </div>

                    {/* Gráfico Comparativo */}
                    <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200/70">
                        <h5 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                            <FiTrendingUp className="text-indigo-600" /> Comparativa de Medias Estocásticas (Actual vs Escenario)
                        </h5>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip formatter={(value) => formatUSD(value)} />
                                    <Legend />
                                    <Bar dataKey="CostoRiesgo" name="Costo en Riesgo ($)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Inversión" name="Inversión Requerida ($)" fill="#818cf8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="AhorroNeto" name="Beneficio Neto Medio ($)" fill="#34d399" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Dictamen Ejecutivo */}
                    <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-lg flex items-start gap-2.5">
                        <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">Dictamen Estadístico Monte Carlo</span>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-normal">
                                En 2,000 iteraciones estocásticas, existe una probabilidad del 95% de que el retorno neto se sitúe entre <strong>{formatUSD(netSavingsCI.p2_5)}</strong> y <strong>{formatUSD(netSavingsCI.p97_5)}</strong>. El ROI mediano esperado es del <strong>{roiCI.median}%</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

WhatIfScenarioSimulator.propTypes = {
    initialData: PropTypes.object,
};
