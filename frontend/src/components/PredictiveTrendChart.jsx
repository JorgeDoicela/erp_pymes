import PropTypes from 'prop-types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

const PredictiveTrendChart = ({ data }) => {
    if (!data || !data.rotation) return null;

    const { rotation, insights } = data;
    const { historical, predictions, trend, avgMonthly } = rotation;

    // Combinar datos históricos y predicciones para el gráfico
    const chartData = [
        ...historical.map(d => ({
            month: d.month,
            actual: d.count,
            type: 'Histórico'
        })),
        // Punto de conexión (último histórico es el inicio de la predicción)
        {
            month: historical[historical.length - 1].month,
            actual: historical[historical.length - 1].count,
            predicted: historical[historical.length - 1].count,
            type: 'Actual'
        },
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

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Predicción de Rotación</h3>
                    <p className="text-sm text-gray-500">Proyección a 3 meses basada en regresión lineal</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${trendConfig.bg}`}>
                    <TrendIcon className={trendConfig.color} />
                    <span className={`text-sm font-semibold ${trendConfig.color}`}>
                        {trendConfig.text}
                    </span>
                </div>
            </div>

            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            tickFormatter={(value) => {
                                const [year, month] = value.split('-');
                                const date = new Date(year, month - 1);
                                return date.toLocaleDateString('es-ES', { month: 'short' });
                            }}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value, name) => [
                                value,
                                name === 'actual' ? 'Rotación Real' : 'Predicción'
                            ]}
                            labelFormatter={(label) => {
                                const [year, month] = label.split('-');
                                const date = new Date(year, month - 1);
                                return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                            }}
                        />
                        {/* Línea Histórica */}
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                            connectNulls={true}
                        />
                        {/* Línea de Predicción (Punteada) */}
                        <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            dot={{ r: 4, strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Promedio Mensual</p>
                    <p className="text-2xl font-bold text-gray-900">{avgMonthly?.toFixed(1) || 0}</p>
                    <p className="text-xs text-gray-500">Salidas / mes</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Próximo Mes</p>
                    <p className="text-2xl font-bold text-purple-600">
                        {predictions[0]?.predicted || 0}
                    </p>
                    <p className="text-xs text-gray-500">Salidas proyectadas</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Confianza</p>
                    <p className="text-2xl font-bold text-green-600">
                        {(predictions[0]?.confidence * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">Nivel de precisión</p>
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
            avgMonthly: PropTypes.number
        }),
        insights: PropTypes.array
    })
};

export default PredictiveTrendChart;
