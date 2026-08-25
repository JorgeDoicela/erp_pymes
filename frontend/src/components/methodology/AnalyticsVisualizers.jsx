import { useState, useMemo, useEffect } from 'react';

/**
 * Visualizadores Interactivos para la Ficha Científica de /analytics (Motores de IA)
 * Diseñados con estética ERP sobria, de alto contraste, tipografía mono tabular y reactividad instantánea.
 */

// ─── AI-1. Visualizador Interactivo de Calibración RSI & Brier Score ──────────
export function RsiCalibrationInteractive() {
    const [modelMode, setModelMode] = useState('calibrated'); // 'calibrated' | 'heuristic'

    const bins = [
        { pred: '0.10', obsCal: '0.09', obsHeu: '0.24' },
        { pred: '0.30', obsCal: '0.31', obsHeu: '0.52' },
        { pred: '0.50', obsCal: '0.48', obsHeu: '0.70' },
        { pred: '0.70', obsCal: '0.72', obsHeu: '0.86' },
        { pred: '0.90', obsCal: '0.89', obsHeu: '0.95' },
    ];

    const brier = modelMode === 'calibrated' ? 0.145 : 0.218;
    const ksValue = modelMode === 'calibrated' ? '0.041 (Aprobado)' : '0.128 (Rechazado)';

    return (
        <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-4 space-y-3 font-sans shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Curva de Calibración Probabilística & Brier Score
                </div>
                <div className="flex border border-gray-200 rounded-md overflow-hidden text-xs font-mono shadow-2xs">
                    <button
                        type="button"
                        onClick={() => setModelMode('calibrated')}
                        className={`px-3 py-1 cursor-pointer font-bold transition-colors ${modelMode === 'calibrated' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                        RSI Calibrado (MCMC)
                    </button>
                    <button
                        type="button"
                        onClick={() => setModelMode('heuristic')}
                        className={`px-3 py-1 cursor-pointer border-l border-gray-200 transition-colors ${modelMode === 'heuristic' ? 'bg-gray-900 text-white font-bold' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                        Heurístico (Reglas)
                    </button>
                </div>
            </div>

            {/* Diagrama de fiabilidad */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs font-mono space-y-2">
                <div className="flex justify-between text-gray-500 font-semibold pb-1.5 border-b border-gray-100 text-[11px] uppercase tracking-wider">
                    <span>Probabilidad Predicha</span>
                    <span>Frecuencia Real Observada</span>
                    <span>Desviación Absoluta</span>
                </div>
                {bins.map((b, idx) => {
                    const obs = modelMode === 'calibrated' ? Number(b.obsCal) : Number(b.obsHeu);
                    const pred = Number(b.pred);
                    const diff = Math.abs(pred - obs).toFixed(2);
                    return (
                        <div key={idx} className="flex justify-between items-center text-gray-800 py-0.5">
                            <span className="font-bold w-16 text-xs">{b.pred}</span>
                            <div className="flex-1 mx-4 relative h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div style={{ width: `${obs * 100}%` }} className={`h-full transition-all ${modelMode === 'calibrated' ? 'bg-blue-600' : 'bg-amber-500'}`} />
                                <div style={{ left: `${pred * 100}%` }} className="absolute top-0 bottom-0 w-0.5 bg-gray-900" title="Diagonal perfecta" />
                            </div>
                            <span className={`w-14 text-right font-bold text-xs ${Number(diff) > 0.15 ? 'text-red-600' : 'text-emerald-600'}`}>
                                ±{diff}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="text-xs font-mono text-gray-700 flex flex-wrap justify-between items-center gap-2 px-1 pt-1">
                <span>Brier Score: <strong className={modelMode === 'calibrated' ? 'text-emerald-700 text-sm' : 'text-red-700 text-sm'}>{brier}</strong> (0 = óptimo)</span>
                <span>Kolmogorov-Smirnov D_KS: <strong className="text-gray-900">{ksValue}</strong></span>
                <span className="text-blue-800 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">K-Fold Stratified (K=5)</span>
            </div>
        </div>
    );
}

// ─── AI-2. Visualizador Interactivo de Inferencia Causal (Pearl DAG) ──────────
export function CausalDagInteractive() {
    const [doOperator, setDoOperator] = useState(false);
    const [isAutoSim, setIsAutoSim] = useState(false);

    useEffect(() => {
        if (!isAutoSim) return;
        const interval = setInterval(() => {
            setDoOperator(prev => !prev);
        }, 2500);
        return () => clearInterval(interval);
    }, [isAutoSim]);

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 font-sans shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Grafo Causal DAG & Ajuste Backdoor de Pearl
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsAutoSim(p => !p)}
                        className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                            isAutoSim
                                ? 'bg-gray-900 text-white border-gray-900 font-semibold'
                                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                        title="Alterna automáticamente la intervención do(T=1)"
                    >
                        {isAutoSim ? 'Pausar Auto' : 'Auto-Simular'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setDoOperator(!doOperator)}
                        className={`text-xs font-mono font-bold px-3 py-1 rounded-md border cursor-pointer transition-colors ${
                            doOperator ? 'bg-blue-600 text-white border-blue-700 shadow-xs' : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-300'
                        }`}
                    >
                        {doOperator ? 'Operador do(T=1) ACTIVO' : 'Activar do(T=1)'}
                    </button>
                </div>
            </div>

            {/* Diagrama de Nodos y Flechas */}
            <div className="bg-gray-50/60 border border-gray-200 rounded-lg p-4 text-xs font-mono flex items-center justify-around relative">
                {/* Confusor Z */}
                <div className="flex flex-col items-center">
                    <div className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-900 rounded-lg font-bold shadow-2xs">
                        Z: Antigüedad / Cargo
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 font-sans">Variable Confusora</span>
                </div>

                <div className="text-gray-400 text-sm font-mono font-bold">
                    {doOperator ? '[Camino Bloqueado]' : '↙ ↘'}
                </div>

                {/* Tratamiento T */}
                <div className="flex flex-col items-center">
                    <div className={`px-3.5 py-1.5 rounded-lg font-bold border transition-colors shadow-2xs ${
                        doOperator ? 'bg-blue-600 text-white border-blue-700' : 'bg-white border-gray-300 text-gray-900'
                    }`}>
                        T: Plan Bienestar
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 font-sans">Tratamiento Intervenido</span>
                </div>

                <div className="text-gray-500 font-mono text-sm font-bold">
                    →
                </div>

                {/* Resultado Y */}
                <div className="flex flex-col items-center">
                    <div className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-900 rounded-lg font-bold shadow-2xs">
                        Y: Retención Neta
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 font-sans">Efecto Causal Puro</span>
                </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs font-mono flex flex-wrap justify-between items-center text-gray-700 gap-2">
                <span>Correlación Observada: <strong className="text-gray-900 font-bold">+22.0%</strong></span>
                <span>Sesgo Confusor Eliminado: <strong className="text-red-700 font-bold">-7.7%</strong></span>
                <span className="text-emerald-900 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">Efecto Causal ATE = +14.3%</span>
            </div>
        </div>
    );
}

// ─── AI-3. Visualizador Interactivo de Aprendizaje Federado (FedAvg) ───────────
export function FederatedLearningInteractive() {
    const [noiseEpsilon] = useState(1.2);

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 font-sans shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Topología Federada FedAvg & Privacidad Diferencial (ε = {noiseEpsilon})
                </div>
                <span className="text-xs font-mono text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md font-semibold">
                    Zero Data Leakage (Sin cruce de PII)
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                {['Tenant A (420 colabs)', 'Tenant B (310 colabs)', 'Tenant C (550 colabs)'].map((t, idx) => (
                    <div key={idx} className="bg-gray-50/70 p-3 rounded-lg border border-gray-200 space-y-1.5 shadow-2xs">
                        <div className="font-bold text-gray-900 text-xs sm:text-sm">{t}</div>
                        <div className="text-gray-600 text-xs">Gradiente local: Δw_{idx + 1}</div>
                        <div className="text-[11px] text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded font-semibold">
                            Ruido Laplace: σ={(1.4 / noiseEpsilon).toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs font-mono flex flex-wrap justify-between items-center text-gray-700 gap-2">
                <span>Servidor Central: <strong className="text-gray-900">w_(t+1) = Σ (n_k / n) · w_k</strong></span>
                <span>Delta δ: <strong className="text-gray-900">1e-5</strong></span>
                <span className="text-blue-900 font-bold bg-blue-50 px-2.5 py-1 rounded border border-blue-200">Modelo Global Unificado (1,280 colabs)</span>
            </div>
        </div>
    );
}

// ─── AI-4. Visualizador Interactivo de MORL Pareto ────────────────────────────
export function MorlParetoInteractive() {
    const [budgetIdx, setBudgetIdx] = useState(2);
    const [isAutoSweeping, setIsAutoSweeping] = useState(false);

    const paretoPoints = [
        { budget: 100, retention: 78.5, label: 'Mínimo' },
        { budget: 220, retention: 86.2, label: 'Eficiente' },
        { budget: 380, retention: 91.5, label: 'Óptimo Pareto (Knee Point)' },
        { budget: 550, retention: 92.4, label: 'Saturación' },
        { budget: 750, retention: 92.8, label: 'Rendimiento Decreciente' },
    ];

    useEffect(() => {
        if (!isAutoSweeping) return;
        const interval = setInterval(() => {
            setBudgetIdx(prev => (prev + 1) % paretoPoints.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [isAutoSweeping, paretoPoints.length]);

    const current = paretoPoints[budgetIdx];

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 font-sans shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Frontera de Pareto Multiobjetivo (Retención vs Costo)
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
                        title="Recorre automáticamente la frontera de Pareto"
                    >
                        {isAutoSweeping ? 'Pausar Auto' : 'Auto-Simular'}
                    </button>
                    <span className="text-xs font-mono font-bold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                        {current.label}
                    </span>
                </div>
            </div>

            {/* Mini Gráfico de Puntos Pareto */}
            <div className="bg-gray-50/60 border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-end h-20 border-b border-l border-gray-300 px-3 pb-1 relative">
                    {paretoPoints.map((p, idx) => {
                        const isSelected = idx === budgetIdx;
                        const heightPct = ((p.retention - 70) / 25) * 100;
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setBudgetIdx(idx)}
                                style={{ bottom: `${heightPct}%` }}
                                className={`w-4 h-4 rounded-full border-2 transition-all cursor-pointer ${
                                    isSelected ? 'bg-blue-600 border-gray-900 scale-125 z-10 shadow-xs' : 'bg-white border-gray-400 hover:bg-gray-100'
                                }`}
                                title={`$${p.budget} -> ${p.retention}%`}
                            />
                        );
                    })}
                </div>
                <div className="flex justify-between text-[11px] font-mono text-gray-500 px-1 font-medium">
                    <span>$100 (Bajo Costo)</span>
                    <span>$380 (Óptimo Knee Point)</span>
                    <span>$750 (Alto Costo)</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-white p-3 rounded-lg border border-gray-200 shadow-2xs">
                <div>Presupuesto Asignado: <strong className="text-gray-900 text-sm font-bold">${current.budget}/colab</strong></div>
                <div>Retención Proyectada: <strong className="text-emerald-700 text-sm font-bold">{current.retention}%</strong></div>
            </div>
        </div>
    );
}

// ─── AI-5. Visualizador Interactivo de Atención Temporal ──────────────────────
export function TemporalAttentionInteractive() {
    const [selectedMonth, setSelectedMonth] = useState(3);
    const [isAutoSweeping, setIsAutoSweeping] = useState(false);

    const monthWeights = [
        0.04, 0.05, 0.06, 0.38, 0.07, 0.05, 0.04, 0.06, 0.08, 0.05, 0.12, 0.05
    ];

    useEffect(() => {
        if (!isAutoSweeping) return;
        const interval = setInterval(() => {
            setSelectedMonth(prev => (prev + 1) % 12);
        }, 1500);
        return () => clearInterval(interval);
    }, [isAutoSweeping]);

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 font-sans shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Mapa de Calor de Atención Temporal (12 Meses)
                </div>
                <button
                    type="button"
                    onClick={() => setIsAutoSweeping(p => !p)}
                    className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                        isAutoSweeping
                            ? 'bg-gray-900 text-white border-gray-900 font-semibold'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                >
                    {isAutoSweeping ? 'Pausar Auto' : 'Auto-Simular'}
                </button>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 text-xs font-mono">
                {monthWeights.map((w, idx) => {
                    const isFocus = idx === selectedMonth;
                    const isHot = w > 0.20;
                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedMonth(idx)}
                            className={`p-2 rounded-md border text-center transition-all cursor-pointer ${
                                isFocus
                                    ? 'border-gray-900 ring-2 ring-blue-500 shadow-xs'
                                    : 'border-gray-200 hover:border-gray-300'
                            } ${isHot ? 'bg-red-50 text-red-900 font-bold' : 'bg-gray-50 text-gray-700'}`}
                        >
                            <div className="text-[10px] text-gray-500 uppercase">M{idx + 1}</div>
                            <div className="text-xs font-bold mt-0.5">{(w * 100).toFixed(0)}%</div>
                        </button>
                    );
                })}
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs font-mono flex flex-wrap justify-between items-center text-gray-700 gap-2">
                <span>Mes Seleccionado: <strong className="text-gray-900 font-bold">Mes {selectedMonth + 1}</strong> (Peso: {(monthWeights[selectedMonth] * 100).toFixed(1)}%)</span>
                <span className="text-red-800 font-bold bg-red-50 px-2.5 py-1 rounded border border-red-200">
                    Mes 4 = 38.0% (Shock Histórico de Clima Detectado)
                </span>
            </div>
        </div>
    );
}

// ─── AI-6. Visualizador Interactivo de FT-Transformer ─────────────────────────
export function FTTransformerInteractive() {
    const [sampleFeature, setSampleFeature] = useState('salary');
    const [isAutoSweeping, setIsAutoSweeping] = useState(false);

    const features = {
        salary: { label: 'Salario ($1,400)', tokenWeight: 0.42, role: 'Compresión Salarial (-18%)' },
        tenure: { label: 'Antigüedad (22m)', tokenWeight: 0.18, role: 'Curva de Peligro Weibull' },
        absences: { label: 'Ausencias (4d)', tokenWeight: 0.24, role: 'Pico de Desvinculación' },
        perf: { label: 'Desempeño (72%)', tokenWeight: 0.08, role: 'Evaluación Reciente' },
        overtime: { label: 'Horas Extra (18h)', tokenWeight: 0.05, role: 'Sobrecarga Operativa' },
        delays: { label: 'Atrasos (6)', tokenWeight: 0.03, role: 'Puntualidad Biométrica' }
    };

    const keys = Object.keys(features);

    useEffect(() => {
        if (!isAutoSweeping) return;
        const interval = setInterval(() => {
            setSampleFeature(currentKey => {
                const currentIdx = keys.indexOf(currentKey);
                const nextIdx = (currentIdx + 1) % keys.length;
                return keys[nextIdx];
            });
        }, 1800);
        return () => clearInterval(interval);
    }, [isAutoSweeping]);

    const current = features[sampleFeature] || features.salary;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 font-sans shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Forward Pass & Atención del Token [CLS] a Features
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
                        title="Recorre automáticamente la atención de cada token hacia el clasificador"
                    >
                        {isAutoSweeping ? 'Pausar Auto' : 'Auto-Atención'}
                    </button>
                    <span className="text-xs font-mono font-bold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                        d_token=16 | Heads=2
                    </span>
                </div>
            </div>

            {/* Esquema de Embeddings y Atencion CLS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
                {Object.entries(features).map(([k, f]) => {
                    const isSelected = k === sampleFeature;
                    return (
                        <button
                            key={k}
                            type="button"
                            onClick={() => setSampleFeature(k)}
                            className={`p-2.5 rounded-lg text-left transition-all cursor-pointer border shadow-2xs ${
                                isSelected ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-xs' : 'bg-gray-50/70 text-gray-800 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <div className="text-[11px] truncate font-medium">{f.label}</div>
                            <div className="mt-1.5 flex justify-between items-baseline">
                                <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>e_{k.slice(0, 3)}:</span>
                                <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>{(f.tokenWeight * 100).toFixed(0)}%</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs font-mono flex flex-wrap justify-between items-center text-gray-700 gap-2">
                <span>Feature Seleccionada: <strong className="text-gray-900 font-bold">{current.label}</strong></span>
                <span>Impacto en [CLS]: <strong className="text-blue-700 font-bold">{(current.tokenWeight * 100).toFixed(0)}% de Atención</strong></span>
                <span className="text-red-800 font-bold bg-red-50 px-2.5 py-1 rounded border border-red-200">Riesgo Fuga Predicho = 74.2%</span>
            </div>
        </div>
    );
}
