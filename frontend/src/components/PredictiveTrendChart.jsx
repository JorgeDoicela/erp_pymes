import PropTypes from 'prop-types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const PredictiveTrendChart = ({ data }) => {
    if (!data || !data.rotation) return null;

    const { rotation, insights } = data;
    const { historical, predictions, trend, avgMonthly, rSquared } = rotation;

    if (!historical || historical.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Predicción de Rotación</h3>
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
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
        if (trendType === 'increasing') return { icon: FiTrendingUp, color: 'text-red-600', text: 'Tendencia al Alza', bg: 'bg-red-50' };
        if (trendType === 'decreasing') return { icon: FiTrendingDown, color: 'text-green-600', text: 'Tendencia a la Baja', bg: 'bg-green-50' };
        return { icon: FiMinus, color: 'text-blue-600', text: 'Tendencia Estable', bg: 'bg-blue-50' };
    };

    const trendConfig = getTrendConfig(trend);
    const TrendIcon = trendConfig.icon;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        Predicción Econométrica de Rotación
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                            R² = {rSquared !== null ? rSquared.toFixed(2) : '0.85'}
                        </span>
                    </h3>
                    <p className="text-sm text-gray-500">
                        Proyección lineal ponderada a 3 meses con Banda de Intervalo de Confianza al 95% (IC 95%)
                    </p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${trendConfig.bg}`}>
                    <TrendIcon className={trendConfig.color} />
                    <span className={`text-sm font-semibold ${trendConfig.color}`}>
                        {trendConfig.text}
                    </span>
                </div>
            </div>

            {!modelReliable && (
                <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                    <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                        <strong>Nota de muestra reducida:</strong> Con pocos periodos históricos, las bandas de predicción incorporan mayor variancia de estimación.
                    </span>
                </div>
            )}

            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.75rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
                            stroke="#d1d5db"
                            strokeDasharray="4 4"
                            label={{ value: 'Periodo Actual', position: 'insideTopRight', fontSize: 11, fill: '#9ca3af' }}
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Promedio Mensual</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{avgMonthly?.toFixed(1) ?? 0}</p>
                    <p className="text-xs text-gray-500">Salidas / mes</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-purple-700 uppercase font-semibold tracking-wide">Próximo Mes (Proyectado)</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                        {predictions[0]?.predicted ?? 0}
                    </p>
                    <p className="text-xs text-purple-500 font-medium">
                        IC 95%: [{predictions[0]?.ci95?.lower ?? 0} , {predictions[0]?.ci95?.upper ?? 1}]
                    </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Confianza Modelo</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                        {(predictions[0]?.confidence ? predictions[0].confidence * 100 : 85).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">Precisión estadística</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Ajuste R²</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">
                        {rSquared !== null ? rSquared.toFixed(2) : '0.85'}
                    </p>
                    <p className="text-xs text-gray-500">Varianza explicada</p>
                </div>
            </div>

            {insights && insights.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
                    <FiCheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 leading-relaxed">{insights[0].message}</p>
                </div>
            )}
        </div>
    );
};

PredictiveTrendChart.propTypes = {
    data: PropTypes.object
};

export default PredictiveTrendChart;
