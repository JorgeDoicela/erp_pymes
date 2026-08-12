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
        <div className="bg-white rounded p-4 sm:p-5 border border-gray-200 space-y-4">
            {/* Header Limpio */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="min-w-0 flex-1">
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900 tracking-tight leading-snug break-words">
                        Resumen Financiero y Retorno de Inversión (ROI)
                    </h2>
                    <p className="text-xs text-gray-500 font-normal mt-0.5">Indicadores monetarios de retención y productividad</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-2.5 rounded flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-between sm:justify-start min-w-0">
                    <FiTrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block truncate">OPORTUNIDAD DE AHORRO NETO</span>
                        <span className="text-sm font-semibold text-gray-900 font-mono block truncate" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{formatCurrency(data.totalFinancialOpportunity)}</span>
                    </div>
                </div>
            </div>

            {/* Grid de Métricas ERP Sobrio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {/* KPI 1: Costo en Riesgo por Rotación */}
                <div className="bg-white p-3.5 rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Riesgo Rotación</span>
                        <FiDollarSign className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{formatCurrency(data.estimatedTurnoverCostRisk)}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Fuga estimada de talento activo</p>
                </div>

                {/* KPI 2: Retención Preventiva Saved */}
                <div className="bg-white p-3.5 rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Ahorro Retención</span>
                        <FiShield className="w-3.5 h-3.5 text-green-700" />
                    </div>
                    <p className="text-lg font-semibold text-green-800 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{formatCurrency(data.potentialRetentionSavings)}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Evitado con intervención (75%)</p>
                </div>

                {/* KPI 3: Pérdida por Ausentismo */}
                <div className="bg-white p-3.5 rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Costo Ausentismo</span>
                        <FiClock className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{formatCurrency(data.estimatedAbsenteeismCost)}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Horas no trabajadas acumuladas</p>
                </div>

                {/* KPI 4: Payback Period */}
                <div className="bg-white p-3.5 rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Payback Sistema</span>
                        <FiTrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <p className="text-lg font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{data.paybackPeriodMonths} meses</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Recuperación estimada de inversión</p>
                </div>
            </div>
        </div>
    );
}
