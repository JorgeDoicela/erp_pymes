/**
 * @file employee.types.ts
 * @description Definición de tipos estáticos de dominio para Talento Humano y Empleados (Fase 4 / Clean Architecture).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export type EmployeeRole = 'admin' | 'hr' | 'accounting' | 'employee' | 'supervisor' | 'security' | 'support' | 'superadmin';
export type ContractType = 'Indefinido' | 'Temporal' | 'Por Obra' | 'Prácticas';
export type CivilStatus = 'Soltero' | 'Casado' | 'Divorciado' | 'Viudo' | 'Union Libre';

export interface IEmployee {
  id: string;
  tenantId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  role: EmployeeRole;
  identityCard?: string | null;
  birthDate?: Date | null;
  hireDate?: Date | null;
  address?: string | null;
  phone?: string | null;
  contractType?: ContractType | string | null;
  civilStatus?: CivilStatus | string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountType?: 'Ahorros' | 'Corriente' | null;
  hasNightSurcharge: boolean;
  hasDoubleOvertime: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
