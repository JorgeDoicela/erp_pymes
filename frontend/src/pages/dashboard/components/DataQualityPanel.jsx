import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDataQualityReport } from "../../../services/intelligenceService";
import {
    FiChevronDown,
    FiChevronUp,
    FiRefreshCw,
    FiArrowRight,
    FiCheckCircle
} from "react-icons/fi";

/**
 * Panel de Calidad y Auditoría de Datos
 * Cumple con el estándar de diseño ERP PyME:
 * - Sobrio, limpio, de alto contraste y sin decoraciones innecesarias
 * - Tipografía Inter con cifras tabulares en font-mono
 * - Tablas estructuradas y botones sin fondos chillones
 */
export default function DataQualityPanel() {
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState("evaluations");

    const load = async () => {
        setLoading(true);
        try {
            const res = await getDataQualityReport();
            setReport(res.data);
        } catch (err) {
            console.error("Error al cargar calidad de datos:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded p-3 flex items-center gap-2.5 text-xs text-gray-500 font-mono">
                <FiRefreshCw className="animate-spin text-gray-400 w-3.5 h-3.5" />
                <span>Auditanado completitud de registros para IA...</span>
            </div>
        );
    }

    if (!report) return null;

    const {
        completenessPercent,
        aiConfidenceLevel,
        summary,
        missingData,
        recommendations,
        totalEmployees,
        dataReadyForAI
    } = report;

    const tabs = [
        {
            key: "evaluations",
            label: "Evaluaciones",
            count: summary.missingEvaluations,
            route: "/performance",
            actionLabel: "Registrar Evaluación"
        },
        {
            key: "attendance",
            label: "Asistencia",
            count: summary.missingAttendance,
            route: "/attendance",
            actionLabel: "Cargar Asistencia"
        },
        {
            key: "salary",
            label: "Salario",
            count: summary.missingSalary,
            route: "/admin/employees",
            actionLabel: "Completar Salario"
        },
    ];

    const activeTab_ = tabs.find(t => t.key === activeTab);
    const activeList = missingData[activeTab] || [];

    // Estado Colapsado por defecto si los datos están al 95%+
    if (completenessPercent >= 95 && !expanded) {
        return (
            <div
                onClick={() => setExpanded(true)}
                className="bg-white border border-gray-200 hover:border-gray-300 rounded p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors"
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span className="text-xs text-gray-700">
                        Completitud de datos al <strong className="font-mono font-semibold text-gray-900">{completenessPercent}%</strong> · Confianza {aiConfidenceLevel}
                    </span>
                    <span className="text-gray-300 hidden sm:inline">|</span>
                    <span className="text-xs text-gray-500 font-mono hidden sm:inline">
                        {totalEmployees} colaboradores analizados
                    </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20 h-1.5 bg-gray-100 rounded overflow-hidden">
                        <div
                            className="h-full bg-emerald-600 rounded"
                            style={{ width: `${completenessPercent}%` }}
                        />
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium hover:text-gray-900 flex items-center gap-1">
                        Ver auditoría <FiChevronDown className="w-3.5 h-3.5" />
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
            {/* Header del Panel */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between p-3.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50/50 transition-colors gap-3"
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                            !dataReadyForAI ? "bg-red-600" : completenessPercent < 80 ? "bg-amber-500" : "bg-emerald-600"
                        }`}
                    />
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold text-gray-900 tracking-tight">
                                Auditoría de Calidad de Datos
                            </h4>
                            <span className="text-[11px] font-mono font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                {completenessPercent}% Completitud
                            </span>
                            <span className="text-[11px] text-gray-500">
                                · Confianza {aiConfidenceLevel}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                            {totalEmployees} colaboradores · {summary.missingEvaluations} sin eval · {summary.missingAttendance} sin asistencia · {summary.missingSalary} sin salario
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded overflow-hidden">
                            <div
                                className={`h-full rounded ${
                                    !dataReadyForAI ? "bg-red-600" : completenessPercent < 80 ? "bg-amber-500" : "bg-emerald-600"
                                }`}
                                style={{ width: `${completenessPercent}%` }}
                            />
                        </div>
                        <span className="text-xs font-mono font-semibold text-gray-800">{completenessPercent}%</span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            load();
                        }}
                        className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer transition-colors"
                        title="Recalcular completitud"
                    >
                        <FiRefreshCw className="w-3.5 h-3.5" />
                    </button>
                    {expanded ? (
                        <FiChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                        <FiChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                </div>
            </div>

            {/* Contenido Expandido */}
            {expanded && (
                <div className="p-4 space-y-4 bg-white">
                    {/* Tarjetas de Métricas Cuantitativas */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: "Con Evaluaciones", value: summary.withEvaluations, missing: summary.missingEvaluations },
                            { label: "Con Asistencia", value: summary.withAttendance, missing: summary.missingAttendance },
                            { label: "Con Salario", value: summary.withSalary, missing: summary.missingSalary },
                            { label: "Con Ausencias", value: summary.withAbsenceRecords, missing: 0 },
                        ].map((m) => (
                            <div key={m.label} className="bg-gray-50 border border-gray-200 rounded p-3">
                                <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-500 block">
                                    {m.label}
                                </span>
                                <div className="mt-1 flex items-baseline gap-1">
                                    <span className="text-lg font-bold font-mono text-gray-900">
                                        {m.value}
                                    </span>
                                    <span className="text-xs font-mono text-gray-400">
                                        /{totalEmployees}
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 mt-0.5 block">
                                    {m.missing > 0 ? `${m.missing} pendientes` : "100% completo"}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Recomendaciones Técnicas */}
                    {recommendations.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-700 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-gray-600 tracking-wider block">
                                Recomendación de Gobierno de Datos
                            </span>
                            {recommendations.map((rec, i) => (
                                <p key={i} className="text-xs text-gray-600">
                                    • {rec}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Pestañas de Filtro */}
                    <div className="flex border-b border-gray-200 gap-5 text-xs pt-1">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`pb-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                                        isActive
                                            ? "border-b-2 border-gray-900 text-gray-900 font-semibold"
                                            : "text-gray-500 hover:text-gray-800"
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className="text-[11px] font-mono text-gray-500">
                                        ({tab.count})
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tabla de Colaboradores con Datos Pendientes */}
                    <div className="border border-gray-200 rounded overflow-hidden">
                        {activeList.length === 0 ? (
                            <div className="p-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                                <FiCheckCircle className="text-emerald-600 w-4 h-4" />
                                <span>Todos los colaboradores cuentan con {activeTab_?.label.toLowerCase()} registrada</span>
                            </div>
                        ) : (
                            <div>
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="py-2 px-3">Colaborador</th>
                                            <th className="py-2 px-3">Departamento</th>
                                            <th className="py-2 px-3">Cargo</th>
                                            <th className="py-2 px-3 text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-gray-700">
                                        {activeList.slice(0, 6).map((emp) => (
                                            <tr key={emp.employeeId} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2 font-medium text-gray-900">
                                                        <div className="w-6 h-6 rounded bg-gray-100 text-gray-700 font-mono font-semibold text-xs flex items-center justify-center shrink-0">
                                                            {emp.name?.charAt(0) || "?"}
                                                        </div>
                                                        <span>{emp.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3 text-gray-600 font-normal">
                                                    {emp.department || "—"}
                                                </td>
                                                <td className="py-2 px-3 text-gray-500 font-normal">
                                                    {emp.position || "—"}
                                                </td>
                                                <td className="py-2 px-3 text-right">
                                                    <button
                                                        onClick={() => {
                                                            if (activeTab === 'salary' && emp.employeeId) {
                                                                navigate(`/admin/employees/${emp.employeeId}`);
                                                            } else if (activeTab === 'evaluations') {
                                                                navigate('/performance');
                                                            } else if (activeTab === 'attendance') {
                                                                navigate('/attendance');
                                                            } else {
                                                                navigate(activeTab_?.route || '/admin');
                                                            }
                                                        }}
                                                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                                                    >
                                                        <span>Gestionar</span>
                                                        <FiArrowRight className="w-3 h-3" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {activeList.length > 6 && (
                                    <p className="text-[11px] text-gray-400 py-2 text-center border-t border-gray-100 font-mono">
                                        + {activeList.length - 6} colaboradores adicionales
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
