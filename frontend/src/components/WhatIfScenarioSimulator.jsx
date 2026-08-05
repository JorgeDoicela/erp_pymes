import { useState } from 'react';
import { FiSliders, FiCheckCircle, FiUsers, FiTrendingUp } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Simulador Interactivo de Escenarios Estratégicos (What-If Analysis)
 * Diseño Ultra-Minimalista: Limpio, tonos neutros y visualización ejecutiva sobria
 */
export default function WhatIfScenarioSimulator({ initialData }) {
    const totalEmployees = initialData?.retention?.stats?.total || 25;
    const highRiskCount = initialData?.retention?.stats?.highRisk || 3;
    const mediumRiskCount = initialData?.retention?.stats?.mediumRisk || 5;
    const baseAvgSalary = 850;

    const [salaryIncreasePercent, setSalaryIncreasePercent] = useState(5);
    const [wellnessInvestment, setWellnessInvestment] = useState(150);
    const [overtimeOptimization, setOvertimeOptimization] = useState(20);

    const annualBaseSalaryCost = totalEmployees * baseAvgSalary * 12;
    const directSalaryIncreaseCost = annualBaseSalaryCost * (salaryIncreasePercent / 100);
    const wellnessTotalCost = totalEmployees * wellnessInvestment;
    const totalInvestmentCost = Math.round(directSalaryIncreaseCost + wellnessTotalCost);

    const retentionRiskReductionPercent = Math.min(65, Math.round((salaryIncreasePercent * 3.5) + (wellnessInvestment * 0.12)));
    const baselineTurnoverRiskCost = (highRiskCount * baseAvgSalary * 12 * 0.35) + (mediumRiskCount * baseAvgSalary * 12 * 0.15);
    const avoidedTurnoverCost = Math.round(baselineTurnoverRiskCost * (retentionRiskReductionPercent / 100));

    const overtimeSavings = Math.round((totalEmployees * 45 * 12) * (overtimeOptimization / 100));
    const totalGrossSavings = avoidedTurnoverCost + overtimeSavings;
    const netROIAmount = totalGrossSavings - totalInvestmentCost;
    const netROIPercent = totalInvestmentCost > 0 ? Math.round((netROIAmount / totalInvestmentCost) * 100) : 0;

    const chartData = [
        { name: 'Sin Cambios (Actual)', CostoRiesgo: Math.round(baselineTurnoverRiskCost), Inversión: 0, AhorroNeto: 0 },
        { name: 'Escenario Simulado', CostoRiesgo: Math.round(baselineTurnoverRiskCost - avoidedTurnoverCost), Inversión: totalInvestmentCost, AhorroNeto: Math.max(0, netROIAmount) },
    ];

    const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200/90 p-5 space-y-5 text-slate-800">
            {/* Header Limpio */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        Calculadora de Impacto Financiero y Retención
                    </h3>
                    <p className="text-xs text-slate-500">Simulación de escenarios de decisión para la alta dirección</p>
                </div>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 px-3 py-1 rounded-md border border-slate-200/70">
                    <FiUsers className="w-3.5 h-3.5 text-slate-400" /> {totalEmployees} Empleados Evaluados
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Panel de Sliders Neutro (5 Cols) */}
                <div className="lg:col-span-5 bg-slate-50/70 p-4.5 rounded-lg border border-slate-200/70 space-y-5">
                    <h4 className="font-semibold text-slate-800 text-xs flex items-center gap-2 uppercase tracking-wider">
                        <FiSliders className="text-slate-500" /> Parámetros del Escenario
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
                        <p className="text-[11px] text-slate-400">Costo directo: {formatUSD(directSalaryIncreaseCost)}/año</p>
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
                        <p className="text-[11px] text-slate-400">Inversión anual: {formatUSD(wellnessTotalCost)}</p>
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
                        <p className="text-[11px] text-slate-400">Ahorro en nómina: {formatUSD(overtimeSavings)}/año</p>
                    </div>
                </div>

                {/* Panel de Resultados Neutros (7 Cols) */}
                <div className="lg:col-span-7 space-y-5">
                    {/* Tarjetas de Resultados Sobrias */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-50/70 border border-slate-200/70 p-3.5 rounded-lg">
                            <span className="text-[11px] font-medium text-slate-500 block">Reducción Riesgo Rotación</span>
                            <p className="text-xl font-bold text-emerald-600 mt-0.5">-{retentionRiskReductionPercent}%</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Talento retenido con éxito</p>
                        </div>

                        <div className="bg-slate-50/70 border border-slate-200/70 p-3.5 rounded-lg">
                            <span className="text-[11px] font-medium text-slate-500 block">Ahorro Bruto por Retención</span>
                            <p className="text-xl font-bold text-slate-900 mt-0.5">{formatUSD(avoidedTurnoverCost)}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Costo de sustitución ahorrado</p>
                        </div>

                        <div className="bg-slate-50/70 border border-slate-200/70 p-3.5 rounded-lg">
                            <span className="text-[11px] font-medium text-slate-500 block">ROI Neto Estimado</span>
                            <p className={`text-xl font-bold mt-0.5 ${netROIAmount >= 0 ? 'text-indigo-600' : 'text-slate-700'}`}>
                                {netROIPercent}%
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{formatUSD(netROIAmount)} neto</p>
                        </div>
                    </div>

                    {/* Gráfico Comparativo Muted */}
                    <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200/70">
                        <h5 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                            <FiTrendingUp className="text-indigo-600" /> Comparativa de Costos: Actual vs Escenario Simulado
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
                                    <Bar dataKey="AhorroNeto" name="Beneficio Neto ($)" fill="#34d399" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Dictamen Ejecutivo Claro y Minimalista */}
                    <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-lg flex items-start gap-2.5">
                        <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">Dictamen Ejecutivo Automático</span>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-normal">
                                {netROIAmount > 0
                                    ? `Este escenario genera un impacto positivo neto de ${formatUSD(netROIAmount)} al reducir el riesgo de fuga de talentos clave en un ${retentionRiskReductionPercent}%. La inversión se recupera en un período inferior a 4 meses.`
                                    : `El costo de la inversión (${formatUSD(totalInvestmentCost)}) supera el retorno inmediato. Se recomienda focalizar el ajuste salarial únicamente en los puestos con Riesgo Alto.`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
