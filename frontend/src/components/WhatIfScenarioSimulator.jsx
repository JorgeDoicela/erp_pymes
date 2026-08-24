import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiSliders, FiCheckCircle, FiUsers, FiTrendingUp, FiActivity } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as intelligenceService from '../services/intelligenceService.js';

/**
 * Simulador de Escenarios Financieros y Retención de Talento
 * Diseñado para pequeñas y medianas empresas:
 * Permite ajustar sueldos, bienestar y horas extras para proyectar ahorros netos y retorno de inversión.
 */
export default function WhatIfScenarioSimulator({ initialData }) {
    const totalEmployees = initialData?.retention?.stats?.total || 0;

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
                console.error("Error al simular escenarios:", err);
            } finally {
                setSimulating(false);
            }
        };

        const timer = setTimeout(runSimulation, 300);
        return () => clearTimeout(timer);
    }, [salaryIncreasePercent, wellnessInvestment, overtimeOptimization]);

    const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

    const baselineCost = simulationResult?.baselineTurnoverRiskCost || 0;
    const investmentCost = simulationResult?.totalInvestmentCost || 0;
    const meanNetSavings = simulationResult?.meanNetSavings || 0;
    const roiCI = simulationResult?.roiCI95 || { p2_5: 0, median: 0, p97_5: 0 };
    const netSavingsCI = simulationResult?.netSavingsCI95 || { p2_5: 0, median: 0, p97_5: 0 };

    const chartData = [
        { name: 'Situación Actual', CostoRiesgo: baselineCost, Inversión: 0, AhorroNeto: 0 },
        { name: 'Escenario Simulado', CostoRiesgo: Math.max(0, baselineCost - (simulationResult?.meanNetSavings || 0) - investmentCost), Inversión: investmentCost, AhorroNeto: Math.max(0, meanNetSavings) },
    ];

    const tornadoData = simulationResult?.sensitivityTornado || [];

    return (
        <div className="bg-white border border-gray-200 rounded p-5 space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
                <div>
                    <h3 className="text-base font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                        <FiActivity className="text-blue-600" />
                        Simulador de Escenarios Financieros y Retención
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Calcula cuánto dinero puedes ahorrar al año en reemplazos y liquidaciones ajustando sueldos y beneficios.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs text-gray-600 font-medium flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded border border-gray-200 font-mono">
                        <FiUsers className="w-3.5 h-3.5 text-gray-400" /> {totalEmployees} Colaboradores
                    </span>
                    {simulating && (
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded animate-pulse">
                            Calculando...
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Panel de Controles (5 Cols) */}
                <div className="lg:col-span-5 bg-gray-50 p-4 rounded border border-gray-200 space-y-5">
                    <h4 className="font-semibold text-gray-700 text-[11px] flex items-center gap-2 uppercase tracking-wider">
                        <FiSliders className="text-gray-500" /> Factores de Ajuste y Presupuesto
                    </h4>

                    {/* Control 1: Ajuste Salarial */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-gray-700">Aumento Salarial Preventivo</span>
                            <span className="font-bold text-gray-900 font-mono">{salaryIncreasePercent}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="15"
                            step="1"
                            value={salaryIncreasePercent}
                            onChange={(e) => setSalaryIncreasePercent(Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-blue-600"
                        />
                        <p className="text-[11px] text-gray-400">Incentivo aplicado a posiciones clave</p>
                    </div>

                    {/* Control 2: Bienestar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-gray-700">Presupuesto en Clima y Bienestar</span>
                            <span className="font-bold text-gray-900 font-mono">{formatUSD(wellnessInvestment)} / persona</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="500"
                            step="25"
                            value={wellnessInvestment}
                            onChange={(e) => setWellnessInvestment(Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-blue-600"
                        />
                        <p className="text-[11px] text-gray-400">Salud, capacitaciones y actividades de integración</p>
                    </div>

                    {/* Control 3: Horas Extras */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-gray-700">Control y Reducción de Horas Extras</span>
                            <span className="font-bold text-gray-900 font-mono">{overtimeOptimization}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="40"
                            step="5"
                            value={overtimeOptimization}
                            onChange={(e) => setOvertimeOptimization(Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-blue-600"
                        />
                        <p className="text-[11px] text-gray-400">Optimización de turnos para evitar fatiga laboral</p>
                    </div>

                    {/* Gráfico de Factores de Mayor Impacto */}
                    <div className="pt-3 border-t border-gray-200">
                        <h5 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">Factores con Mayor Impacto en la Retención</h5>
                        <div className="space-y-2">
                            {tornadoData.map((item, idx) => (
                                <div key={idx} className="space-y-0.5">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-600 truncate">{item.parameter}</span>
                                        <span className="font-bold text-gray-800 font-mono">{item.impactIndex} pts</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded"
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
                    {/* Tarjetas de Resultados */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-gray-50 border border-gray-200 p-3.5 rounded">
                            <span className="text-[11px] font-medium text-gray-500 block">Reducción de Renuncias</span>
                            <p className="text-xl font-bold text-emerald-600 mt-0.5 font-mono">
                                -{simulationResult?.meanRiskReductionPercent || 35}%
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Disminución de fugas</p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 p-3.5 rounded">
                            <span className="text-[11px] font-medium text-gray-500 block">Ahorro Neto Estimado</span>
                            <p className="text-xl font-bold text-gray-900 mt-0.5 font-mono">{formatUSD(meanNetSavings)}</p>
                            <p className="text-[10px] text-emerald-600 font-medium mt-0.5 font-mono">
                                Rango: [{formatUSD(netSavingsCI.p2_5)} - {formatUSD(netSavingsCI.p97_5)}]
                            </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 p-3.5 rounded">
                            <span className="text-[11px] font-medium text-gray-500 block">Retorno de la Inversión (ROI)</span>
                            <p className={`text-xl font-bold mt-0.5 font-mono ${roiCI.median >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                +{roiCI.median}%
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                                Estimado: [{roiCI.p2_5}% - {roiCI.p97_5}%]
                            </p>
                        </div>
                    </div>

                    {/* Gráfico Comparativo */}
                    <div className="bg-white p-4 rounded border border-gray-200 space-y-2">
                        <h5 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                            <FiTrendingUp className="text-blue-600" /> Comparativa Financiera: Situación Actual vs. Escenario Simulado
                        </h5>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip formatter={(value) => formatUSD(value)} />
                                    <Legend />
                                    <Bar dataKey="CostoRiesgo" name="Costo en Riesgo ($)" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="Inversión" name="Inversión Requerida ($)" fill="#60a5fa" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="AhorroNeto" name="Beneficio Neto Estimado ($)" fill="#10b981" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Dictamen Ejecutivo para PyMEs */}
                    <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded flex items-start gap-2.5">
                        <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">Conclusión Ejecutiva del Escenario</span>
                            <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed font-normal">
                                Al aplicar esta combinación de medidas, tu empresa proyecta un ahorro neto estimado de <strong>{formatUSD(meanNetSavings)}</strong> al año, con un retorno de inversión (ROI) del <strong>+{roiCI.median}%</strong> en reducción de costos de reclutamiento y capacitación de nuevo personal.
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
