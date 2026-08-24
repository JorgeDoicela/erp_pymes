import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDataQualityReport } from "../../../services/intelligenceService";
import {
    FiDatabase, FiAlertTriangle, FiCheckCircle, FiChevronDown,
    FiChevronUp, FiUser, FiCalendar, FiDollarSign, FiClock,
    FiArrowRight, FiRefreshCw, FiInfo
} from "react-icons/fi";

/**
 * Panel de Calidad de Datos — muestra la completitud real de datos
 * de cada empresa para que el motor de IA funcione con datos reales.
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
            <div className="dq-panel dq-loading">
                <FiDatabase />
                <span>Verificando completitud de datos...</span>
            </div>
        );
    }

    if (!report) return null;

    const { completenessPercent, aiConfidenceLevel, summary, missingData, recommendations, totalEmployees, dataReadyForAI } = report;
    const confidenceColor = completenessPercent >= 80 ? "#10b981" : completenessPercent >= 60 ? "#f59e0b" : "#ef4444";

    const tabs = [
        { key: "evaluations", label: "Evaluaciones", count: summary.missingEvaluations, icon: FiUser, route: "/admin/performance", actionLabel: "Ir a Evaluaciones" },
        { key: "attendance",  label: "Asistencia",   count: summary.missingAttendance,  icon: FiCalendar, route: "/admin/attendance", actionLabel: "Ir a Asistencia" },
        { key: "salary",      label: "Salario",       count: summary.missingSalary,      icon: FiDollarSign, route: "/admin/employees", actionLabel: "Completar en Empleados" },
    ];

    const activeTab_ = tabs.find(t => t.key === activeTab);
    const activeList = missingData[activeTab] || [];

    if (completenessPercent >= 95 && !expanded) {
        return (
            <div className="dq-panel dq-complete" onClick={() => setExpanded(true)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, marginBottom: 20, fontSize: 13, color: "#15803d" }}>
                <FiCheckCircle />
                <span><strong>Datos completos al {completenessPercent}%</strong> — Motor de IA operando con máxima precisión</span>
                <FiChevronDown style={{ marginLeft: "auto", color: "#9ca3af" }} />
            </div>
        );
    }

    const panelBg = !dataReadyForAI ? "#fef2f2" : completenessPercent < 80 ? "#fffbeb" : "#f0fdf4";
    const panelBorder = !dataReadyForAI ? "#fecaca" : completenessPercent < 80 ? "#fde68a" : "#bbf7d0";

    return (
        <div style={{ background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: 12, marginBottom: 20, overflow: "hidden", fontFamily: "Inter, sans-serif" }}>
            {/* Header */}
            <div onClick={() => setExpanded(!expanded)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    {!dataReadyForAI
                        ? <FiAlertTriangle style={{ color: "#ef4444", fontSize: 18, flexShrink: 0 }} />
                        : <FiDatabase style={{ color: "#3b82f6", fontSize: 18, flexShrink: 0 }} />
                    }
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 2px" }}>
                            {!dataReadyForAI
                                ? "⚠ Datos insuficientes — El motor de IA requiere más información"
                                : `Completitud de datos: ${completenessPercent}% · Confianza ${aiConfidenceLevel}`
                            }
                        </p>
                        <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>
                            {totalEmployees} colaboradores · {summary.missingEvaluations} sin eval · {summary.missingAttendance} sin asistencia · {summary.missingSalary} sin salario
                        </p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 100, height: 6, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ width: `${completenessPercent}%`, height: "100%", background: confidenceColor, borderRadius: 99, transition: "width 0.4s ease" }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: confidenceColor }}>{completenessPercent}%</span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); load(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}>
                        <FiRefreshCw size={13} />
                    </button>
                    {expanded ? <FiChevronUp style={{ color: "#9ca3af" }} /> : <FiChevronDown style={{ color: "#9ca3af" }} />}
                </div>
            </div>

            {/* Body */}
            {expanded && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    {/* Métricas */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, margin: "14px 0 12px" }}>
                        {[
                            { label: "Con Evaluaciones", value: summary.withEvaluations, color: "#10b981", Icon: FiUser },
                            { label: "Con Asistencia",   value: summary.withAttendance,  color: "#3b82f6", Icon: FiCalendar },
                            { label: "Con Salario",      value: summary.withSalary,      color: "#8b5cf6", Icon: FiDollarSign },
                            { label: "Con Ausencias",    value: summary.withAbsenceRecords, color: "#f59e0b", Icon: FiClock },
                        ].map(m => (
                            <div key={m.label} style={{ background: "white", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, border: "1px solid #e5e7eb" }}>
                                <m.Icon size={16} style={{ color: m.color }} />
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: m.color, lineHeight: 1.1 }}>
                                        {m.value}<span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af" }}>/{totalEmployees}</span>
                                    </div>
                                    <div style={{ fontSize: 10, color: "#6b7280", marginTop: 1 }}>{m.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recomendaciones */}
                    {recommendations.length > 0 && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
                            <FiInfo size={13} style={{ color: "#3b82f6", flexShrink: 0, marginTop: 2 }} />
                            <div>{recommendations.map((rec, i) => <p key={i} style={{ fontSize: 12, color: "#374151", margin: "0 0 3px" }}>{rec}</p>)}</div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                        {tabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 99, fontSize: 12, border: "1px solid", cursor: "pointer", transition: "all 0.15s",
                                    background: activeTab === tab.key ? "#1e40af" : "white",
                                    color:      activeTab === tab.key ? "white"   : "#374151",
                                    borderColor: activeTab === tab.key ? "#1e40af" : "#e5e7eb" }}>
                                <tab.icon size={12} /> {tab.label}
                                {tab.count > 0 && <span style={{ background: activeTab === tab.key ? "rgba(255,255,255,0.3)" : "#ef4444", color: "white", borderRadius: 99, padding: "0 5px", fontSize: 10, fontWeight: 700 }}>{tab.count}</span>}
                            </button>
                        ))}
                    </div>

                    {/* Lista */}
                    <div style={{ background: "white", borderRadius: 8, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                        {activeList.length === 0 ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 12px", fontSize: 13, color: "#10b981" }}>
                                <FiCheckCircle /> Todos los colaboradores tienen {activeTab_?.label.toLowerCase()} registrada
                            </div>
                        ) : (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "8px 12px", fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #f3f4f6" }}>
                                    <span>Colaborador</span><span>Departamento</span><span>Cargo</span>
                                </div>
                                {activeList.slice(0, 8).map(emp => (
                                    <div key={emp.employeeId} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "8px 12px", alignItems: "center", borderBottom: "1px solid #f9fafb", fontSize: 12, color: "#374151" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
                                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                {emp.name?.charAt(0) || "?"}
                                            </div>
                                            {emp.name}
                                        </div>
                                        <span style={{ color: "#6b7280", fontSize: 11 }}>{emp.department || "—"}</span>
                                        <span style={{ color: "#9ca3af", fontSize: 11 }}>{emp.position || "—"}</span>
                                    </div>
                                ))}
                                {activeList.length > 8 && <p style={{ fontSize: 11, color: "#9ca3af", padding: "6px 12px", textAlign: "center", borderTop: "1px solid #f3f4f6" }}>+ {activeList.length - 8} colaboradores más</p>}
                                <div style={{ padding: "10px 12px" }}>
                                    <button onClick={() => navigate(activeTab_?.route)}
                                        style={{ width: "100%", padding: 8, background: "#1e40af", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                        {activeTab_?.actionLabel} <FiArrowRight size={13} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
