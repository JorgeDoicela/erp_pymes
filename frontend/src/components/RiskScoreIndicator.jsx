import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Componente para mostrar un indicador de score de riesgo
 * Muestra un gauge circular animado con colores según el nivel de riesgo
 */
export default function RiskScoreIndicator({ score, level, size = 'md' }) {
    // Determinar color según el nivel de riesgo
    const getColor = () => {
        if (level === 'Alto Riesgo') return 'text-red-600';
        if (level === 'Riesgo Medio') return 'text-yellow-600';
        return 'text-green-600';
    };

    const getBgColor = () => {
        if (level === 'Alto Riesgo') return 'bg-red-100';
        if (level === 'Riesgo Medio') return 'bg-yellow-100';
        return 'bg-green-100';
    };

    const getStrokeColor = () => {
        if (level === 'Alto Riesgo') return '#dc2626';
        if (level === 'Riesgo Medio') return '#d97706';
        return '#16a34a';
    };

    // Tamaños
    const sizes = {
        sm: { width: 60, height: 60, strokeWidth: 4, fontSize: 'text-sm' },
        md: { width: 80, height: 80, strokeWidth: 6, fontSize: 'text-base' },
        lg: { width: 120, height: 120, strokeWidth: 8, fontSize: 'text-xl' },
    };

    const { width, height, strokeWidth, fontSize } = sizes[size];
    const radius = (width - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width, height }}>
                {/* Background circle */}
                <svg width={width} height={height} className="transform -rotate-90">
                    <circle
                        cx={width / 2}
                        cy={height / 2}
                        r={radius}
                        stroke="#e5e7eb"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    {/* Progress circle */}
                    <motion.circle
                        cx={width / 2}
                        cy={height / 2}
                        r={radius}
                        stroke={getStrokeColor()}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </svg>
                {/* Score text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`font-bold ${fontSize} ${getColor()}`}>
                        {Math.round(score)}
                    </span>
                </div>
            </div>
            {/* Level badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBgColor()} ${getColor()}`}>
                {level}
            </span>
        </div>
    );
}

RiskScoreIndicator.propTypes = {
    score: PropTypes.number.isRequired,
    level: PropTypes.string.isRequired,
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
};
