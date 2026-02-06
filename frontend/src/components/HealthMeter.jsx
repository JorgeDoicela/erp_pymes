import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

const HealthMeter = ({ health }) => {
    if (!health) return null;

    const { overallHealth, healthLevel, components, kpis } = health;

    // Configuración de colores según nivel de salud
    const getHealthColor = (score) => {
        if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-50' };
        if (score >= 60) return { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50' };
        if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-50' };
        return { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50' };
    };

    const healthColor = getHealthColor(overallHealth);

    // Calcular circunferencia para el medidor circular
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (overallHealth / 100) * circumference;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Salud Organizacional</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Medidor Circular */}
                <div className="flex flex-col items-center justify-center">
                    <div className="relative w-48 h-48">
                        <svg className="transform -rotate-90 w-48 h-48">
                            {/* Círculo de fondo */}
                            <circle
                                cx="96"
                                cy="96"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                className="text-gray-200"
                            />
                            {/* Círculo de progreso */}
                            <motion.circle
                                cx="96"
                                cy="96"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference}
                                strokeLinecap="round"
                                className={healthColor.bg.replace('bg-', 'text-')}
                                animate={{ strokeDashoffset }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-gray-900">{overallHealth}</span>
                            <span className="text-sm text-gray-600">de 100</span>
                            <span className={`text-xs font-semibold mt-1 ${healthColor.text}`}>
                                {healthLevel}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Componentes de Salud */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Componentes</h4>

                    {Object.entries(components).map(([key, value]) => {
                        const componentColor = getHealthColor(value);
                        const labels = {
                            retention: 'Retención',
                            performance: 'Desempeño',
                            attendance: 'Asistencia',
                            departments: 'Departamentos'
                        };

                        return (
                            <div key={key} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700">{labels[key]}</span>
                                    <span className={`font-semibold ${componentColor.text}`}>{value}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <motion.div
                                        className={`h-2 rounded-full ${componentColor.bg}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${value}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* KPIs */}
            {kpis && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{kpis.totalEmployees}</p>
                        <p className="text-xs text-gray-600">Empleados</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{kpis.avgTenure}</p>
                        <p className="text-xs text-gray-600">Años Promedio</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{kpis.rotationRate}%</p>
                        <p className="text-xs text-gray-600">Tasa Rotación</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{kpis.satisfactionIndex}</p>
                        <p className="text-xs text-gray-600">Índice Satisfacción</p>
                    </div>
                </div>
            )}
        </div>
    );
};

HealthMeter.propTypes = {
    health: PropTypes.shape({
        overallHealth: PropTypes.number.isRequired,
        healthLevel: PropTypes.string.isRequired,
        components: PropTypes.shape({
            retention: PropTypes.number,
            performance: PropTypes.number,
            attendance: PropTypes.number,
            departments: PropTypes.number
        }),
        kpis: PropTypes.shape({
            totalEmployees: PropTypes.number,
            avgTenure: PropTypes.number,
            rotationRate: PropTypes.string,
            satisfactionIndex: PropTypes.number
        })
    })
};

export default HealthMeter;
