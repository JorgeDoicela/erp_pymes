import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import RiskScoreIndicator from '../RiskScoreIndicator.jsx';

describe('RiskScoreIndicator Component Test Suite', () => {

    it('should render high risk level with red color scheme and badge', () => {
        render(<RiskScoreIndicator score={85} level="Alto Riesgo" size="md" />);

        expect(screen.getByText('85')).toBeInTheDocument();
        expect(screen.getByText('Alto Riesgo')).toBeInTheDocument();
        const badge = screen.getByText('Alto Riesgo');
        expect(badge).toHaveClass('text-red-600');
        expect(badge).toHaveClass('bg-red-100');
    });

    it('should render medium risk level with yellow color scheme and badge', () => {
        render(<RiskScoreIndicator score={50} level="Riesgo Medio" size="sm" />);

        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('Riesgo Medio')).toBeInTheDocument();
        const badge = screen.getByText('Riesgo Medio');
        expect(badge).toHaveClass('text-yellow-600');
        expect(badge).toHaveClass('bg-yellow-100');
    });

    it('should render low risk level with green color scheme and badge', () => {
        render(<RiskScoreIndicator score={20} level="Bajo Riesgo" size="lg" />);

        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByText('Bajo Riesgo')).toBeInTheDocument();
        const badge = screen.getByText('Bajo Riesgo');
        expect(badge).toHaveClass('text-green-600');
        expect(badge).toHaveClass('bg-green-100');
    });
});
