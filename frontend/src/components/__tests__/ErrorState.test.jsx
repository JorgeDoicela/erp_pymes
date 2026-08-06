import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ErrorState from '../ErrorState';

describe('ErrorState Component', () => {
  it('renders default title and message correctly', () => {
    render(<ErrorState />);
    expect(screen.getByText('Error al cargar la información')).toBeInTheDocument();
    expect(screen.getByText(/Ocurrió un problema inesperado/i)).toBeInTheDocument();
  });

  it('renders custom title and message when passed', () => {
    render(<ErrorState title="Fallo de Conexión" message="No se pudo contactar al servidor." />);
    expect(screen.getByText('Fallo de Conexión')).toBeInTheDocument();
    expect(screen.getByText('No se pudo contactar al servidor.')).toBeInTheDocument();
  });

  it('calls onRetry callback when retry button is clicked', () => {
    const handleRetry = vi.fn();
    render(<ErrorState onRetry={handleRetry} />);
    const button = screen.getByRole('button', { name: /Reintentar/i });
    fireEvent.click(button);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
