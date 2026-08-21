import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import HealthMeter from '../HealthMeter.jsx';

describe('HealthMeter Component Test Suite', () => {

    const mockHealthData = {
        overallHealth: 85,
        healthLevel: 'Excelente',
        components: {
            retention: 90,
            performance: 85,
            attendance: 88,
            departments: 80
        },
        kpis: {
            totalEmployees: 42,
            avgTenure: 3.5,
            rotationRate: '4.2',
            satisfactionIndex: 91
        }
    };

    it('should return null when health prop is not provided', () => {
        const { container } = render(<HealthMeter health={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render overall health score, level and all component categories', () => {
        render(<HealthMeter health={mockHealthData} />);

        expect(screen.getByText('Salud Organizacional')).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument();
        expect(screen.getByText('de 100')).toBeInTheDocument();
        expect(screen.getByText('Excelente')).toBeInTheDocument();

        // Components
        expect(screen.getByText('Retención')).toBeInTheDocument();
        expect(screen.getByText('90%')).toBeInTheDocument();
        expect(screen.getByText('Desempeño')).toBeInTheDocument();
        expect(screen.getByText('85%')).toBeInTheDocument();
        expect(screen.getByText('Asistencia')).toBeInTheDocument();
        expect(screen.getByText('88%')).toBeInTheDocument();

        // KPIs
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Empleados')).toBeInTheDocument();
        expect(screen.getByText('3.5')).toBeInTheDocument();
        expect(screen.getByText('Años Promedio')).toBeInTheDocument();
    });
});
