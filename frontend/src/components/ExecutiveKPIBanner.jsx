import { motion } from 'framer-motion';
import { FiDollarSign, FiShield, FiClock, FiTrendingUp } from 'react-icons/fi';

/**
 * Banner Ejecutivo de Impacto Financiero y ROI de RRHH
 * Diseño Ultra-Minimalista: Monocromático, limpio y sin saturación de colores, adaptado a móviles.
 */
export default function ExecutiveKPIBanner({ financialImpact }) {
    const data = financialImpact || {
        estimatedTurnoverCostRisk: 14500,
        potentialRetentionSavings: 10875,
        estimatedAbsenteeismCost: 3200,
        overtimeSavings: 1650,
        totalFinancialOpportunity: 15725,
        currency: 'USD',
        paybackPeriodMonths: 2.3,
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: data.currency || 'USD',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    return (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-5">
            {/* Header Limpio */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug break-words">
                        Resumen Financiero y Retorno de Inversión (ROI)
                    </h2>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">Indicadores monetarios de retención y productividad</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-3 sm:px-3.5 sm:py-2 rounded-xl flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-between sm:justify-start min-w-0">
                    <FiTrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="min-w-0">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block truncate">OPORTUNIDAD DE AHORRO NETO</span>
                        <span className="text-base font-extrabold text-slate-900 block truncate">{formatCurrency(data.totalFinancialOpportunity)}</span>
                    </div>
                </div>
            </div>

            {/* Grid de Métricas Ultra-Limpio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {/* KPI 1: Costo en Riesgo por Rotación */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">Riesgo Financiero Rotación</span>
                        <FiDollarSign className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xl font-extrabold text-slate-900">{formatCurrency(data.estimatedTurnoverCostRisk)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Fuga estimada de talento activo</p>
                </div>

                {/* KPI 2: Retención Preventiva Saved */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">Ahorro Retención Preventiva</span>
                        <FiShield className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xl font-extrabold text-emerald-600">{formatCurrency(data.potentialRetentionSavings)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Evitado con intervención (75%)</p>
                </div>

                {/* KPI 3: Pérdida por Ausentismo */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">Costo por Ausentismo</span>
                        <FiClock className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xl font-extrabold text-slate-900">{formatCurrency(data.estimatedAbsenteeismCost)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Horas no trabajadas acumuladas</p>
                </div>

                {/* KPI 4: Payback Period */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">Payback del Sistema</span>
                        <FiTrendingUp className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-xl font-extrabold text-indigo-600">{data.paybackPeriodMonths} meses</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Recuperación estimada de inversión</p>
                </div>
            </div>
        </div>
    );
}
