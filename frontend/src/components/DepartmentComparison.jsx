import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { FiTrendingUp, FiTrendingDown, FiAward, FiAlertTriangle, FiChevronUp, FiChevronDown } from 'react-icons/fi';

export default function DepartmentComparison({ departments, summary }) {
    const [sortConfig, setSortConfig] = useState({ key: 'ranking', direction: 'asc' });

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

    // Fix #19: Ordenamiento interactivo por columna
    const handleSort = (key) => {
        setSortConfig(prev =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' }
        );
    };

    const sortedDepartments = useMemo(() => {
        if (!departments) return [];
        return [...departments].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            if (typeof aVal === 'string') return aVal.localeCompare(bVal) * dir;
            return (aVal - bVal) * dir;
        });
    }, [departments, sortConfig]);

    const SortIcon = ({ colKey }) => {
        if (sortConfig.key !== colKey) return <FiChevronDown className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
        return sortConfig.direction === 'asc'
            ? <FiChevronUp className="w-3 h-3 text-indigo-500" />
            : <FiChevronDown className="w-3 h-3 text-indigo-500" />;
    };

    const thClass = "group text-left py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:text-indigo-600 select-none transition-colors";
    const thCenterClass = thClass + " text-center";

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FiAward className="text-indigo-600" />
                        Comparativa de Departamentos
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Ranking basado en retención, desempeño y asistencia · Haz clic en los encabezados para ordenar
                    </p>
                </div>
                {summary && (
                    <div className="text-left sm:text-right">
                        <p className="text-sm text-gray-600">Mejor Departamento</p>
                        <p className="text-lg font-bold text-emerald-600">{summary.bestDepartment}</p>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
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

            {/* Vista de Tarjetas para Móviles/Tabletas (< lg) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {sortedDepartments.map((dept, index) => (
                    <motion.div
                        key={dept.department}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between gap-4 hover:border-indigo-300 hover:shadow-md transition-all group duration-300"
                    >
                        {/* Header card */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                {dept.ranking === 1 ? (
                                    <div className="w-9 h-9 rounded-lg bg-yellow-50 text-yellow-500 border border-yellow-100 flex items-center justify-center shrink-0 shadow-2xs">
                                        <FiAward className="w-5 h-5 animate-pulse" />
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                                        #{dept.ranking}
                                    </div>
                                )}
                                <h3 className="font-bold text-slate-800 text-sm leading-snug truncate group-hover:text-indigo-600 transition-colors" title={dept.department}>
                                    {dept.department}
                                </h3>
                            </div>

                            <span
                                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getHealthColor(
                                    dept.health
                                )}`}
                            >
                                {getHealthIcon(dept.health)}
                                {dept.health}
                            </span>
                        </div>

                        {/* Content metrics */}
                        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs grid grid-cols-3 gap-2">
                            <div className="text-center border-r border-slate-200/60 pr-1">
                                <span className="text-slate-400 font-medium block">Personal</span>
                                <span className="text-sm font-bold text-slate-800 block mt-0.5">{dept.employeeCount}</span>
                            </div>
                            <div className="text-center border-r border-slate-200/60 px-1">
                                <span className="text-slate-400 font-medium block">Alto Riesgo</span>
                                <span className="text-sm font-bold text-rose-600 block mt-0.5">{dept.highRiskCount}</span>
                                <span className="text-[10px] text-slate-400">({dept.highRiskPercentage.toFixed(0)}%)</span>
                            </div>
                            <div className="text-center pl-1">
                                <span className="text-slate-400 font-medium block">Alto Desemp.</span>
                                <span className="text-sm font-bold text-emerald-600 block mt-0.5">{dept.highPerformers}</span>
                                <span className="text-[10px] text-slate-400">({dept.highPerformerPercentage.toFixed(0)}%)</span>
                            </div>
                        </div>

                        {/* Score Indicator */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                <span>Score General:</span>
                                <span>{dept.overallScore.toFixed(0)} pts</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${dept.overallScore < 20
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
                        </div>
                    </motion.div>
                ))}

                {sortedDepartments.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-xl border border-slate-200">
                        <p className="text-sm">No hay departamentos para mostrar.</p>
                    </div>
                )}
            </div>

            {/* Department Table (Desktop Only >= lg) */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className={thClass} onClick={() => handleSort('ranking')}>
                                <span className="flex items-center gap-1">Ranking <SortIcon colKey="ranking" /></span>
                            </th>
                            <th className={thClass} onClick={() => handleSort('department')}>
                                <span className="flex items-center gap-1">Departamento <SortIcon colKey="department" /></span>
                            </th>
                            <th className={thCenterClass} onClick={() => handleSort('employeeCount')}>
                                <span className="flex items-center justify-center gap-1">Empleados <SortIcon colKey="employeeCount" /></span>
                            </th>
                            <th className={thCenterClass} onClick={() => handleSort('highRiskCount')}>
                                <span className="flex items-center justify-center gap-1">Alto Riesgo <SortIcon colKey="highRiskCount" /></span>
                            </th>
                            <th className={thCenterClass} onClick={() => handleSort('highPerformers')}>
                                <span className="flex items-center justify-center gap-1">Alto Desempeño <SortIcon colKey="highPerformers" /></span>
                            </th>
                            <th className={thCenterClass} onClick={() => handleSort('overallScore')}>
                                <span className="flex items-center justify-center gap-1">Score <SortIcon colKey="overallScore" /></span>
                            </th>
                            <th className={thCenterClass}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDepartments.map((dept, index) => (
                            <motion.tr
                                key={dept.department}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
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

                {sortedDepartments.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm">No hay departamentos para mostrar.</p>
                    </div>
                )}
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
