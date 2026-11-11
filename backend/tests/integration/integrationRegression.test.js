/**
 * @file integrationRegression.test.js
 * @description Suite de Pruebas de Integración y Regresión (Fase 5 / Clean Architecture).
 * Valida: Aislamiento estricto Multi-Tenant, Partida Doble Contable y Fórmulas Laborales de Nómina.
 */

import { describe, it, expect } from 'vitest';
import {
  runWithTenant,
  runWithoutTenantFilter,
  getTenantId,
  isSuperAdminContext,
  isTenantFilterBypassed,
} from '../../src/database/tenantContext.js';
import { financial } from '../../src/core/utils/financialUtils.js';

describe('Fase 5: Suite de Integración y Regresión de Arquitectura', () => {
  // =========================================================================
  // 1. Aislamiento Multi-Tenant (AsyncLocalStorage Context)
  // =========================================================================
  describe('Aislamiento Multi-Tenant en Contexto Asíncrono', () => {
    it('debe mantener el tenantId aislado dentro del callback de ejecución', () => {
      runWithTenant('tenant-empresa-a', () => {
        expect(getTenantId()).toBe('tenant-empresa-a');
        expect(isSuperAdminContext()).toBe(false);
        expect(isTenantFilterBypassed()).toBe(false);
      });
    });

    it('no debe filtrar ni contaminar el contexto fuera de la ejecución de runWithTenant', () => {
      runWithTenant('tenant-empresa-b', () => {
        expect(getTenantId()).toBe('tenant-empresa-b');
      });
      // Fuera del callback el store debe ser null o no existir
      expect(getTenantId()).toBeNull();
    });

    it('debe soportar contextos de SuperAdmin y bypass de filtros de forma controlada', () => {
      runWithTenant(
        'tenant-empresa-c',
        () => {
          expect(getTenantId()).toBe('tenant-empresa-c');
          expect(isSuperAdminContext()).toBe(true);

          runWithoutTenantFilter(() => {
            expect(isTenantFilterBypassed()).toBe(true);
            expect(getTenantId()).toBe('tenant-empresa-c');
          });

          // Al salir del bypass, debe restaurar bypassTenantFilter a false
          expect(isTenantFilterBypassed()).toBe(false);
        },
        true
      );
    });

    it('debe manejar contextos concurrentes asíncronos sin colisión entre empresas', async () => {
      const p1 = new Promise((resolve) => {
        runWithTenant('tenant-alpha', async () => {
          await new Promise((r) => setTimeout(r, 20));
          resolve(getTenantId());
        });
      });

      const p2 = new Promise((resolve) => {
        runWithTenant('tenant-beta', async () => {
          await new Promise((r) => setTimeout(r, 10));
          resolve(getTenantId());
        });
      });

      const [tenant1, tenant2] = await Promise.all([p1, p2]);
      expect(tenant1).toBe('tenant-alpha');
      expect(tenant2).toBe('tenant-beta');
    });
  });

  // =========================================================================
  // 2. Partida Doble Contable y Precisión Decimal
  // =========================================================================
  describe('Invariante de Partida Doble Contable', () => {
    it('debe verificar cuadratura exacta cuando Total Debe es igual a Total Haber', () => {
      const lines = [
        { accountId: 'acc-activo', debit: 1250.75, credit: 0 },
        { accountId: 'acc-gasto', debit: 349.25, credit: 0 },
        { accountId: 'acc-pasivo', debit: 0, credit: 1600.0 },
      ];

      const sumDebits = lines.reduce(
        (acc, l) => acc.plus(financial.from(l.debit || 0)),
        financial.from(0)
      );
      const sumCredits = lines.reduce(
        (acc, l) => acc.plus(financial.from(l.credit || 0)),
        financial.from(0)
      );

      expect(sumDebits.equals(sumCredits)).toBe(true);
      expect(financial.round(sumDebits)).toBe(1600.0);
      expect(financial.round(sumCredits)).toBe(1600.0);
    });

    it('debe detectar descuadres de centavos evitando errores de punto flotante IEEE 754', () => {
      // 0.1 + 0.2 en JavaScript nativo es 0.30000000000000004
      const linesDescuadradas = [
        { accountId: 'acc-1', debit: 0.1, credit: 0 },
        { accountId: 'acc-2', debit: 0.2, credit: 0 },
        { accountId: 'acc-3', debit: 0, credit: 0.31 }, // 1 centavo de más
      ];

      const sumDebits = linesDescuadradas.reduce(
        (acc, l) => acc.plus(financial.from(l.debit || 0)),
        financial.from(0)
      );
      const sumCredits = linesDescuadradas.reduce(
        (acc, l) => acc.plus(financial.from(l.credit || 0)),
        financial.from(0)
      );

      expect(sumDebits.equals(sumCredits)).toBe(false);
      expect(financial.round(sumDebits)).toBe(0.3);
      expect(financial.round(sumCredits)).toBe(0.31);
    });
  });

  // =========================================================================
  // 3. Fórmulas Legales de Nómina (Código de Trabajo Ecuador)
  // =========================================================================
  describe('Cálculos Legales de Nómina (Ecuador)', () => {
    const SBU = 460.0;
    const HORAS_MES = 240; // 30 días * 8 horas

    it('debe calcular el valor de la hora ordinaria correctamente', () => {
      const valorHora = financial.round(financial.from(SBU).div(HORAS_MES));
      expect(valorHora).toBe(1.92);
    });

    it('debe calcular la hora suplementaria al 50% con precisión', () => {
      const valorHora = financial.from(SBU).div(HORAS_MES);
      const hora50 = financial.round(valorHora.times(1.5));
      expect(hora50).toBe(2.88);
    });

    it('debe calcular la hora extraordinaria o feriado al 100% con precisión', () => {
      const valorHora = financial.from(SBU).div(HORAS_MES);
      const hora100 = financial.round(valorHora.times(2.0));
      expect(hora100).toBe(3.83);
    });

    it('debe calcular la deducción del Aporte Personal al IESS (9.45%)', () => {
      const aportePersonal = financial.round(financial.from(SBU).times(0.0945));
      expect(aportePersonal).toBe(43.47);
    });

    it('debe calcular el Fondo de Reserva mensualizado (8.33%)', () => {
      const fondoReserva = financial.round(financial.from(SBU).times(0.0833333333));
      expect(fondoReserva).toBe(38.33);
    });
  });
});
