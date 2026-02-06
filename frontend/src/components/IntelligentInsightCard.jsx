import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Componente para mostrar un insight card
 * Muestra métricas clave con iconos, tendencias y acciones
 */
export default function IntelligentInsightCard({
    icon: Icon,
    title,
    value,
    trend,
    description,
    color = 'blue',
    priority = 'medium',
    onAction
}) {
    // Colores según prioridad
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        yellow: 'from-yellow-500 to-yellow-600',
        red: 'from-red-500 to-red-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
    };

    const priorityBadges = {
        high: 'bg-red-100 text-red-700',
        medium: 'bg-yellow-100 text-yellow-700',
        low: 'bg-green-100 text-green-700',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
        >
            {/* Header con gradiente */}
            <div className={`bg-gradient-to-r ${colorClasses[color]} p-4 text-white`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {Icon && <Icon className="w-6 h-6" />}
                        <h3 className="font-semibold text-lg">{title}</h3>
                    </div>
                    {priority && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityBadges[priority]}`}>
                            {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'}
                        </span>
                    )}
                </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
                {/* Valor principal */}
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900">{value}</span>
                    {trend && (
                        <span className={`text-sm font-medium ${trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                        </span>
                    )}
                </div>

                {/* Descripción */}
                {description && (
                    <p className="text-gray-600 text-sm mb-4">{description}</p>
                )}

                {/* Botón de acción */}
                {onAction && (
                    <button
                        onClick={onAction}
                        className="w-full mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 text-sm font-medium"
                    >
                        Ver detalles →
                    </button>
                )}
            </div>
        </motion.div>
    );
}

IntelligentInsightCard.propTypes = {
    icon: PropTypes.elementType,
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    trend: PropTypes.number,
    description: PropTypes.string,
    color: PropTypes.oneOf(['blue', 'green', 'yellow', 'red', 'purple', 'orange']),
    priority: PropTypes.oneOf(['high', 'medium', 'low']),
    onAction: PropTypes.func,
};
