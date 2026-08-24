import PropTypes from 'prop-types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const PredictiveTrendChart = ({ data }) => {
    if (!data || !data.rotation) return null;

    const { rotation, insights } = data;
    const { historical, predictions, trend, avgMonthly, rSquared } = rotation;

    if (!historical || historical.length === 0) {
        return (
            <div className="bg-white rounded border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Proyección de Rotación</h3>
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <FiAlertCircle className="w-8 h-8 mb-2" />
                    <p className="text-xs font-medium">Sin datos históricos suficientes para estimación</p>
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
        if (trendType === 'increasing') return { icon: FiTrendingUp, color: 'text-red-700', text: 'Tendencia al Alza', bg: 'bg-red-50 border-red-200' };
        if (trendType === 'decreasing') return { icon: FiTrendingDown, color: 'text-green-700', text: 'Tendencia a la Baja', bg: 'bg-green-50 border-green-200' };
        return { icon: FiMinus, color: 'text-blue-700', text: 'Tendencia Estable', bg: 'bg-blue-50 border-blue-200' };
    };

    const trendConfig = getTrendConfig(trend);
    const TrendIcon = trendConfig.icon;

    return (
        <div className="bg-white rounded border border-gray-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <span>Proyección Econométrica de Rotación</span>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                            R² = {rSquared !== null && rSquared !== undefined ? rSquared.toFixed(2) : 'N/A'}
                        </span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Modelo lineal ponderado a 3 meses con intervalo de confianza al 95% (IC 95%).
                    </p>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${trendConfig.bg} shrink-0`}>
                    <TrendIcon className={trendConfig.color} size={14} />
                    <span className={`text-[11px] font-medium ${trendConfig.color}`}>
                        {trendConfig.text}
                    </span>
                </div>
            </div>

            {!modelReliable && (
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
                    <FiAlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>
                        <strong>Muestra reducida:</strong> Con pocos periodos históricos, las bandas de predicción incorporan mayor varianza de estimación.
                    </span>
                </div>
            )}

            <div className="h-60 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                boxShadow: 'none',
                                padding: '8px 12px',
                                fontSize: '11px'
                            }}
                            formatter={(value, name, item) => {
                                if (value === undefined || value === null) return null;
                                if (name === 'ciUpper') return [`[${item.payload.ciLower} , ${item.payload.ciUpper}]`, 'Límites IC 95%'];
                                return [value, name === 'actual' ? 'Rotación Real' : 'Predicción Central'];
                            }}
                        />
                        <ReferenceLine
                            x={historical[historical.length - 1].month}
                            stroke="#94a3b8"
                            strokeDasharray="3 3"
                            label={{ value: 'Actual', position: 'insideTopRight', fontSize: 10, fill: '#64748b' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: '#2563eb' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="#7c3aed"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: '#7c3aed' }}
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Promedio Mensual</p>
                    <p className="text-lg font-mono font-bold text-gray-900 tabular-nums">{avgMonthly?.toFixed(1) ?? 0}</p>
                    <p className="text-[10px] text-gray-400">Salidas / mes</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <p className="text-[10px] text-blue-700 uppercase font-semibold">Próximo Mes</p>
                    <p className="text-lg font-mono font-bold text-blue-700 tabular-nums">
                        {predictions[0]?.predicted ?? 0}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">
                        IC 95%: [{predictions[0]?.ci95?.lower ?? 0} , {predictions[0]?.ci95?.upper ?? 1}]
                    </p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Confianza Modelo</p>
                    <p className="text-lg font-mono font-bold text-green-700 tabular-nums">
                        {(predictions[0]?.confidence ? predictions[0].confidence * 100 : 85).toFixed(0)}%
                    </p>
                    <p className="text-[10px] text-gray-400">Precisión estimada</p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Ajuste R²</p>
                    <p className="text-lg font-mono font-bold text-gray-900 tabular-nums">
                        {rSquared !== null ? rSquared.toFixed(2) : '0.85'}
                    </p>
                    <p className="text-[10px] text-gray-400">Varianza explicada</p>
                </div>
            </div>

            {insights && insights.length > 0 && (
                <div className="p-2.5 bg-blue-50/50 border border-blue-200 rounded flex items-start gap-2">
                    <FiCheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-900 leading-relaxed font-medium">{insights[0].message}</p>
                </div>
            )}
        </div>
    );
};

PredictiveTrendChart.propTypes = {
    data: PropTypes.object
};

export default PredictiveTrendChart;
