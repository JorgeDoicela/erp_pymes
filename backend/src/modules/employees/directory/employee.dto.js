/**
 * @file employee.dto.js
 * @description Esquemas de validación Zod (DTOs) para la gestión de empleados (RNF-15).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { z } from 'zod';
import { cedulaSchema, phoneEcuadorSchema, positiveMoneySchema } from '../../../core/validators.js';

const VALID_ROLES = ['admin', 'hr', 'accounting', 'employee', 'supervisor', 'security', 'support'];

/**
 * Esquema para Creación de Empleado (POST /api/employees)
 */
export const createEmployeeDto = z
  .object({
    firstName: z
      .string({ required_error: 'El nombre es obligatorio' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(60, 'El nombre no puede exceder 60 caracteres'),
    lastName: z
      .string({ required_error: 'El apellido es obligatorio' })
      .trim()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(60, 'El apellido no puede exceder 60 caracteres'),
    email: z
      .string({ required_error: 'El correo electrónico es obligatorio' })
      .trim()
      .email('El formato del correo electrónico es inválido')
      .toLowerCase(),
    department: z
      .string({ required_error: 'El departamento es obligatorio' })
      .trim()
      .min(1, 'El departamento no puede estar vacío'),
    position: z
      .string({ required_error: 'El puesto de trabajo es obligatorio' })
      .trim()
      .min(1, 'El puesto no puede estar vacío'),
    salary: positiveMoneySchema,
    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    role: z
      .enum(VALID_ROLES, { errorMap: () => ({ message: 'Rol de usuario inválido' }) })
      .default('employee'),
    identityCard: cedulaSchema.optional().or(z.literal('')),
    birthDate: z.string().optional(),
    hireDate: z.string().optional(),
    address: z.string().trim().optional(),
    phone: phoneEcuadorSchema.optional().or(z.literal('')),
    contractType: z.string().optional(),
    civilStatus: z.string().optional(),
    bankName: z.string().trim().optional(),
    accountNumber: z.string().trim().optional(),
    accountType: z.enum(['Ahorros', 'Corriente']).optional(),
    hasNightSurcharge: z.boolean().optional().default(false),
    hasDoubleOvertime: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    // Validar edad mínima (18 años) a la fecha de contratación
    if (data.birthDate && data.hireDate) {
      const birth = new Date(data.birthDate);
      const hire = new Date(data.hireDate);

      if (isNaN(birth.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Fecha de nacimiento inválida',
          path: ['birthDate'],
        });
        return;
      }

      if (isNaN(hire.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Fecha de contratación inválida',
          path: ['hireDate'],
        });
        return;
      }

      if (birth >= hire) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de nacimiento debe ser anterior a la de ingreso',
          path: ['birthDate'],
        });
        return;
      }

      let ageAtHire = hire.getFullYear() - birth.getFullYear();
      const m = hire.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && hire.getDate() < birth.getDate())) {
        ageAtHire--;
      }

      if (ageAtHire < 18) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El empleado debe ser mayor de edad a su fecha de contratación (mínimo 18 años)`,
          path: ['birthDate'],
        });
      }
    }
  });

/**
 * Esquema para Actualización de Empleado (PUT /api/employees/:id)
 */
export const updateEmployeeDto = z.object({
  firstName: z.string().trim().min(2).max(60).optional(),
  lastName: z.string().trim().min(2).max(60).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  department: z.string().trim().min(1).optional(),
  position: z.string().trim().min(1).optional(),
  salary: positiveMoneySchema.optional(),
  password: z.string().min(8).optional().or(z.literal('')),
  role: z.enum(VALID_ROLES).optional(),
  identityCard: cedulaSchema.optional().or(z.literal('')),
  birthDate: z.string().optional(),
  hireDate: z.string().optional(),
  address: z.string().trim().optional(),
  phone: phoneEcuadorSchema.optional().or(z.literal('')),
  contractType: z.string().optional(),
  civilStatus: z.string().optional(),
  bankName: z.string().trim().optional(),
  accountNumber: z.string().trim().optional(),
  accountType: z.enum(['Ahorros', 'Corriente']).optional(),
  hasNightSurcharge: z.boolean().optional(),
  hasDoubleOvertime: z.boolean().optional(),
  isActive: z.boolean().optional(),
  exitDate: z.string().optional(),
  exitReason: z.string().optional(),
});
