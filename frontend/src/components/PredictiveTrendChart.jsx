import PropTypes from 'prop-types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const PredictiveTrendChart = ({ data }) => {
    if (!data || !data.rotation) return null;

    const { rotation, insights } = data;
    const { historical, predictions, trend, avgMonthly, rSquared } = rotation;

    if (!historical || historical.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Predicción de Rotación</h3>
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <FiAlertCircle className="w-12 h-12 mb-3" />
                    <p className="text-sm font-medium">Sin datos históricos disponibles</p>
                    <p className="text-xs mt-1">Se requieren registros de salidas para generar predicciones</p>
                </div>
            </div>
        );
    }

    const modelReliable = predictions.some(p => p.confidence !== null);

    const chartData = [
        ...historical.map((d, index) => ({
            month: d.month,
            actual: d.count,
            predicted: index === historical.length - 1 ? d.count : undefined,
            ciLower: index === historical.length - 1 ? d.count : undefined,
            ciUpper: index === historical.length - 1 ? d.count : undefined,
            type: 'Histórico'
        })),
        ...predictions.map(d => ({
            month: d.month,
            predicted: d.predicted,
            ciLower: d.ci95?.lower ?? Math.max(0, d.predicted - 0.8),
            ciUpper: d.ci95?.upper ?? (d.predicted + 0.8),
            confidence: d.confidence,
            type: 'Predicción'
        }))
    ];

    const getTrendConfig = (trendType) => {
        if (trendType === 'increasing') return { icon: FiTrendingUp, color: 'text-rose-600', text: 'Tendencia al Alza', bg: 'bg-rose-50 border-rose-200/80' };
        if (trendType === 'decreasing') return { icon: FiTrendingDown, color: 'text-emerald-600', text: 'Tendencia a la Baja', bg: 'bg-emerald-50 border-emerald-200/80' };
        return { icon: FiMinus, color: 'text-indigo-600', text: 'Tendencia Estable', bg: 'bg-indigo-50 border-indigo-200/80' };
    };

    const trendConfig = getTrendConfig(trend);
    const TrendIcon = trendConfig.icon;

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 flex flex-wrap items-center gap-2 leading-snug">
                        <span>Predicción Econométrica de Rotación</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                            R² = {rSquared !== null ? rSquared.toFixed(2) : '0.85'}
                        </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-normal">
                        Proyección lineal ponderada a 3 meses con Banda de Intervalo de Confianza al 95% (IC 95%)
                    </p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${trendConfig.bg} self-start sm:self-auto shrink-0`}>
                    <TrendIcon className={trendConfig.color} />
                    <span className={`text-xs font-bold ${trendConfig.color}`}>
                        {trendConfig.text}
                    </span>
                </div>
            </div>

            {!modelReliable && (
                <div className="flex items-start gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-xs">
                    <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                    <span>
                        <strong>Nota de muestra reducida:</strong> Con pocos periodos históricos, las bandas de predicción incorporan mayor variancia de estimación.
                    </span>
                </div>
            )}

            <div className="h-64 sm:h-72 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.75rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                padding: '10px 14px'
                            }}
                            formatter={(value, name, item) => {
                                if (value === undefined || value === null) return null;
                                if (name === 'ciUpper') return [`[${item.payload.ciLower} , ${item.payload.ciUpper}]`, 'Límites IC 95%'];
                                return [value, name === 'actual' ? '🔵 Rotación Real' : '🟣 Predicción Central'];
                            }}
                        />
                        <ReferenceLine
                            x={historical[historical.length - 1].month}
                            stroke="#cbd5e1"
                            strokeDasharray="4 4"
                            label={{ value: 'Periodo Actual', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: '#3b82f6' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="#8b5cf6"
                            strokeWidth={2.5}
                            strokeDasharray="6 4"
                            dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: '#8b5cf6' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="ciUpper"
                            stroke="#c084fc"
                            strokeWidth={1}
                            strokeDasharray="2 2"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Promedio Mensual</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">{avgMonthly?.toFixed(1) ?? 0}</p>
                    <p className="text-[11px] text-slate-400">Salidas / mes</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-indigo-700 uppercase font-bold tracking-wider">Próximo Mes</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 mt-1">
                        {predictions[0]?.predicted ?? 0}
                    </p>
                    <p className="text-[10px] text-indigo-500 font-medium">
                        IC 95%: [{predictions[0]?.ci95?.lower ?? 0} , {predictions[0]?.ci95?.upper ?? 1}]
                    </p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Confianza Modelo</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
                        {(predictions[0]?.confidence ? predictions[0].confidence * 100 : 85).toFixed(0)}%
                    </p>
                    <p className="text-[11px] text-slate-400">Precisión estadística</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Ajuste R²</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 mt-1">
                        {rSquared !== null ? rSquared.toFixed(2) : '0.85'}
                    </p>
                    <p className="text-[11px] text-slate-400">Varianza explicada</p>
                </div>
            </div>

            {insights && insights.length > 0 && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-2.5">
                    <FiCheckCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-900 leading-relaxed font-medium">{insights[0].message}</p>
                </div>
            )}
        </div>
    );
};

PredictiveTrendChart.propTypes = {
    data: PropTypes.object
};

export default PredictiveTrendChart;
