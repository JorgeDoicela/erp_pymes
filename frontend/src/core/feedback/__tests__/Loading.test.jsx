/**
 * @file Loading.test.jsx
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Loading from '../Loading.jsx';

describe('Loading Component Test Suite', () => {
  it('should render loading spinner and status text', () => {
    render(<Loading />);

    expect(screen.getByText('Cargando datos...')).toBeInTheDocument();
  });
});
