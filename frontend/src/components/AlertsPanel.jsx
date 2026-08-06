import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiCheckCircle, FiUsers, FiTrendingDown, FiClock, FiTarget, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const AlertsPanel = ({ alerts, summary, onAlertAction }) => {
    if (!alerts || alerts.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Alertas Proactivas</h3>
                <div className="text-center py-8">
                    <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">No hay alertas críticas en este momento</p>
                    <p className="text-sm text-gray-500 mt-2">El sistema está funcionando correctamente</p>
                </div>
            </div>
        );
    }

    // Estado de colapso por alerta
    const [collapsedIds, setCollapsedIds] = useState(new Set());
    const toggleCollapse = (id) => setCollapsedIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const getSeverityConfig = (severity) => {
        const configs = {
            CRITICAL: {
                icon: FiAlertTriangle,
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                textColor: 'text-red-700',
                badgeBg: 'bg-red-100',
                badgeText: 'text-red-800'
            },
            HIGH: {
                icon: FiAlertCircle,
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-200',
                textColor: 'text-orange-700',
                badgeBg: 'bg-orange-100',
                badgeText: 'text-orange-800'
            },
            MEDIUM: {
                icon: FiInfo,
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200',
                textColor: 'text-yellow-700',
                badgeBg: 'bg-yellow-100',
                badgeText: 'text-yellow-800'
            },
            LOW: {
                icon: FiInfo,
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                textColor: 'text-blue-700',
                badgeBg: 'bg-blue-100',
                badgeText: 'text-blue-800'
            }
        };
        return configs[severity] || configs.LOW;
    };

    const getTypeIcon = (type) => {
        const icons = {
            RETENTION: FiUsers,
            PERFORMANCE: FiTrendingDown,
            ATTENDANCE: FiClock,
            DEPARTMENT: FiTarget
        };
        return icons[type] || FiInfo;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Alertas Proactivas</h3>
                <div className="flex gap-2">
                    {summary && (
                        <>
                            {summary.critical > 0 && (
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                    {summary.critical} Críticas
                                </span>
                            )}
                            {summary.high > 0 && (
                                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                                    {summary.high} Altas
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {alerts.map((alert, index) => {
                    const severityConfig = getSeverityConfig(alert.severity);
                    const SeverityIcon = severityConfig.icon;
                    const TypeIcon = getTypeIcon(alert.type);
                    const isCollapsed = collapsedIds.has(alert.id);

                    return (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`border-l-4 ${severityConfig.borderColor} ${severityConfig.bgColor} rounded-r-lg overflow-hidden`}
                        >
                            {/* Header colapsable */}
                            <button
                                onClick={() => toggleCollapse(alert.id)}
                                className="w-full flex items-start gap-3 p-4 text-left hover:brightness-95 transition-all"
                            >
                                <div className={`p-2 rounded-lg ${severityConfig.badgeBg} shrink-0`}>
                                    <SeverityIcon className={`w-5 h-5 ${severityConfig.textColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                        <h4 className={`font-semibold ${severityConfig.textColor} text-sm leading-snug`}>
                                            {alert.title}
                                        </h4>
                                        <span className={`px-2 py-0.5 ${severityConfig.badgeBg} ${severityConfig.badgeText} rounded text-xs font-medium shrink-0`}>
                                            {alert.severity}
                                        </span>
                                        <TypeIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                    </div>
                                    <p className="text-xs text-gray-600 mt-0.5 truncate">{alert.description}</p>
                                </div>
                                {isCollapsed ? <FiChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" /> : <FiChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
                            </button>
 
                            {/* Detalle expandible */}
                            <AnimatePresence initial={false}>
                                {!isCollapsed && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 pl-8 sm:pl-[60px]">
                                            {alert.employee && (
                                                <div className="text-xs text-gray-600 mb-2">
                                                    <span className="font-medium">Empleado:</span> {alert.employee.name}
                                                    {alert.employee.department && ` — ${alert.employee.department}`}
                                                </div>
                                            )}

                                            {alert.factors && alert.factors.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-medium text-gray-600 mb-1">Factores detectados:</p>
                                                    <ul className="text-xs text-gray-600 space-y-0.5">
                                                        {alert.factors.map((factor, i) => (
                                                            <li key={i} className="flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full shrink-0" />
                                                                {typeof factor === 'object' ? (factor.factor || JSON.stringify(factor)) : factor}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                                                <div className="mt-2 pt-3 border-t border-gray-200">
                                                    <p className="text-xs font-medium text-gray-700 mb-2">Acciones recomendadas:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {alert.recommendedActions.map((action, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => onAlertAction && onAlertAction(alert, action)}
                                                                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors font-medium"
                                                            >
                                                                {action}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

AlertsPanel.propTypes = {
    alerts: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        severity: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        employee: PropTypes.shape({
            id: PropTypes.number,
            name: PropTypes.string,
            department: PropTypes.string,
            position: PropTypes.string
        }),
        factors: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
        recommendedActions: PropTypes.arrayOf(PropTypes.string),
        detectedAt: PropTypes.string,
        priority: PropTypes.number
    })),
    summary: PropTypes.shape({
        total: PropTypes.number,
        critical: PropTypes.number,
        high: PropTypes.number,
        medium: PropTypes.number,
        low: PropTypes.number,
        byType: PropTypes.object
    }),
    onAlertAction: PropTypes.func,
};

export default AlertsPanel;
