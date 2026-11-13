/**
 * @file pwa.test.jsx
 * @description Suite de pruebas unitarias para PWAContext y PWAInstallButton
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { PWAProvider, usePWA } from '../PWAContext.jsx';
import PWAInstallButton from '../PWAInstallButton.jsx';
import PWAInstallPrompt from '../PWAInstallPrompt.jsx';

describe('PWA Module Test Suite', () => {
  it('debe renderizar el botón de instalación en sus diferentes variantes cuando no está instalada', () => {
    render(
      <PWAProvider>
        <PWAInstallButton variant="button" label="Instalar Norma" />
        <PWAInstallButton variant="sidebar" label="Instalar PWA Sidebar" />
        <PWAInstallButton variant="header-menu" label="Instalar PWA Header" />
        <PWAInstallButton variant="card" />
      </PWAProvider>
    );

    expect(screen.getByText('Instalar Norma')).toBeInTheDocument();
    expect(screen.getByText('Instalar PWA Sidebar')).toBeInTheDocument();
    expect(screen.getByText('Instalar PWA Header')).toBeInTheDocument();
    expect(screen.getByText('Instalar Norma ERP')).toBeInTheDocument();
  });

  it('debe renderizar el botón flotante global PWAInstallPrompt y abrir la guía al pulsar clic', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <PWAProvider>
          <PWAInstallPrompt />
        </PWAProvider>
      </MemoryRouter>
    );

    const floatingBtn = screen.getByRole('button', {
      name: /Instalar Norma ERP en su dispositivo/i,
    });
    expect(floatingBtn).toBeInTheDocument();
    expect(screen.getByText('Acceso Directo')).toBeInTheDocument();

    fireEvent.click(floatingBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Entendido')).toBeInTheDocument();
  });

  it('debe abrir el modal de instrucciones cuando se presiona instalar sin evento nativo disponible', () => {
    render(
      <PWAProvider>
        <PWAInstallButton variant="button" label="Instalar App" />
      </PWAProvider>
    );

    const button = screen.getByText('Instalar App');
    fireEvent.click(button);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Entendido')).toBeInTheDocument();

    // Cerrar modal
    fireEvent.click(screen.getByText('Entendido'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
