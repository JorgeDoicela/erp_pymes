import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import IntelligentInsightCard from '../IntelligentInsightCard.jsx';
import { FiTrendingUp } from 'react-icons/fi';

describe('IntelligentInsightCard Component Test Suite', () => {

    it('should render title, value, priority badge, and description correctly', () => {
        render(
            <IntelligentInsightCard
                icon={FiTrendingUp}
                title="Riesgo de Rotación"
                value="12%"
                trend={-3.5}
                description="Reducción positiva en rotación durante el último trimestre."
                priority="high"
                color="red"
            />
        );

        expect(screen.getByText('Riesgo de Rotación')).toBeInTheDocument();
        expect(screen.getByText('12%')).toBeInTheDocument();
        expect(screen.getByText('Alta')).toBeInTheDocument();
        expect(screen.getByText('Reducción positiva en rotación durante el último trimestre.')).toBeInTheDocument();
        expect(screen.getByText(/3.5%/)).toBeInTheDocument();
    });

    it('should trigger onAction callback when action button is clicked', () => {
        const handleAction = vi.fn();
        render(
            <IntelligentInsightCard
                title="Oportunidad de Retención"
                value="94%"
                description="Intervención contrafactual recomendada"
                onAction={handleAction}
            />
        );

        const button = screen.getByRole('button', { name: /Ver detalles/i });
        fireEvent.click(button);
        expect(handleAction).toHaveBeenCalledTimes(1);
    });
});
