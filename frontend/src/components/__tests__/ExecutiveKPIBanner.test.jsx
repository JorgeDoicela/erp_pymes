import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ExecutiveKPIBanner from '../ExecutiveKPIBanner.jsx';

describe('ExecutiveKPIBanner Component Test Suite', () => {

    it('should render default KPI values when no custom financialImpact prop is provided', () => {
        render(<ExecutiveKPIBanner />);

        expect(screen.getByText('Resumen Financiero y Retorno de Inversión (ROI)')).toBeInTheDocument();
        expect(screen.getByText('OPORTUNIDAD DE AHORRO NETO')).toBeInTheDocument();
        expect(screen.getByText('Riesgo Rotación')).toBeInTheDocument();
        expect(screen.getByText('Ahorro Retención')).toBeInTheDocument();
        expect(screen.getByText('Costo Ausentismo')).toBeInTheDocument();
        expect(screen.getByText('Payback Sistema')).toBeInTheDocument();
        expect(screen.getByText('2.3 meses')).toBeInTheDocument();
    });

    it('should render formatted custom financial metrics properly', () => {
        const customData = {
            estimatedTurnoverCostRisk: 25000,
            potentialRetentionSavings: 18750,
            estimatedAbsenteeismCost: 4500,
            overtimeSavings: 2100,
            totalFinancialOpportunity: 27100,
            currency: 'USD',
            paybackPeriodMonths: 1.8
        };

        render(<ExecutiveKPIBanner financialImpact={customData} />);

        expect(screen.getByText('$27,100')).toBeInTheDocument();
        expect(screen.getByText('$25,000')).toBeInTheDocument();
        expect(screen.getByText('$18,750')).toBeInTheDocument();
        expect(screen.getByText('$4,500')).toBeInTheDocument();
        expect(screen.getByText('1.8 meses')).toBeInTheDocument();
    });
});
