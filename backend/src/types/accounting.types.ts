/**
 * @file accounting.types.ts
 * @description Definición de tipos estáticos de dominio para el módulo Contable (Fase 4 / Clean Architecture).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type JournalEntryType = 'DAILY' | 'INCOME' | 'EXPENSE' | 'STANDARD' | 'PAYROLL' | 'ADJUSTMENT' | 'CLOSING';
export type JournalEntryStatus = 'DRAFT' | 'POSTED' | 'ANNULLED';
export type PeriodStatus = 'OPEN' | 'CLOSED';

export interface IAccountingPeriod {
  id: string;
  tenantId?: string | null;
  year: number;
  month: number;
  startDate: Date;
  endDate: Date;
  status: PeriodStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAccountingAccount {
  id: string;
  tenantId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  type: AccountType;
  level: number;
  isTransactional: boolean;
  parentId?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICostCenter {
  id: string;
  tenantId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IJournalLine {
  id?: string;
  journalEntryId?: string;
  accountId: string;
  costCenterId?: string | null;
  description?: string | null;
  debit: number;
  credit: number;
  account?: IAccountingAccount;
  costCenter?: ICostCenter;
}

export interface IJournalEntry {
  id: string;
  tenantId?: string | null;
  entryNumber: string;
  date: Date;
  description: string;
  type: JournalEntryType;
  status: JournalEntryStatus;
  totalDebit: number;
  totalCredit: number;
  referenceModule?: string | null;
  referenceId?: string | null;
  lines?: IJournalLine[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITrialBalanceRow {
  id: string;
  code: string;
  name: string;
  totalDebits: number;
  totalCredits: number;
  balance: number;
}
