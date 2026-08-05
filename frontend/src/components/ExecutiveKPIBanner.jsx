import { motion } from 'framer-motion';
import { FiDollarSign, FiShield, FiClock, FiTrendingUp } from 'react-icons/fi';

/**
 * Banner Ejecutivo de Impacto Financiero y ROI de RRHH
 * Diseño Ultra-Minimalista: Monocromático, limpio y sin saturación de colores
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
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-5">
            {/* Header Limpio */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        Resumen Financiero y Retorno de Inversión (ROI)
                    </h2>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">Indicadores monetarios de retención y productividad</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-lg flex items-center gap-2.5 self-start sm:self-auto">
                    <FiTrendingUp className="w-4 h-4 text-indigo-600" />
                    <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Oportunidad de Ahorro Neto</span>
                        <span className="text-base font-bold text-slate-900">{formatCurrency(data.totalFinancialOpportunity)}</span>
                    </div>
                </div>
            </div>

            {/* Grid de Métricas Ultra-Limpio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* KPI 1: Costo en Riesgo por Rotación */}
                <div className="bg-slate-50/60 p-4 rounded-lg border border-slate-200/70">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500">Riesgo Financiero Rotación</span>
                        <FiDollarSign className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(data.estimatedTurnoverCostRisk)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Fuga estimada de talento activo</p>
                </div>

                {/* KPI 2: Retención Preventiva Saved */}
                <div className="bg-slate-50/60 p-4 rounded-lg border border-slate-200/70">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500">Ahorro Retención Preventiva</span>
                        <FiShield className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(data.potentialRetentionSavings)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Evitado con intervención (75%)</p>
                </div>

                {/* KPI 3: Pérdida por Ausentismo */}
                <div className="bg-slate-50/60 p-4 rounded-lg border border-slate-200/70">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500">Costo por Ausentismo</span>
                        <FiClock className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(data.estimatedAbsenteeismCost)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Horas no trabajadas acumuladas</p>
                </div>

                {/* KPI 4: Payback Period */}
                <div className="bg-slate-50/60 p-4 rounded-lg border border-slate-200/70">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500">Payback del Sistema</span>
                        <FiTrendingUp className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-xl font-bold text-indigo-600">{data.paybackPeriodMonths} meses</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Recuperación estimada de inversión</p>
                </div>
            </div>
        </div>
    );
}
