import PropTypes from 'prop-types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiAlertCircle } from 'react-icons/fi';

const PredictiveTrendChart = ({ data }) => {
    if (!data || !data.rotation) return null;

    const { rotation, insights } = data;
    const { historical, predictions, trend, avgMonthly, rSquared } = rotation;

    // Fix #2: Guard para historical vacío — evita crash en acceso a índice -1
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

    // El backend retorna modelReliable=false y confidence=null cuando n<3 o ssTot=0
    const modelReliable = predictions.some(p => p.confidence !== null);

    // Combinar datos históricos y predicciones para el gráfico sin duplicar el mes de transición
    const chartData = [
        ...historical.map((d, index) => ({
            month: d.month,
            actual: d.count,
            // Conectar la línea de predicción desde el último valor histórico real
            predicted: index === historical.length - 1 ? d.count : undefined,
            type: 'Histórico'
        })),
        ...predictions.map(d => ({
            month: d.month,
            predicted: d.predicted,
            confidence: d.confidence,
            type: 'Predicción'
        }))
    ];

    // Configuración de tendencia
    const getTrendConfig = (trendType) => {
        if (trendType === 'increasing') return { icon: FiTrendingUp, color: 'text-red-600', text: 'Tendencia al Alza', bg: 'bg-red-50' };
        if (trendType === 'decreasing') return { icon: FiTrendingDown, color: 'text-green-600', text: 'Tendencia a la Baja', bg: 'bg-green-50' };
        return { icon: FiMinus, color: 'text-blue-600', text: 'Tendencia Estable', bg: 'bg-blue-50' };
    };

    const trendConfig = getTrendConfig(trend);
    const TrendIcon = trendConfig.icon;

    // Índice donde comienza la zona de predicción (para la línea de referencia)
    const predictionStartIndex = historical.length; // coincide con el punto de conexión

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Predicción de Rotación</h3>
                    <p className="text-sm text-gray-500">
                        Proyección a 3 meses · Regresión lineal sobre últimos 6 meses
                    </p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${trendConfig.bg}`}>
                    <TrendIcon className={trendConfig.color} />
                    <span className={`text-sm font-semibold ${trendConfig.color}`}>
                        {trendConfig.text}
                    </span>
                </div>
            </div>

            {/* Disclaimer cuando el modelo no es confiable */}
            {!modelReliable && (
                <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                    <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                        <strong>Datos insuficientes:</strong> Se requieren al menos 3 meses con salidas para calcular predicciones confiables.
                        Las proyecciones mostradas son estimaciones de baja fiabilidad.
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
                            tickFormatter={(value) => {
                                const [year, month] = value.split('-');
                                const date = new Date(year, month - 1);
                                return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
                            }}
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
                            formatter={(value, name) => {
                                if (value === undefined || value === null) return null;
                                return [value, name === 'actual' ? '🔵 Rotación Real' : '🟣 Predicción'];
                            }}
                            labelFormatter={(label) => {
                                const [year, month] = label.split('-');
                                const date = new Date(year, month - 1);
                                return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                            }}
                        />
                        {/* Línea de referencia separando histórico de predicción */}
                        <ReferenceLine
                            x={historical[historical.length - 1].month}
                            stroke="#d1d5db"
                            strokeDasharray="4 4"
                            label={{ value: 'Hoy', position: 'insideTopRight', fontSize: 11, fill: '#9ca3af' }}
                        />
                        {/* Línea Histórica */}
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: '#3b82f6' }}
                            connectNulls={false}
                        />
                        {/* Línea de Predicción (Punteada) */}
                        <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="#8b5cf6"
                            strokeWidth={2.5}
                            strokeDasharray="6 4"
                            dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: '#8b5cf6' }}
                            connectNulls={true}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Leyenda manual más descriptiva */}
            <div className="flex items-center gap-6 mt-3 mb-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                    <span className="w-5 h-0.5 bg-blue-500 inline-block rounded" />
                    Datos reales
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-5 h-0.5 bg-violet-500 inline-block rounded border-dashed border-b-2 border-violet-500 bg-transparent" style={{ borderStyle: 'dashed' }} />
                    Predicción
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Promedio Mensual</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{avgMonthly?.toFixed(1) ?? 0}</p>
                    <p className="text-xs text-gray-500">Salidas / mes</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Próximo Mes</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                        {predictions[0]?.predicted ?? 0}
                    </p>
                    <p className="text-xs text-gray-500">Salidas proyectadas</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Confianza</p>
                    {predictions[0]?.confidence !== null && predictions[0]?.confidence !== undefined ? (
                        <p className="text-2xl font-bold text-green-600 mt-1">
                            {(predictions[0].confidence * 100).toFixed(0)}%
                        </p>
                    ) : (
                        <p className="text-lg font-bold text-amber-500 mt-1">N/A</p>
                    )}
                    <p className="text-xs text-gray-500">Nivel de precisión</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Calidad Modelo (R²)</p>
                    {rSquared !== null && rSquared !== undefined ? (
                        <p className="text-2xl font-bold text-indigo-600 mt-1">
                            {rSquared.toFixed(2)}
                        </p>
                    ) : (
                        <p className="text-lg font-bold text-amber-500 mt-1">—</p>
                    )}
                    <p className="text-xs text-gray-500">Ajuste del modelo</p>
                </div>
            </div>

            {insights && insights.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">Insight Predictivo</h4>
                    <p className="text-sm text-blue-700">{insights[0].message}</p>
                </div>
            )}
        </div>
    );
};

PredictiveTrendChart.propTypes = {
    data: PropTypes.shape({
        rotation: PropTypes.shape({
            historical: PropTypes.array.isRequired,
            predictions: PropTypes.array.isRequired,
            trend: PropTypes.string.isRequired,
            avgMonthly: PropTypes.number,
            rSquared: PropTypes.number
        }),
        insights: PropTypes.array
    })
};

export default PredictiveTrendChart;
