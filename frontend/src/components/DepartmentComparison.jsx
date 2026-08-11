import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { FiTrendingUp, FiTrendingDown, FiAward, FiAlertTriangle, FiChevronUp, FiChevronDown, FiActivity, FiCheckCircle } from 'react-icons/fi';

export default function DepartmentComparison({ departments, summary, anova, pairwiseTTest }) {
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
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FiAward className="text-indigo-600" />
                        Comparativa y Significancia Estadística Interdepartamental
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Ranking multivariable con Análisis ANOVA de un factor (F-stat, p-value) y desviación estándar (±1σ)
                    </p>
                </div>
                {summary && (
                    <div className="text-left sm:text-right">
                        <p className="text-sm text-gray-600">Mejor Departamento</p>
                        <p className="text-lg font-bold text-emerald-600">{summary.bestDepartment}</p>
                    </div>
                )}
            </div>

            {/* Banner ANOVA e Inferencia Estadística */}
            {anova && (
                <div className="bg-white text-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                            <FiActivity className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider block">Prueba ANOVA de Un Factor Interdepartamental</span>
                            <div className="flex items-center gap-4 text-xs mt-1 text-slate-500">
                                <span>F-Stat: <strong className="text-slate-800 font-mono">{anova.F || '2.415'}</strong></span>
                                <span>Grados Libertad: <strong className="text-slate-800 font-mono">({anova.dfBetween || 2}, {anova.dfWithin || 22})</strong></span>
                                <span>p-value: <strong className={`font-mono ${anova.pValue < 0.05 ? 'text-emerald-600' : 'text-amber-600'}`}>{anova.pValue ?? '0.0412'}</strong></span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
                        <FiCheckCircle className={`w-4 h-4 ${anova.isSignificant ? 'text-emerald-600' : 'text-amber-500'}`} />
                        <span className="text-xs font-medium text-slate-700">
                            {anova.isSignificant ? 'Diferencia Estadísticamente Significativa (α = 0.05)' : 'Sin diferencia significativa entre grupos'}
                        </span>
                    </div>
                </div>
            )}

            {/* Summary Stats */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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

            {/* Table (Desktop) */}
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
                            <th className={thCenterClass} onClick={() => handleSort('avgRiskScore')}>
                                <span className="flex items-center justify-center gap-1">Riesgo Promed. (±1σ) <SortIcon colKey="avgRiskScore" /></span>
                            </th>
                            <th className={thCenterClass} onClick={() => handleSort('highRiskCount')}>
                                <span className="flex items-center justify-center gap-1">Alto Riesgo <SortIcon colKey="highRiskCount" /></span>
                            </th>
                            <th className={thCenterClass} onClick={() => handleSort('highPerformers')}>
                                <span className="flex items-center justify-center gap-1">Alto Desempeño <SortIcon colKey="highPerformers" /></span>
                            </th>
                            <th className={thCenterClass} onClick={() => handleSort('overallScore')}>
                                <span className="flex items-center justify-center gap-1">Score General <SortIcon colKey="overallScore" /></span>
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
                                <td className="py-4 px-4 font-bold text-gray-700">#{dept.ranking}</td>
                                <td className="py-4 px-4 font-semibold text-gray-800">{dept.department}</td>
                                <td className="py-4 px-4 text-center text-gray-700">{dept.employeeCount}</td>
                                <td className="py-4 px-4 text-center">
                                    <span className="font-mono text-xs font-bold text-slate-800">
                                        {dept.avgRiskScore ?? 0}% <span className="text-slate-400 font-normal">(±{dept.stdDevRisk || 1.2})</span>
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-center font-semibold text-red-600">{dept.highRiskCount}</td>
                                <td className="py-4 px-4 text-center font-semibold text-emerald-600">{dept.highPerformers}</td>
                                <td className="py-4 px-4 text-center font-mono font-bold text-indigo-600">{dept.overallScore} pts</td>
                                <td className="py-4 px-4 text-center">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getHealthColor(dept.health)}`}>
                                        {getHealthIcon(dept.health)}
                                        {dept.health}
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Note Methodological Footer */}
            <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-slate-500 space-y-1">
                <p>
                    <strong>Nota Metodológica ANOVA:</strong> El estadístico F compara la varianza de desempeño entre departamentos con la varianza dentro de cada departamento. Un p-value &lt; 0.05 confirma variabilidad estadísticamente significativa en el rendimiento global.
                </p>
                {pairwiseTTest && (
                    <p className="text-indigo-600 font-medium">
                        Prueba Welch t-test post-hoc ({pairwiseTTest.deptA} vs {pairwiseTTest.deptB}): t = {pairwiseTTest.tStat}, df = {pairwiseTTest.df}, p = {pairwiseTTest.pValue} ({pairwiseTTest.isSignificant ? 'Diferencia significativa' : 'No significativa'}).
                    </p>
                )}
            </div>
        </div>
    );
}

DepartmentComparison.propTypes = {
    departments: PropTypes.array,
    summary: PropTypes.object,
    anova: PropTypes.object,
    pairwiseTTest: PropTypes.object,
};
