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
        <div className="bg-white rounded border border-gray-200 p-5 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <FiAward className="text-blue-600" />
                        Comparativa y Significancia Estadística Interdepartamental
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Ranking multivariable con prueba ANOVA de un factor (F-stat, p-value) y desviación estándar (±1σ).
                    </p>
                </div>
                {summary && (
                    <div className="text-left sm:text-right">
                        <p className="text-[11px] text-gray-400 font-medium">Mayor Rendimiento</p>
                        <p className="text-xs font-semibold text-green-700">{summary.bestDepartment}</p>
                    </div>
                )}
            </div>

            {/* Banner ANOVA e Inferencia Estadística */}
            {anova && (
                <div className="bg-gray-50 rounded p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border border-gray-200 text-xs">
                    <div className="flex items-start gap-2.5">
                        <FiActivity className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Prueba ANOVA Interdepartamental</span>
                            <div className="flex items-center gap-3 text-xs mt-0.5 text-gray-600">
                                <span>F-Stat: <strong className="text-gray-900 font-mono">{anova.F !== undefined ? anova.F : 'N/A'}</strong></span>
                                <span>Grados Libertad: <strong className="text-gray-900 font-mono">({anova.dfBetween ?? 0}, {anova.dfWithin ?? 0})</strong></span>
                                <span>p-value: <strong className={`font-mono ${anova.pValue < 0.05 ? 'text-green-700' : 'text-amber-700'}`}>{anova.pValue !== undefined ? anova.pValue : 'N/A'}</strong></span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-gray-200 shrink-0">
                        <FiCheckCircle className={`w-3.5 h-3.5 ${anova.isSignificant ? 'text-green-600' : 'text-amber-500'}`} />
                        <span className="text-[11px] font-medium text-gray-700">
                            {anova.isSignificant ? 'Diferencia Significativa (α = 0.05)' : 'Sin diferencia significativa'}
                        </span>
                    </div>
                </div>
            )}

            {/* Table (Desktop) */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[11px] uppercase font-semibold">
                        <tr>
                            <th className={thClass} onClick={() => handleSort('ranking')}>
                                <span className="flex items-center gap-1">Pos. <SortIcon colKey="ranking" /></span>
                            </th>
                            <th className={thClass} onClick={() => handleSort('department')}>
                                <span className="flex items-center gap-1">Departamento <SortIcon colKey="department" /></span>
                            </th>
                            <th className={thCenterClass} onClick={() => handleSort('employeeCount')}>
                                <span className="flex items-center justify-center gap-1">Personal <SortIcon colKey="employeeCount" /></span>
                            </th>
                            <th className={thCenterClass} onClick={() => handleSort('avgRiskScore')}>
                                <span className="flex items-center justify-center gap-1">Riesgo Prom. (±1σ) <SortIcon colKey="avgRiskScore" /></span>
                            </th>
                            <th className={thCenterClass} onClick={() => handleSort('highRiskCount')}>
                                <span className="flex items-center justify-center gap-1">Riesgo Alto <SortIcon colKey="highRiskCount" /></span>
                            </th>
                            <th className={thCenterClass} onClick={() => handleSort('highPerformers')}>
                                <span className="flex items-center justify-center gap-1">Alto Desempeño <SortIcon colKey="highPerformers" /></span>
                            </th>
                            <th className={thCenterClass} onClick={() => handleSort('overallScore')}>
                                <span className="flex items-center justify-center gap-1">Puntaje Global <SortIcon colKey="overallScore" /></span>
                            </th>
                            <th className={thCenterClass}>Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedDepartments.map((dept) => (
                            <tr
                                key={dept.department}
                                className="hover:bg-gray-50/60 transition-colors"
                            >
                                <td className="py-2.5 px-3 font-mono font-medium text-gray-600">#{dept.ranking}</td>
                                <td className="py-2.5 px-3 font-medium text-gray-900">{dept.department}</td>
                                <td className="py-2.5 px-3 text-center font-mono text-gray-700">{dept.employeeCount}</td>
                                <td className="py-2.5 px-3 text-center font-mono text-xs">
                                    <span className="font-semibold text-gray-800">
                                        {dept.avgRiskScore ?? 0}% <span className="text-gray-400 font-normal">(±{dept.stdDevRisk || 1.2})</span>
                                    </span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono font-medium text-red-600">{dept.highRiskCount}</td>
                                <td className="py-2.5 px-3 text-center font-mono font-medium text-green-700">{dept.highPerformers}</td>
                                <td className="py-2.5 px-3 text-center font-mono font-semibold text-blue-700">{dept.overallScore} pts</td>
                                <td className="py-2.5 px-3 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${getHealthColor(dept.health)}`}>
                                        {dept.health}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Note Methodological Footer */}
            <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 space-y-0.5">
                <p>
                    <strong className="text-gray-700">Nota ANOVA:</strong> El estadístico F compara la varianza interdepartamental vs intra-departamento. Un p-value &lt; 0.05 valida la significancia estadística.
                </p>
                {pairwiseTTest && (
                    <p className="text-blue-700 font-mono">
                        Welch t-test ({pairwiseTTest.deptA} vs {pairwiseTTest.deptB}): t = {pairwiseTTest.tStat}, df = {pairwiseTTest.df}, p = {pairwiseTTest.pValue} ({pairwiseTTest.isSignificant ? 'Diferencia significativa' : 'No significativa'}).
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
