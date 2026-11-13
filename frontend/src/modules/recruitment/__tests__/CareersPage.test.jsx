/**
 * @file CareersPage.test.jsx
 * @description Pruebas unitarias del selector intermedio de empresas y listado de vacantes públicas
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CareersPage from '../pages/CareersPage.jsx';
import * as recruitmentService from '../services/recruitment.service.js';

vi.mock('../services/recruitment.service.js', () => ({
  getPublicCompanies: vi.fn(),
  getPublicVacancies: vi.fn(),
}));

describe('CareersPage — Selector intermedio de empresas y vacantes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el directorio intermedio de empresas cuando no hay empresa seleccionada y navega al elegir una', async () => {
    recruitmentService.getPublicCompanies.mockResolvedValue([
      { id: 't-1', name: 'Acme Ecuador S.A.', slug: 'acme-ecuador', openVacanciesCount: 2 },
      { id: 't-2', name: 'Andes Tech', slug: 'andes-tech', openVacanciesCount: 0 },
    ]);
    recruitmentService.getPublicVacancies.mockResolvedValue([
      {
        id: 'vac-1',
        title: 'Analista Contable Senior',
        department: 'Finanzas',
        location: 'Quito',
        employmentType: 'Tiempo Completo',
        salaryMin: 1200,
        salaryMax: 1500,
        tenant: { id: 't-1', name: 'Acme Ecuador S.A.', slug: 'acme-ecuador' },
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/careers']}>
        <Routes>
          <Route path="/careers" element={<CareersPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Acme Ecuador S.A.')).toBeInTheDocument();
    expect(screen.getByText('Andes Tech')).toBeInTheDocument();
    expect(screen.getByText('2 vacantes abiertas')).toBeInTheDocument();
    expect(screen.getByText('Sin vacantes abiertas')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button', { name: /Ver vacantes/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(recruitmentService.getPublicVacancies).toHaveBeenCalledWith({
        companySlug: 'acme-ecuador',
      });
    });

    expect(await screen.findByText('Analista Contable Senior')).toBeInTheDocument();
    expect(screen.getByText('Vacantes en Acme Ecuador S.A.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Elegir otra empresa/i })).toBeInTheDocument();
  });

  it('permite filtrar empresas por nombre en el directorio intermedio', async () => {
    recruitmentService.getPublicCompanies.mockResolvedValue([
      { id: 't-1', name: 'Acme Ecuador S.A.', slug: 'acme-ecuador', openVacanciesCount: 2 },
      { id: 't-2', name: 'Andes Tech', slug: 'andes-tech', openVacanciesCount: 1 },
    ]);

    render(
      <MemoryRouter initialEntries={['/careers']}>
        <Routes>
          <Route path="/careers" element={<CareersPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Acme Ecuador S.A.');

    const searchInput = screen.getByPlaceholderText('Buscar empresa por nombre...');
    fireEvent.change(searchInput, { target: { value: 'Andes' } });

    expect(screen.queryByText('Acme Ecuador S.A.')).not.toBeInTheDocument();
    expect(screen.getByText('Andes Tech')).toBeInTheDocument();
  });
});
