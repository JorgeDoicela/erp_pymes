/**
 * @file financialUtils.js
 * @description Utilidades de cálculo financiero con precisión decimal arbitraria Decimal.js (Norma ERP Core Utils).
 * Garantiza redondeo bancario ROUND_HALF_UP para nómina, contabilidad e impuestos.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Decimal } from 'decimal.js';

// Configurar Decimal para precisión financiera de 20 dígitos y ROUND_HALF_UP
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Motor de cálculos financieros con precisión decimal
 */
export const financial = {
  /**
   * Convierte un valor a Decimal
   */
  from: (value) => new Decimal(value || 0),

  /**
   * Redondea un valor a precisión fija (por defecto 2 decimales)
   */
  round: (value, decimals = 2) => {
    return new Decimal(value || 0).toDecimalPlaces(decimals).toNumber();
  },

  /**
   * Calcula porcentaje de un valor
   */
  percentage: (value, percent) => {
    return new Decimal(value).mul(new Decimal(percent)).div(100);
  },

  /**
   * Suma segura de múltiples valores
   */
  sum: (...values) => {
    return values.reduce((acc, val) => acc.plus(new Decimal(val || 0)), new Decimal(0));
  },

  /**
   * Resta segura de múltiples valores desde una base
   */
  subtract: (base, ...values) => {
    return values.reduce((acc, val) => acc.minus(new Decimal(val || 0)), new Decimal(base || 0));
  },

  /**
   * Multiplicación estándar
   */
  multiply: (a, b) => new Decimal(a).mul(new Decimal(b)),

  /**
   * División estándar
   */
  divide: (a, b) => new Decimal(a).div(new Decimal(b)),

  min: (...values) => Decimal.min(...values.map((val) => new Decimal(val || 0))),

  max: (...values) => Decimal.max(...values.map((val) => new Decimal(val || 0))),
};

export default financial;
