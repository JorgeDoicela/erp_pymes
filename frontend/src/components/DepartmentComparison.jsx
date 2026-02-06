import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { FiTrendingUp, FiTrendingDown, FiAward, FiAlertTriangle } from 'react-icons/fi';

export default function DepartmentComparison({ departments, summary }) {
    const getHealthColor = (health) => {
        switch (health) {
            case 'Excelente':
                return 'text-emerald-600 bg-emerald-50';
            case 'Bueno':
                return 'text-blue-600 bg-blue-50';
            case 'Regular':
                return 'text-yellow-600 bg-yellow-50';
            case 'Crítico':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getHealthIcon = (health) => {
        switch (health) {
            case 'Excelente':
            case 'Bueno':
                return <FiTrendingUp className="w-5 h-5" />;
            case 'Regular':
                return <FiAlertTriangle className="w-5 h-5" />;
            case 'Crítico':
                return <FiTrendingDown className="w-5 h-5" />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FiAward className="text-indigo-600" />
                        Comparativa de Departamentos
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Ranking basado en retención, desempeño y asistencia
                    </p>
                </div>
                {summary && (
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Mejor Departamento</p>
                        <p className="text-lg font-bold text-emerald-600">{summary.bestDepartment}</p>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            {summary && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{summary.excellent}</p>
                        <p className="text-xs text-emerald-700">Excelente</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{summary.good}</p>
                        <p className="text-xs text-blue-700">Bueno</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-600">{summary.regular}</p>
                        <p className="text-xs text-yellow-700">Regular</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-600">{summary.critical}</p>
                        <p className="text-xs text-red-700">Crítico</p>
                    </div>
                </div>
            )}

            {/* Department Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ranking</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Departamento</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Empleados</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Alto Riesgo</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Alto Desempeño</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments && departments.map((dept, index) => (
                            <motion.tr
                                key={dept.department}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                                {/* Ranking */}
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-2">
                                        {dept.ranking === 1 && (
                                            <FiAward className="w-5 h-5 text-yellow-500" />
                                        )}
                                        <span className="font-bold text-gray-700">#{dept.ranking}</span>
                                    </div>
                                </td>

                                {/* Department Name */}
                                <td className="py-4 px-4">
                                    <span className="font-semibold text-gray-800">{dept.department}</span>
                                </td>

                                {/* Employee Count */}
                                <td className="py-4 px-4 text-center">
                                    <span className="text-gray-700">{dept.employeeCount}</span>
                                </td>

                                {/* High Risk */}
                                <td className="py-4 px-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="font-semibold text-red-600">{dept.highRiskCount}</span>
                                        <span className="text-xs text-gray-500">
                                            ({dept.highRiskPercentage.toFixed(0)}%)
                                        </span>
                                    </div>
                                </td>

                                {/* High Performers */}
                                <td className="py-4 px-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="font-semibold text-emerald-600">{dept.highPerformers}</span>
                                        <span className="text-xs text-gray-500">
                                            ({dept.highPerformerPercentage.toFixed(0)}%)
                                        </span>
                                    </div>
                                </td>

                                {/* Overall Score */}
                                <td className="py-4 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${dept.overallScore < 20
                                                        ? 'bg-emerald-500'
                                                        : dept.overallScore < 40
                                                            ? 'bg-blue-500'
                                                            : dept.overallScore < 60
                                                                ? 'bg-yellow-500'
                                                                : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${Math.min(dept.overallScore, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-600 ml-1">
                                            {dept.overallScore.toFixed(0)}
                                        </span>
                                    </div>
                                </td>

                                {/* Health Status */}
                                <td className="py-4 px-4">
                                    <div className="flex justify-center">
                                        <span
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getHealthColor(
                                                dept.health
                                            )}`}
                                        >
                                            {getHealthIcon(dept.health)}
                                            {dept.health}
                                        </span>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                    <strong>Score General:</strong> Combina riesgo de rotación (40%), desempeño descendente (30%) y problemas de asistencia (30%).
                    Menor score = mejor salud del departamento.
                </p>
            </div>
        </div>
    );
}

DepartmentComparison.propTypes = {
    departments: PropTypes.arrayOf(
        PropTypes.shape({
            department: PropTypes.string.isRequired,
            ranking: PropTypes.number.isRequired,
            employeeCount: PropTypes.number.isRequired,
            highRiskCount: PropTypes.number.isRequired,
            highRiskPercentage: PropTypes.number.isRequired,
            highPerformers: PropTypes.number.isRequired,
            highPerformerPercentage: PropTypes.number.isRequired,
            overallScore: PropTypes.number.isRequired,
            health: PropTypes.string.isRequired,
        })
    ),
    summary: PropTypes.shape({
        totalDepartments: PropTypes.number,
        excellent: PropTypes.number,
        good: PropTypes.number,
        regular: PropTypes.number,
        critical: PropTypes.number,
        bestDepartment: PropTypes.string,
        worstDepartment: PropTypes.string,
    }),
};
