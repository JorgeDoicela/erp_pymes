/**
 * @file advanceInstallment.js
 * @description Regla de dominio para el valor de la cuota de un anticipo de sueldo que se descuenta en nómina.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { financial } from '../../../core/utils/financialUtils.js';

/**
 * Saldo pendiente de un anticipo (nunca negativo).
 *
 * @param {{ amount: number, paidAmount?: number }} advance
 * @returns {import('decimal.js').Decimal}
 */
export function getAdvanceRemainingBalance(advance) {
  const remaining = financial.subtract(advance.amount, advance.paidAmount);
  return financial.max(remaining, 0);
}

/**
 * Valor a descontar en la siguiente cuota de un anticipo.
 *
 * La cuota mensual se guarda redondeada a 2 decimales, por lo que la suma de cuotas puede
 * diferir en centavos del monto original (100 / 3 = 33.33 x 3 = 99.99). Para que el anticipo
 * cierre exacto, la última cuota cobra el saldo pendiente y ninguna cuota supera ese saldo.
 *
 * @param {{ amount: number, paidAmount?: number, installments: number, paidInstallments?: number, monthlyDeduction: number }} advance
 * @returns {import('decimal.js').Decimal} Valor de la cuota (0 si el anticipo ya está saldado)
 */
export function resolveInstallmentAmount(advance) {
  const remaining = getAdvanceRemainingBalance(advance);
  const nextInstallment = (advance.paidInstallments || 0) + 1;

  if (nextInstallment > advance.installments) return financial.from(0);
  if (nextInstallment === advance.installments) return remaining;

  return financial.min(advance.monthlyDeduction, remaining);
}
