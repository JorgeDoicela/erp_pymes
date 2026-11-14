import { describe, it, expect } from 'vitest';
import {
  getAdvanceRemainingBalance,
  resolveInstallmentAmount,
} from '../../../src/modules/payroll/advances/advanceInstallment.js';

const buildAdvance = (overrides = {}) => ({
  amount: 100,
  installments: 3,
  monthlyDeduction: 33.33,
  paidAmount: 0,
  paidInstallments: 0,
  ...overrides,
});

describe('Cuota de anticipo de sueldo (advanceInstallment)', () => {
  it('cobra la cuota mensual pactada en las cuotas intermedias', () => {
    expect(resolveInstallmentAmount(buildAdvance()).toNumber()).toBe(33.33);
    expect(
      resolveInstallmentAmount(buildAdvance({ paidAmount: 33.33, paidInstallments: 1 })).toNumber()
    ).toBe(33.33);
  });

  it('cobra el saldo exacto en la última cuota para cerrar el anticipo al centavo', () => {
    const lastInstallment = resolveInstallmentAmount(
      buildAdvance({ paidAmount: 66.66, paidInstallments: 2 })
    );

    // 100 / 3 = 33.33 x 3 = 99.99: la última cuota absorbe el centavo restante
    expect(lastInstallment.toNumber()).toBe(33.34);
    expect(lastInstallment.plus(66.66).toNumber()).toBe(100);
  });

  it('no cobra de más cuando la cuota redondeada supera el saldo pendiente', () => {
    // 200 / 3 = 66.67 x 3 = 200.01: la última cuota se reduce a 66.66
    const advance = buildAdvance({
      amount: 200,
      monthlyDeduction: 66.67,
      paidAmount: 133.34,
      paidInstallments: 2,
    });

    expect(resolveInstallmentAmount(advance).toNumber()).toBe(66.66);
  });

  it('limita una cuota intermedia al saldo pendiente si hubo abonos adelantados', () => {
    const advance = buildAdvance({ paidAmount: 90, paidInstallments: 1 });

    expect(resolveInstallmentAmount(advance).toNumber()).toBe(10);
  });

  it('devuelve 0 cuando ya se cobraron todas las cuotas', () => {
    const advance = buildAdvance({ paidAmount: 100, paidInstallments: 3 });

    expect(resolveInstallmentAmount(advance).toNumber()).toBe(0);
  });

  it('cobra el monto completo cuando el anticipo es de una sola cuota', () => {
    const advance = buildAdvance({ amount: 250.5, installments: 1, monthlyDeduction: 250.5 });

    expect(resolveInstallmentAmount(advance).toNumber()).toBe(250.5);
  });

  it('nunca reporta saldo pendiente negativo', () => {
    expect(getAdvanceRemainingBalance(buildAdvance({ paidAmount: 120 })).toNumber()).toBe(0);
  });
});
