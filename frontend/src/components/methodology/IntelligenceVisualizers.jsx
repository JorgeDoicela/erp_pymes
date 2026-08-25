import { useState, useMemo, useEffect } from 'react';

/**
 * Visualizadores Interactivos para la Ficha Metodológica de /intelligence
 * Diseñados con estética ERP sobria, de alto contraste, tipografía mono tabular y reactividad instantánea.
 */

// ─── 1. Visualizador Interactivo de Curva de Riesgo Weibull ───────────────────
export function WeibullInteractive() {
    const [tenure, setTenure] = useState(24); // meses
    const [salaryGap, setSalaryGap] = useState(-15); // % respecto a la mediana
    const [absences, setAbsences] = useState(3); // ausencias recientes
    const [isAutoSweeping, setIsAutoSweeping] = useState(false);

    // Animación automática de barrido de parámetros
    useEffect(() => {
        if (!isAutoSweeping) return;
        const steps = [
            { t: 6, s: 0, a: 0 },
            { t: 18, s: -10, a: 2 },
            { t: 24, s: -15, a: 3 },
            { t: 36, s: -25, a: 5 },
            { t: 48, s: -5, a: 1 },
            { t: 12, s: 15, a: 0 }
        ];
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % steps.length;
            setTenure(steps[idx].t);
            setSalaryGap(steps[idx].s);
            setAbsences(steps[idx].a);
        }, 2000);
        return () => clearInterval(interval);
    }, [isAutoSweeping]);

    const { riskScore, riskLevel, curvePoints } = useMemo(() => {
        const k = 1.45;
        const lambda = 48.0;
        const betaSal = -0.045;
        const betaAbs = 0.18;

        const baseHazard = (k / lambda) * Math.pow(tenure / lambda, k - 1);
        const covariateExp = Math.exp(betaSal * salaryGap + betaAbs * absences);
        const rawH = baseHazard * covariateExp;
        const score = Math.min(100, Math.max(0, Math.round(rawH * 320)));

        let level = 'Bajo Riesgo';
        if (score >= 60) {
            level = 'Alto Riesgo';
        } else if (score >= 35) {
            level = 'Riesgo Medio';
        }

        const points = [];
        for (let m = 3; m <= 60; m += 5) {
            const h_m = (k / lambda) * Math.pow(m / lambda, k - 1) * covariateExp;
            const yVal = Math.min(95, Math.round(h_m * 300));
            points.push({ m, y: yVal });
        }

        return { riskScore: score, riskLevel: level, curvePoints: points };
    }, [tenure, salaryGap, absences]);

    const svgPath = useMemo(() => {
        if (!curvePoints.length) return '';
        const width = 340;
        const height = 90;
        const maxM = 60;
        const maxY = 100;

        const coords = curvePoints.map(p => {
            const x = (p.m / maxM) * (width - 20) + 10;
            const y = height - (p.y / maxY) * (height - 20) - 10;
            return `${x},${y}`;
        });

        return `M ${coords.join(' L ')}`;
    }, [curvePoints]);

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 font-sans shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Simulador Interactivo de Riesgo Instantáneo h(t)
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsAutoSweeping(p => !p)}
                        className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                            isAutoSweeping
                                ? 'bg-gray-900 text-white border-gray-900 font-semibold'
                                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                        title="Activa o pausa la simulación automática continua"
                    >
                        {isAutoSweeping ? 'Pausar Auto' : 'Auto-Simular'}
                    </button>
                    <span className="text-xs font-mono font-bold text-gray-900 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">
                        Score: {riskScore}/100 ({riskLevel})
                    </span>
                </div>
            </div>

            <div className="bg-gray-50/60 border border-gray-200 rounded-lg p-3 relative h-28 flex flex-col justify-between">
                <div className="text-xs font-mono text-gray-500 flex justify-between font-semibold">
                    <span>Curva h(t) de Peligro</span>
                    <span>t = {tenure} meses seleccionados</span>
                </div>
                <svg className="w-full h-16 overflow-visible" viewBox="0 0 340 90">
                    <line x1="10" y1="80" x2="330" y2="80" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="10" y1="10" x2="10" y2="80" stroke="#e5e7eb" strokeWidth="1" />
                    <path d={svgPath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                    {(() => {
                        const x = (tenure / 60) * (340 - 20) + 10;
                        const y = 90 - (riskScore / 100) * (90 - 20) - 10;
                        return (
                            <circle cx={x} cy={Math.max(10, Math.min(80, y))} r="5.5" fill="#111827" stroke="#ffffff" strokeWidth="2" />
                        );
                    })()}
                </svg>
                <div className="text-[10px] font-mono text-gray-400 flex justify-between px-2 font-medium">
                    <span>0m</span>
                    <span>12m</span>
                    <span>24m</span>
                    <span>36m</span>
                    <span>48m</span>
                    <span>60m</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5 shadow-2xs">
                    <div className="flex justify-between text-gray-600">
                        <span>Antigüedad:</span>
                        <span className="font-bold text-gray-900">{tenure} meses</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="60"
                        value={tenure}
                        onChange={(e) => setTenure(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-2 bg-gray-200 rounded"
                    />
                </div>

                <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5 shadow-2xs">
                    <div className="flex justify-between text-gray-600">
                        <span>Brecha Salarial:</span>
                        <span className="font-bold text-gray-900">{salaryGap > 0 ? `+${salaryGap}%` : `${salaryGap}%`}</span>
                    </div>
                    <input
                        type="range"
                        min="-40"
                        max="40"
                        value={salaryGap}
                        onChange={(e) => setSalaryGap(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-2 bg-gray-200 rounded"
                    />
                </div>

                <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5 shadow-2xs">
                    <div className="flex justify-between text-gray-600">
                        <span>Ausencias:</span>
                        <span className="font-bold text-gray-900">{absences} días</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        value={absences}
                        onChange={(e) => setAbsences(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-2 bg-gray-200 rounded"
                    />
                </div>
            </div>
        </div>
    );
}

// ─── 2. Visualizador Interactivo de Monte Carlo & CVaR ────────────────────────
export function MonteCarloInteractive() {
    const [budget, setBudget] = useState(250);
    const [isAutoSweeping, setIsAutoSweeping] = useState(false);

    // Animación automática de barrido de presupuesto
    useEffect(() => {
        if (!isAutoSweeping) return;
        const budgets = [50, 150, 250, 350, 450, 250];
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % budgets.length;
            setBudget(budgets[idx]);
        }, 2200);
        return () => clearInterval(interval);
    }, [isAutoSweeping]);

    const simulation = useMemo(() => {
        const meanRoi = (budget * 1.85) - 100;
        const p50 = Math.round(meanRoi);
        const p10 = Math.round(meanRoi * 0.45);
        const p90 = Math.round(meanRoi * 1.55);
        const cvar95 = Math.round(p10 * 0.72);

        const bars = [
            { bin: '< -$500', count: Math.max(1, Math.round(18 - budget * 0.04)) },
            { bin: '-$250', count: Math.max(3, Math.round(35 - budget * 0.06)) },
            { bin: '$0', count: Math.max(10, Math.round(60 - budget * 0.05)) },
            { bin: '+$250', count: Math.round(90 + budget * 0.12) },
            { bin: '+$500', count: Math.round(140 + budget * 0.18) },
            { bin: '+$750', count: Math.round(110 + budget * 0.15) },
            { bin: '+$1,000', count: Math.round(70 + budget * 0.10) },
            { bin: '> +$1,250', count: Math.round(30 + budget * 0.06) },
        ];

        const maxCount = Math.max(...bars.map(b => b.count));

        return { p10, p50, p90, cvar95, bars, maxCount };
    }, [budget]);

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 font-sans shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Simulador Monte Carlo (2,000 Iteraciones)
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsAutoSweeping(p => !p)}
                        className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                            isAutoSweeping
                                ? 'bg-gray-900 text-white border-gray-900 font-semibold'
                                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                        title="Activa o pausa el barrido estocástico automático"
                    >
                        {isAutoSweeping ? 'Pausar Auto' : 'Auto-Simular'}
                    </button>
                    <span className="text-xs font-mono font-bold text-gray-900 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">
                        Presupuesto: ${budget}/colab
                    </span>
                </div>
            </div>

            <div className="bg-gray-50/60 border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-end justify-between h-20 gap-1.5 pt-1">
                    {simulation.bars.map((b, idx) => {
                        const heightPct = Math.round((b.count / simulation.maxCount) * 100);
                        const isLoss = idx < 2;
                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                                <div
                                    style={{ height: `${heightPct}%` }}
                                    className={`w-full rounded-t transition-all duration-300 ${isLoss ? 'bg-gray-400' : 'bg-blue-600'}`}
                                    title={`${b.bin}: ${b.count} iteraciones`}
                                />
                                <span className="text-[9px] font-mono text-gray-500 truncate w-full text-center">{b.bin}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="flex flex-wrap justify-between items-center text-xs font-mono border-t border-gray-200 pt-2 px-1 gap-2">
                    <span className="text-red-700 font-bold">CVaR 95%: ${simulation.cvar95}</span>
                    <span className="text-gray-600">P10: ${simulation.p10}</span>
                    <span className="text-emerald-700 font-bold">Mediana (P50): +${simulation.p50}</span>
                    <span className="text-gray-900 font-semibold">P90: +${simulation.p90}</span>
                </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5 text-xs font-mono shadow-2xs">
                <div className="flex justify-between">
                    <span className="text-gray-600">Ajustar Inversión de Retención:</span>
                    <span className="font-bold text-gray-900 text-sm">${budget} USD</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="500"
                    step="25"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-gray-200 rounded"
                />
            </div>
        </div>
    );
}

// ─── 3. Visualizador Interactivo de Scoring 360° ─────────────────────────────
export function Scoring360Interactive() {
    const [scores, setScores] = useState({
        auto: 90,
        boss: 86,
        peers: 84,
        sub: 82
    });

    const weights = { auto: 0.10, boss: 0.50, peers: 0.20, sub: 0.20 };

    const compositeScore = useMemo(() => {
        const total = (
            scores.auto * weights.auto +
            scores.boss * weights.boss +
            scores.peers * weights.peers +
            scores.sub * weights.sub
        );
        return Number(total.toFixed(1));
    }, [scores]);

    const threshold = 83.5;
    const isTopPerformer = compositeScore >= threshold;

    return (
        <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-4 space-y-3 font-sans shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Calculadora de Ponderación 360 y Matriz 9-Box
                </div>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${isTopPerformer ? 'text-gray-900 bg-gray-100 border-gray-300' : 'text-gray-700 bg-white border-gray-200'}`}>
                    Score: {compositeScore}/100 {isTopPerformer ? '(Top Performer)' : '(Core Performer)'}
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                {Object.entries(scores).map(([key, val]) => {
                    const label = key === 'auto' ? 'Auto (10%)' : key === 'boss' ? 'Jefe (50%)' : key === 'peers' ? 'Pares (20%)' : 'Sub (20%)';
                    return (
                        <div key={key} className="bg-white p-2.5 rounded-lg border border-gray-200 space-y-1 shadow-2xs">
                            <div className="text-gray-500 font-semibold truncate text-[11px]">{label}</div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-bold text-gray-900">{val}</span>
                                <span className="text-[10px] text-gray-400">/ 100</span>
                            </div>
                            <input
                                type="range"
                                min="50"
                                max="100"
                                value={val}
                                onChange={(e) => setScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-200 rounded"
                            />
                        </div>
                    );
                })}
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5 shadow-2xs">
                <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-600">Posición vs Percentil 85 (Umbral {threshold}):</span>
                    <span className={`font-bold ${isTopPerformer ? 'text-emerald-700 text-sm' : 'text-blue-700 text-sm'}`}>{compositeScore} pts</span>
                </div>
                <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        style={{ width: `${compositeScore}%` }}
                        className={`h-full transition-all ${isTopPerformer ? 'bg-emerald-600' : 'bg-blue-600'}`}
                    />
                    <div
                        style={{ left: `${threshold}%` }}
                        className="absolute top-0 bottom-0 w-1 bg-red-600 z-10"
                    />
                </div>
            </div>
        </div>
    );
}

// ─── 4. Visualizador Interactivo de ANOVA ─────────────────────────────────────
export function AnovaInteractive() {
    const depts = [
        { name: 'Ventas', mean: 68.2, variance: 'Alta', n: 24 },
        { name: 'Tecnología', mean: 84.5, variance: 'Baja', n: 18 },
        { name: 'Operaciones', mean: 71.0, variance: 'Media', n: 32 },
        { name: 'Finanzas', mean: 79.8, variance: 'Baja', n: 12 },
    ];

    return (
        <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-4 space-y-3 font-sans shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Test ANOVA Interdepartamental & Estadístico F
                </div>
                <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    F = 6.84 (p = 0.0018 &lt; 0.05) → Rechaza H0
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                {depts.map((d, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 space-y-1 shadow-2xs">
                        <div className="text-gray-600 font-semibold truncate text-[11px]">{d.name}</div>
                        <div className="text-base font-bold text-gray-900">{d.mean}%</div>
                        <div className="text-[10px] text-gray-500 font-medium">n={d.n} | Var: {d.variance}</div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div style={{ width: `${d.mean}%` }} className="h-full bg-blue-600 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs font-mono text-gray-700 flex flex-wrap justify-between items-center gap-2 shadow-2xs">
                <span>Varianza entre grupos (MS_between): <strong className="text-gray-900">42.1</strong></span>
                <span>Varianza residual (MS_within): <strong className="text-gray-900">6.15</strong></span>
                <span className="text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Welch Post-Hoc: Ventas vs TI (p=0.0004)</span>
            </div>
        </div>
    );
}

// ─── 5. Visualizador Interactivo de OHI ───────────────────────────────────────
export function OhiInteractive() {
    const [pillars, setPillars] = useState({
        clima: 75,
        retencion: 82,
        equidad: 68,
        asistencia: 90
    });

    const ohiScore = useMemo(() => {
        return Math.round(
            pillars.clima * 0.30 +
            pillars.retencion * 0.30 +
            pillars.equidad * 0.20 +
            pillars.asistencia * 0.20
        );
    }, [pillars]);

    return (
        <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-4 space-y-3 font-sans shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Síntesis de Salud Organizacional (OHI 0-100)
                </div>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${ohiScore >= 70 ? 'text-emerald-900 bg-emerald-50 border-emerald-200' : 'text-amber-900 bg-amber-50 border-amber-200'}`}>
                    OHI Total: {ohiScore}/100 — {ohiScore >= 70 ? 'Saludable' : 'Vulnerable'}
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                {Object.entries(pillars).map(([k, v]) => {
                    const weight = k === 'clima' || k === 'retencion' ? '30%' : '20%';
                    return (
                        <div key={k} className="bg-white p-3 rounded-lg border border-gray-200 space-y-1 shadow-2xs">
                            <div className="text-gray-600 capitalize text-[11px] font-semibold">{k} ({weight})</div>
                            <div className="text-base font-bold text-gray-900">{v} pts</div>
                            <input
                                type="range"
                                min="40"
                                max="100"
                                value={v}
                                onChange={(e) => setPillars(prev => ({ ...prev, [k]: Number(e.target.value) }))}
                                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-200 rounded"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── 6. Visualizador Interactivo de Integridad y Anonimización ───────────────
export function DataQualityInteractive() {
    const [anonymized, setAnonymized] = useState(true);

    return (
        <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-4 space-y-3 font-sans shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Esquema de k-Anonimato (k=5) & Hasheo SHA-256
                </div>
                <button
                    type="button"
                    onClick={() => setAnonymized(!anonymized)}
                    className="text-xs font-mono font-bold px-3 py-1 rounded-md border bg-white hover:bg-gray-50 text-blue-800 border-blue-200 cursor-pointer transition-colors shadow-2xs"
                >
                    {anonymized ? 'Ver Datos Crudos (No Seguro)' : 'Aplicar k-Anonimato'}
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden text-xs font-mono shadow-2xs">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/90 border-b border-gray-200 text-gray-600 font-bold">
                        <tr>
                            <th className="p-2.5">Identificador</th>
                            <th className="p-2.5">Cargo / Dept</th>
                            <th className="p-2.5">Salario Nominal</th>
                            <th className="p-2.5">Antigüedad</th>
                            <th className="p-2.5">Score Riesgo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-800">
                        <tr>
                            <td className="p-2.5 font-bold text-blue-900">{anonymized ? 'usr_e92a...f41b' : '0928374182 (Juan Perez)'}</td>
                            <td className="p-2.5">Desarrollador / TI</td>
                            <td className="p-2.5">{anonymized ? 'Decil 7 ($1,400-$1,800)' : '$1,650.00'}</td>
                            <td className="p-2.5">24 meses</td>
                            <td className="p-2.5 font-bold text-amber-700">0.42</td>
                        </tr>
                        <tr>
                            <td className="p-2.5 font-bold text-blue-900">{anonymized ? 'usr_104c...a89d' : '1719283741 (Maria Gomez)'}</td>
                            <td className="p-2.5">Analista / Finanzas</td>
                            <td className="p-2.5">{anonymized ? 'Decil 5 ($1,000-$1,300)' : '$1,150.00'}</td>
                            <td className="p-2.5">38 meses</td>
                            <td className="p-2.5 font-bold text-emerald-700">0.18</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="text-xs font-mono text-gray-700 flex flex-wrap justify-between items-center px-1 pt-1 gap-2">
                <span>Completitud: <strong className="text-gray-900">96.4%</strong></span>
                <span>Frescura Biométrica: <strong className="text-gray-900">94.0%</strong></span>
                <span className="text-emerald-900 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">Índice Global Q_data = 0.952</span>
            </div>
        </div>
    );
}

// ─── 7. Visualizador Interactivo de Proyección de Nómina y Burnout (Pestaña 2) ───
export function PayrollBurnoutInteractive() {
    const [monthlyBase, setMonthlyBase] = useState(48500);
    const [growthRate, setGrowthRate] = useState(2.5); // %
    const [overtimeRatio, setOvertimeRatio] = useState(14); // %
    const [absenceDays, setAbsenceDays] = useState(4);

    const projectedPayroll = useMemo(() => {
        return Math.round(monthlyBase * Math.pow(1 + growthRate / 100, 6));
    }, [monthlyBase, growthRate]);

    const burnoutScore = useMemo(() => {
        const score = Math.round((overtimeRatio / 30) * 45 + (absenceDays / 15) * 35 + 15);
        return Math.min(100, score);
    }, [overtimeRatio, absenceDays]);

    return (
        <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-4 space-y-3 font-sans shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Simulador de Proyección Salarial (6 Meses) & Sobrecarga
                </div>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                    burnoutScore > 50 
                        ? 'text-amber-900 bg-amber-50 border-amber-200' 
                        : 'text-emerald-900 bg-emerald-50 border-emerald-200'
                }`}>
                    Burnout: {burnoutScore}/100 ({burnoutScore > 50 ? 'Sobrecarga' : 'Estable'})
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5 shadow-2xs">
                    <span className="text-gray-500 block text-[11px]">Nómina Mensual Actual:</span>
                    <span className="text-sm font-bold text-gray-900 block">${monthlyBase.toLocaleString()} USD</span>
                    <input
                        type="range"
                        min="20000"
                        max="100000"
                        step="1000"
                        value={monthlyBase}
                        onChange={(e) => setMonthlyBase(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-2 bg-gray-200 rounded"
                    />
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5 shadow-2xs">
                    <span className="text-gray-500 block text-[11px]">Proyección a 6 Meses ({growthRate}% mes):</span>
                    <span className="text-sm font-bold text-blue-700 block">${projectedPayroll.toLocaleString()} USD</span>
                    <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={growthRate}
                        onChange={(e) => setGrowthRate(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-2 bg-gray-200 rounded"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-white p-3 rounded-lg border border-gray-200 shadow-2xs">
                <div className="space-y-1">
                    <span className="text-gray-600 text-[11px] block">Horas Extras vs Base: <strong className="text-gray-900 font-bold">{overtimeRatio}%</strong></span>
                    <input
                        type="range"
                        min="0"
                        max="35"
                        value={overtimeRatio}
                        onChange={(e) => setOvertimeRatio(Number(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer h-2 bg-gray-200 rounded"
                    />
                </div>
                <div className="space-y-1">
                    <span className="text-gray-600 text-[11px] block">Ausencias promedio / mes: <strong className="text-gray-900 font-bold">{absenceDays} días</strong></span>
                    <input
                        type="range"
                        min="0"
                        max="12"
                        value={absenceDays}
                        onChange={(e) => setAbsenceDays(Number(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer h-2 bg-gray-200 rounded"
                    />
                </div>
            </div>
        </div>
    );
}

