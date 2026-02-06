import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { FiAlertCircle, FiCheckCircle, FiClock } from 'react-icons/fi';

/**
 * Componente para mostrar lista de recomendaciones
 * Muestra recomendaciones priorizadas con acciones
 */
export default function RecommendationsList({ recommendations, onActionClick }) {
    const priorityConfig = {
        ALTA: {
            icon: FiAlertCircle,
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            textColor: 'text-red-700',
            badgeColor: 'bg-red-100 text-red-700',
        },
        MEDIA: {
            icon: FiClock,
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            textColor: 'text-yellow-700',
            badgeColor: 'bg-yellow-100 text-yellow-700',
        },
        BAJA: {
            icon: FiCheckCircle,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            textColor: 'text-green-700',
            badgeColor: 'bg-green-100 text-green-700',
        },
    };

    const impactColors = {
        Alto: 'text-red-600',
        Medio: 'text-yellow-600',
        Bajo: 'text-green-600',
    };

    if (!recommendations || recommendations.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <FiCheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">¡Todo en orden!</p>
                <p className="text-sm">No hay recomendaciones urgentes en este momento.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {recommendations.map((rec, index) => {
                const config = priorityConfig[rec.priority] || priorityConfig.MEDIA;
                const Icon = config.icon;

                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`${config.bgColor} ${config.borderColor} border-l-4 rounded-lg p-4 hover:shadow-md transition-shadow duration-200`}
                    >
                        <div className="flex items-start gap-4">
                            {/* Icono */}
                            <div className={`${config.textColor} mt-1`}>
                                <Icon className="w-6 h-6" />
                            </div>

                            {/* Contenido */}
                            <div className="flex-1">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${config.badgeColor}`}>
                                            Prioridad {rec.priority}
                                        </span>
                                    </div>
                                    {rec.impact && (
                                        <span className={`text-sm font-medium ${impactColors[rec.impact]}`}>
                                            Impacto: {rec.impact}
                                        </span>
                                    )}
                                </div>

                                {/* Descripción */}
                                <p className="text-gray-700 text-sm mb-3">{rec.description}</p>

                                {/* Empleados afectados (si aplica) */}
                                {rec.employees && rec.employees.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs text-gray-600 mb-1">Empleados afectados:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {rec.employees.slice(0, 3).map((emp, i) => (
                                                <span key={i} className="px-2 py-1 bg-white rounded text-xs text-gray-700">
                                                    {emp}
                                                </span>
                                            ))}
                                            {rec.employees.length > 3 && (
                                                <span className="px-2 py-1 bg-white rounded text-xs text-gray-500">
                                                    +{rec.employees.length - 3} más
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Categoría */}
                                {rec.category && (
                                    <span className="inline-block px-2 py-1 bg-white rounded text-xs text-gray-600 mb-3">
                                        📁 {rec.category}
                                    </span>
                                )}

                                {/* Botón de acción */}
                                {rec.action && (
                                    <button
                                        onClick={() => onActionClick && onActionClick(rec)}
                                        className="mt-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg transition-colors duration-200 text-sm font-medium"
                                    >
                                        {rec.action}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

RecommendationsList.propTypes = {
    recommendations: PropTypes.arrayOf(
        PropTypes.shape({
            priority: PropTypes.oneOf(['ALTA', 'MEDIA', 'BAJA']).isRequired,
            category: PropTypes.string,
            title: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            action: PropTypes.string,
            impact: PropTypes.oneOf(['Alto', 'Medio', 'Bajo']),
            employees: PropTypes.arrayOf(PropTypes.string),
        })
    ),
    onActionClick: PropTypes.func,
};
