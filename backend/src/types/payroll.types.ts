/**
 * @file payroll.types.ts
 * @description Definición de tipos estáticos de dominio para Nómina y Rubros Legales (Fase 4 / Clean Architecture).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export type PayrollItemType = 'DEDUCTION' | 'EARNING';
export type PayrollStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'ANNULLED';

export interface IPayrollConfigItem {
  id?: string;
  configId?: string;
  name: string;
  type: PayrollItemType;
  isMandatory: boolean;
  percentage?: number | null;
  fixedValue?: number | null;
}

export interface IPayrollConfig {
  id: string;
  tenantId?: string | null;
  workingDays: number;
  currency: string;
  isActive: boolean;
  items?: IPayrollConfigItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPayrollDetail {
  id: string;
  payrollId: string;
  employeeId: string;
  baseSalary: number;
  workedDays: number;
  overtimeHours50?: number;
  overtimeAmount50?: number;
  overtimeHours100?: number;
  overtimeAmount100?: number;
  nightHours?: number;
  nightSurchargeAmount?: number;
  thirteenthSalary?: number;
  fourteenthSalary?: number;
  reserveFunds?: number;
  iessPersonalDeduction: number;
  iessPatronalContribution: number;
  taxWithholding?: number;
  netSalary: number;
  isSigned?: boolean;
  signedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPayroll {
  id: string;
  tenantId?: string | null;
  month: number;
  year: number;
  period: string;
  status: PayrollStatus;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  details?: IPayrollDetail[];
  createdAt?: Date;
  updatedAt?: Date;
}
