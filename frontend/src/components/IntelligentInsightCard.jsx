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
    priority = 'medium',
    onAction
}) {
    const priorityBadges = {
        high: 'bg-red-50 text-red-700 border-red-200',
        medium: 'bg-amber-50 text-amber-700 border-amber-200',
        low: 'bg-green-50 text-green-700 border-green-200',
    };

    return (
        <div className="bg-white rounded border border-gray-200 p-4 space-y-3 text-xs shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-700">
                    {Icon && <Icon className="w-4 h-4 text-blue-600" />}
                    <h3 className="font-semibold text-xs text-gray-900 uppercase tracking-wider">{title}</h3>
                </div>
                {priority && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${priorityBadges[priority]}`}>
                        {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'}
                    </span>
                )}
            </div>

            <div>
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xl font-mono font-bold text-gray-900 tabular-nums">{value}</span>
                    {trend && (
                        <span className={`text-[11px] font-mono font-medium ${trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                        </span>
                    )}
                </div>

                {description && (
                    <p className="text-gray-500 leading-normal text-xs">{description}</p>
                )}
            </div>

            {onAction && (
                <div className="pt-2 border-t border-gray-100">
                    <button
                        onClick={onAction}
                        className="w-full py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors text-xs font-medium cursor-pointer"
                    >
                        Ver detalles →
                    </button>
                </div>
            )}
        </div>
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
