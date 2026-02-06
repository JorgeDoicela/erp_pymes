import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const EmployeeScoreCard = ({ employee }) => {
    if (!employee) return null;

    const { employeeName, department, position, scores, category } = employee;

    // Preparar datos para el gráfico de radar
    const radarData = [
        { subject: 'Retención', value: scores.retention, fullMark: 100 },
        { subject: 'Desempeño', value: scores.performance, fullMark: 100 },
        { subject: 'Asistencia', value: scores.attendance, fullMark: 100 },
        { subject: 'Compromiso', value: scores.engagement, fullMark: 100 },
        { subject: 'Crecimiento', value: scores.growth, fullMark: 100 },
    ];

    // Configuración de colores según categoría
    const getCategoryConfig = (cat) => {
        const configs = {
            'Top Performer': {
                bg: 'bg-green-50',
                border: 'border-green-200',
                text: 'text-green-700',
                badge: 'bg-green-100 text-green-800'
            },
            'Good Performer': {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                text: 'text-blue-700',
                badge: 'bg-blue-100 text-blue-800'
            },
            'Needs Improvement': {
                bg: 'bg-yellow-50',
                border: 'border-yellow-200',
                text: 'text-yellow-700',
                badge: 'bg-yellow-100 text-yellow-800'
            },
            'At Risk': {
                bg: 'bg-red-50',
                border: 'border-red-200',
                text: 'text-red-700',
                badge: 'bg-red-100 text-red-800'
            }
        };
        return configs[cat] || configs['Good Performer'];
    };

    const categoryConfig = getCategoryConfig(category);

    // Color para el gráfico de radar
    const getRadarColor = (cat) => {
        const colors = {
            'Top Performer': '#10b981',
            'Good Performer': '#3b82f6',
            'Needs Improvement': '#f59e0b',
            'At Risk': '#ef4444'
        };
        return colors[cat] || '#3b82f6';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-2 ${categoryConfig.border} ${categoryConfig.bg} rounded-xl p-6`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h4 className="text-lg font-bold text-gray-900">{employeeName}</h4>
                    <p className="text-sm text-gray-600">{position}</p>
                    <p className="text-xs text-gray-500">{department}</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{scores.overall}</div>
                    <div className="text-xs text-gray-600">Score General</div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${categoryConfig.badge}`}>
                        {category}
                    </span>
                </div>
            </div>

            {/* Gráfico de Radar */}
            <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fill: '#9ca3af', fontSize: 10 }}
                        />
                        <Radar
                            name={employeeName}
                            dataKey="value"
                            stroke={getRadarColor(category)}
                            fill={getRadarColor(category)}
                            fillOpacity={0.6}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                padding: '8px 12px'
                            }}
                            formatter={(value) => [`${value}/100`, 'Score']}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Scores Detallados */}
            <div className="grid grid-cols-2 gap-3">
                {Object.entries(scores).filter(([key]) => key !== 'overall').map(([key, value]) => {
                    const labels = {
                        retention: 'Retención',
                        performance: 'Desempeño',
                        attendance: 'Asistencia',
                        engagement: 'Compromiso',
                        growth: 'Crecimiento'
                    };

                    const getScoreColor = (score) => {
                        if (score >= 80) return 'text-green-600';
                        if (score >= 60) return 'text-blue-600';
                        if (score >= 40) return 'text-yellow-600';
                        return 'text-red-600';
                    };

                    return (
                        <div key={key} className="flex items-center justify-between p-2 bg-white rounded-lg">
                            <span className="text-xs text-gray-600">{labels[key]}</span>
                            <span className={`text-sm font-bold ${getScoreColor(value)}`}>{value}</span>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};

EmployeeScoreCard.propTypes = {
    employee: PropTypes.shape({
        employeeId: PropTypes.number.isRequired,
        employeeName: PropTypes.string.isRequired,
        department: PropTypes.string.isRequired,
        position: PropTypes.string.isRequired,
        scores: PropTypes.shape({
            retention: PropTypes.number.isRequired,
            performance: PropTypes.number.isRequired,
            attendance: PropTypes.number.isRequired,
            engagement: PropTypes.number.isRequired,
            growth: PropTypes.number.isRequired,
            overall: PropTypes.number.isRequired
        }).isRequired,
        category: PropTypes.string.isRequired
    })
};

export default EmployeeScoreCard;
