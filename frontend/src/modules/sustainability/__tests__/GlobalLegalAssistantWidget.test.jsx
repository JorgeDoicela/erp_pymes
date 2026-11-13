/**
 * @file GlobalLegalAssistantWidget.test.jsx
 * @description Pruebas unitarias y de integración del componente GlobalLegalAssistantWidget y useSustainabilityAdvisor.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GlobalLegalAssistantWidget from '../components/GlobalLegalAssistantWidget.jsx';
import { resolveActiveModuleContext } from '../constants/legalAssistantContexts.js';
import * as sustainabilityService from '../services/sustainability.service.js';

vi.mock('../services/sustainability.service.js', () => ({
  queryAdvisor: vi.fn(),
  getOds8Dashboard: vi.fn(),
  exportFineTuningDataset: vi.fn(),
}));

describe('GlobalLegalAssistantWidget — Asistente Jurídico y Contable Multi-Módulo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detecta el contexto del módulo activo según la ruta (/employees) y muestra las consultas sugeridas', () => {
    render(
      <MemoryRouter initialEntries={['/employees']}>
        <GlobalLegalAssistantWidget />
      </MemoryRouter>
    );

    const triggerBtn = screen.getByRole('button', { name: /Abrir Asistente Legal IA/i });
    expect(triggerBtn).toBeInTheDocument();
    expect(triggerBtn.textContent).toMatch(/employees/i);

    fireEvent.click(triggerBtn);

    expect(
      screen.getByRole('heading', { name: /Talento Humano, LOPDP y Seguridad Social/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/¿Desde qué día es obligatoria la afiliación al IESS/i)
    ).toBeInTheDocument();
  });

  it('envía una consulta sugerida sin incluir odsTargetFilter: null, renderiza el dictamen y abre el Drawer de cita legal', async () => {
    sustainabilityService.queryAdvisor.mockResolvedValueOnce({
      success: true,
      data: {
        answer:
          'Conforme al Art. 73 de la Ley de Seguridad Social, la afiliación al IESS es obligatoria desde el primer día de labor.',
        moduleContext: 'employees',
        inferenceMode: 'DETERMINISTIC_RAG_EVALUATOR',
        totalIndexedArticles: 1899,
        evaluationAudit: {
          status: 'VERIFIED',
          groundednessScore: 1.0,
          mathVerified: true,
          totalCorpusIndexedChunks: 1899,
        },
        legalCitations: [
          {
            documentTitle: 'Ley de Seguridad Social (IESS)',
            articleCode: 'Art. 73',
            odsTarget: '8.8',
            relevanceScore: 0.98,
            fullContent:
              'Art. 73.- Inscripción del afiliado y pago de aportes.- El empleador está obligado a inscribir al trabajador desde el primer día de labor.',
          },
        ],
      },
    });

    render(
      <MemoryRouter initialEntries={['/employees']}>
        <GlobalLegalAssistantWidget />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Abrir Asistente Legal IA/i }));

    const suggestedPromptBtn = screen.getByText(
      /¿Desde qué día es obligatoria la afiliación al IESS/i
    );
    fireEvent.click(suggestedPromptBtn);

    await waitFor(() => {
      expect(sustainabilityService.queryAdvisor).toHaveBeenCalledTimes(1);
    });

    const sentPayload = sustainabilityService.queryAdvisor.mock.calls[0][0];
    expect(sentPayload.moduleContext).toBe('employees');
    expect(sentPayload.odsTargetFilter).toBeUndefined();

    expect(
      await screen.findByText(/la afiliación al IESS es obligatoria desde el primer día/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/100%/i)).toBeInTheDocument();

    const citationPill = screen.getByRole('button', { name: 'Art. 73' });
    fireEvent.click(citationPill);

    expect(
      await screen.findByText(/El empleador está obligado a inscribir al trabajador/i)
    ).toBeInTheDocument();
  });

  it('permite configurar un proveedor LLM personalizado y enviar una consulta libre por formulario', async () => {
    sustainabilityService.queryAdvisor.mockResolvedValueOnce({
      success: true,
      data: {
        answer: 'Liquidación calculada con Decimal.js: Total $5,100.00 USD.',
        moduleContext: 'offboarding',
        inferenceMode: 'DeepSeek (deepseek-chat)',
        totalIndexedArticles: 1899,
        evaluationAudit: { groundednessScore: 0.98 },
        legalCitations: [],
      },
    });

    render(
      <MemoryRouter initialEntries={['/offboarding']}>
        <GlobalLegalAssistantWidget />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Abrir Asistente Legal IA/i }));
    fireEvent.click(screen.getByRole('button', { name: /Configurar Motor IA/i }));

    const providerSelect = screen.getByLabelText(/^Proveedor$/i);
    fireEvent.change(providerSelect, { target: { value: 'deepseek' } });

    const input = screen.getByPlaceholderText(
      /Pregunte por un artículo legal o solicite un cálculo/i
    );
    fireEvent.change(input, {
      target: { value: 'Calcula liquidación por despido con $850 y 4 años' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enviar/i }));

    await waitFor(() => {
      expect(sustainabilityService.queryAdvisor).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Calcula liquidación por despido con $850 y 4 años',
          moduleContext: 'offboarding',
          providerOverrides: { provider: 'deepseek' },
        })
      );
    });

    expect(await screen.findByText(/Liquidación calculada con Decimal\.js/i)).toBeInTheDocument();
  });

  it('resuelve correctamente el contexto de módulo en todas las pestañas del ERP', () => {
    expect(resolveActiveModuleContext('/my-advances').code).toBe('payroll');
    expect(resolveActiveModuleContext('/empleado/asistencia').code).toBe('attendance');
    expect(resolveActiveModuleContext('/empleado/ausencias').code).toBe('attendance');
    expect(resolveActiveModuleContext('/empleado').code).toBe('employees');
    expect(resolveActiveModuleContext('/admin/expedientes').code).toBe('employees');
    expect(resolveActiveModuleContext('/my-assets').code).toBe('employees');
    expect(resolveActiveModuleContext('/admin/signatures').code).toBe('signatures');
    expect(resolveActiveModuleContext('/admin/compliance').code).toBe('compliance');
    expect(resolveActiveModuleContext('/recruitment').code).toBe('recruitment');
    expect(resolveActiveModuleContext('/analytics').code).toBe('analytics');
    expect(resolveActiveModuleContext('/intelligence').code).toBe('analytics');
    expect(resolveActiveModuleContext('/admin/entrepreneurship').code).toBe('entrepreneurship');
  });
});
