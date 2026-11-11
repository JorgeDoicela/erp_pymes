/**
 * @file validationDto.test.js
 * @description Pruebas unitarias para middleware de validación y DTOs con Zod (Fase 1).
 */

import { describe, it, expect, vi } from 'vitest';
import { validate } from '../../src/core/middleware/validate.middleware.js';
import { createEmployeeDto } from '../../src/modules/employees/index.js';
import { createJournalEntryDto } from '../../src/modules/accounting/index.js';
import { generatePayrollDto } from '../../src/modules/payroll/index.js';

describe('Fase 1: Middleware de Validación y DTOs con Zod', () => {
  describe('Middleware validate()', () => {
    it('debe responder 400 y formato ValidationError cuando el body es inválido', async () => {
      const middleware = validate(generatePayrollDto);
      const req = { body: { month: 15, year: 2026 } }; // Mes 15 es inválido
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          type: 'ValidationError',
          errors: expect.arrayContaining([expect.objectContaining({ field: 'month' })]),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('debe llamar a next() y mutar body saneado cuando los datos son válidos', async () => {
      const middleware = validate(generatePayrollDto);
      const req = { body: { month: '6', year: '2026' } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.month).toBe(6);
      expect(req.body.year).toBe(2026);
    });
  });

  describe('DTO createEmployeeDto', () => {
    it('debe rechazar contraseña corta y salario no positivo', () => {
      const invalidData = {
        firstName: 'Juan',
        lastName: 'Perez',
        email: 'juan@empresa.com',
        department: 'Sistemas',
        position: 'Desarrollador',
        salary: -500,
        password: '123', // menos de 8
      };

      const result = createEmployeeDto.safeParse(invalidData);
      expect(result.success).toBe(false);
      const errors = result.error.issues.map((i) => i.path[0]);
      expect(errors).toContain('salary');
      expect(errors).toContain('password');
    });

    it('debe rechazar empleado menor de edad a la fecha de contratación', () => {
      const underAgeData = {
        firstName: 'Carlos',
        lastName: 'Mena',
        email: 'carlos@empresa.com',
        department: 'Ventas',
        position: 'Asesor',
        salary: 460,
        password: 'passwordSeguro123',
        birthDate: '2010-01-01',
        hireDate: '2024-01-01', // Tenía 14 años
      };

      const result = createEmployeeDto.safeParse(underAgeData);
      expect(result.success).toBe(false);
      expect(result.error.issues.some((i) => i.message.includes('mayor de edad'))).toBe(true);
    });
  });

  describe('DTO createJournalEntryDto', () => {
    it('debe rechazar asientos con menos de 2 líneas', () => {
      const entryConUnaLinea = {
        date: '2026-03-01',
        description: 'Pago de servicios',
        lines: [{ accountId: 'acc-1', debit: 100, credit: 0 }],
      };

      const result = createJournalEntryDto.safeParse(entryConUnaLinea);
      expect(result.success).toBe(false);
      expect(result.error.issues.some((i) => i.message.includes('al menos 2 líneas'))).toBe(true);
    });

    it('debe rechazar líneas con DEBE y HABER mayores a cero simultáneamente', () => {
      const entryLineaInvalida = {
        date: '2026-03-01',
        description: 'Ajuste contable',
        lines: [
          { accountId: 'acc-1', debit: 50, credit: 50 },
          { accountId: 'acc-2', debit: 0, credit: 50 },
        ],
      };

      const result = createJournalEntryDto.safeParse(entryLineaInvalida);
      expect(result.success).toBe(false);
    });
  });
});
