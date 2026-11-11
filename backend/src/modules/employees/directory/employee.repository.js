/**
 * @file employee.repository.js
 * @description Repositorio de persistencia para el módulo de empleados (Norma ERP).
 * Encapsula todas las operaciones de Prisma ORM y la encriptación/desencriptación AES-256 de campos sensibles.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';
import {
  encrypt,
  encryptSalary,
  decryptSalary,
  safeDecrypt,
  encryptCoordinate,
  decryptCoordinate,
} from '../../../core/security/encryption.js';

export class EmployeeRepository {
  /**
   * Crear un nuevo empleado con contrato inicial y encriptación de datos sensibles
   * @param {Object} data - Datos del empleado
   * @returns {Promise<Object>} Empleado creado
   */
  async create(data) {
    try {
      const { salary, hasNightSurcharge, hasDoubleOvertime, contractType, hireDate, ...rest } =
        data;

      const encryptedSalary = encryptSalary(salary);

      const initialContract = {
        type: contractType || 'Indefinido',
        startDate: new Date(hireDate),
        salary: Number(salary),
        hasNightSurcharge: hasNightSurcharge ?? true,
        hasDoubleOvertime: hasDoubleOvertime ?? true,
        status: 'Active',
      };

      if (rest.workLatitude !== undefined) rest.workLatitude = encryptCoordinate(rest.workLatitude);
      if (rest.workLongitude !== undefined)
        rest.workLongitude = encryptCoordinate(rest.workLongitude);

      const employee = await prisma.employee.create({
        data: {
          ...rest,
          contractType,
          hireDate: new Date(hireDate),
          salary: encryptedSalary,
          bankName: data.bankName ? encrypt(data.bankName) : null,
          accountNumber: data.accountNumber ? encrypt(data.accountNumber) : null,
          contracts: {
            create: initialContract,
          },
        },
      });

      return {
        ...employee,
        salary: decryptSalary(employee.salary),
        bankName: employee.bankName ? safeDecrypt(employee.bankName) : null,
        accountNumber: employee.accountNumber ? safeDecrypt(employee.accountNumber) : null,
        workLatitude: decryptCoordinate(employee.workLatitude),
        workLongitude: decryptCoordinate(employee.workLongitude),
      };
    } catch (error) {
      throw new Error(`Error al crear empleado: ${error.message}`);
    }
  }

  /**
   * Obtener un empleado por ID con sus relaciones activas
   * @param {string} id - ID del empleado
   * @returns {Promise<Object|null>} Empleado
   */
  async findById(id) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          documents: true,
          skills: true,
          workHistory: {
            orderBy: { startDate: 'desc' },
          },
          contracts: {
            where: { status: 'Active' },
            take: 1,
          },
        },
      });

      if (!employee) return null;

      return {
        ...employee,
        salary: decryptSalary(employee.salary),
        bankName: employee.bankName ? safeDecrypt(employee.bankName) : null,
        accountNumber: employee.accountNumber ? safeDecrypt(employee.accountNumber) : null,
        workLatitude: decryptCoordinate(employee.workLatitude),
        workLongitude: decryptCoordinate(employee.workLongitude),
      };
    } catch (error) {
      throw new Error(`Error al obtener empleado: ${error.message}`);
    }
  }

  /**
   * Obtener todos los empleados con paginación y filtros
   * @param {Object} options - Opciones de paginación y búsqueda
   * @returns {Promise<Array>} Lista de empleados
   */
  async findAll(options = {}) {
    try {
      const { skip = 0, take = 10, q, tenantId } = options;
      const where = {};

      if (tenantId) where.tenantId = tenantId;

      if (q) {
        where.OR = [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { identityCard: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
        ];
      }

      return await prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: true,
          position: true,
          role: true,
          identityCard: true,
          isActive: true,
          birthDate: true,
          hireDate: true,
          phone: true,
          address: true,
          documents: { select: { id: true, type: true } },
          contractType: true,
          civilStatus: true,
        },
      });
    } catch (error) {
      throw new Error(`Error al obtener empleados: ${error.message}`);
    }
  }

  /**
   * Contar empleados según filtros
   * @param {Object} options
   * @returns {Promise<number>}
   */
  async countAll(options = {}) {
    try {
      const { q, tenantId } = options;
      const where = {};
      if (tenantId) where.tenantId = tenantId;
      if (q) {
        where.OR = [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { identityCard: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
        ];
      }
      return await prisma.employee.count({ where });
    } catch (error) {
      throw new Error(`Error al contar empleados: ${error.message}`);
    }
  }

  /**
   * Obtener límites del plan de la empresa (Tenant)
   * @param {string} tenantId
   * @returns {Promise<Object|null>}
   */
  async getTenantPlanLimits(tenantId) {
    return await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxEmployees: true, name: true, plan: true },
    });
  }

  /**
   * Contar empleados activos por tenant
   * @param {string} tenantId
   * @returns {Promise<number>}
   */
  async countActiveByTenant(tenantId) {
    return await prisma.employee.count({
      where: { tenantId, isActive: true },
    });
  }

  /**
   * Buscar empleado por email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    try {
      const employee = await prisma.employee.findFirst({
        where: { email },
      });

      if (!employee) return null;

      return {
        ...employee,
        salary: decryptSalary(employee.salary),
      };
    } catch (error) {
      throw new Error(`Error al buscar empleado: ${error.message}`);
    }
  }

  /**
   * Buscar empleado por cédula
   * @param {string} identityCard
   * @returns {Promise<Object|null>}
   */
  async findByIdentityCard(identityCard) {
    try {
      const employee = await prisma.employee.findFirst({
        where: { identityCard },
      });

      if (!employee) return null;

      return {
        ...employee,
        salary: decryptSalary(employee.salary),
      };
    } catch (error) {
      throw new Error(`Error al buscar empleado por cédula: ${error.message}`);
    }
  }

  /**
   * Buscar empleado para marcación de asistencia con sus atributos de geocerca y consentimiento
   * @param {string} identifier - UUID, CUID o Cédula
   * @returns {Promise<Object|null>}
   */
  async findEmployeeForAttendance(identifier) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cuidRegex = /^c[a-z0-9]{20,}$/i;
    const isId = uuidRegex.test(identifier) || cuidRegex.test(identifier);

    return await prisma.employee.findUnique({
      where: isId ? { id: identifier } : { identityCard: identifier },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        identityCard: true,
        workLatitude: true,
        workLongitude: true,
        geofenceRadius: true,
        enforceGeofence: true,
        trackingConsent: true,
        trackingConsentDate: true,
        position: true,
        department: true,
        tenantId: true,
        biometricCredentials: { select: { id: true } },
      },
    });
  }

  /**
   * Buscar empleados por departamento
   * @param {string} department
   * @returns {Promise<Array>}
   */
  async findByDepartment(department) {
    try {
      const employees = await prisma.employee.findMany({
        where: { department },
        orderBy: { lastName: 'asc' },
      });

      return employees.map((employee) => ({
        ...employee,
        salary: decryptSalary(employee.salary),
      }));
    } catch (error) {
      throw new Error(`Error al buscar empleados por departamento: ${error.message}`);
    }
  }

  /**
   * Actualizar empleado y su contrato activo transaccionalmente
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    try {
      const { salary, hasNightSurcharge, hasDoubleOvertime, ...rest } = data;
      const updateData = { ...rest };

      if (salary !== undefined) {
        updateData.salary = encryptSalary(salary);
      }
      if (updateData.workLatitude !== undefined) {
        updateData.workLatitude = encryptCoordinate(updateData.workLatitude);
      }
      if (updateData.workLongitude !== undefined) {
        updateData.workLongitude = encryptCoordinate(updateData.workLongitude);
      }
      if (updateData.bankName) {
        updateData.bankName = encrypt(updateData.bankName);
      }
      if (updateData.accountNumber) {
        updateData.accountNumber = encrypt(updateData.accountNumber);
      }

      const result = await prisma.$transaction(async (tx) => {
        const employee = await tx.employee.update({
          where: { id },
          data: updateData,
        });

        if (
          hasNightSurcharge !== undefined ||
          hasDoubleOvertime !== undefined ||
          salary !== undefined
        ) {
          const activeContract = await tx.contract.findFirst({
            where: { employeeId: id, status: 'Active' },
            orderBy: { createdAt: 'desc' },
          });

          if (activeContract) {
            const contractUpdate = {};
            if (hasNightSurcharge !== undefined)
              contractUpdate.hasNightSurcharge = hasNightSurcharge;
            if (hasDoubleOvertime !== undefined)
              contractUpdate.hasDoubleOvertime = hasDoubleOvertime;
            if (salary !== undefined) contractUpdate.salary = Number(salary);

            await tx.contract.update({
              where: { id: activeContract.id },
              data: contractUpdate,
            });
          }
        }

        return employee;
      });

      return {
        ...result,
        salary: decryptSalary(result.salary),
        bankName: result.bankName ? safeDecrypt(result.bankName) : null,
        accountNumber: result.accountNumber ? safeDecrypt(result.accountNumber) : null,
        workLatitude: decryptCoordinate(result.workLatitude),
        workLongitude: decryptCoordinate(result.workLongitude),
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Empleado no encontrado');
      }
      throw new Error(`Error al actualizar empleado: ${error.message}`);
    }
  }

  /**
   * Eliminar empleado
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async delete(id) {
    try {
      const employee = await prisma.employee.delete({
        where: { id },
      });

      return {
        ...employee,
        salary: decryptSalary(employee.salary),
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Empleado no encontrado');
      }
      throw new Error(`Error al eliminar empleado: ${error.message}`);
    }
  }

  /**
   * Estadísticas salariales agregadas
   * @param {string|null} tenantId
   * @returns {Promise<Object>}
   */
  async getSalaryStats(tenantId = null) {
    try {
      const where = { isActive: true };
      if (tenantId) where.tenantId = tenantId;

      const employees = await prisma.employee.findMany({
        where,
        select: { salary: true },
      });

      if (employees.length === 0) {
        return { total: 0, sum: 0, average: 0, min: 0, max: 0 };
      }

      const decryptedSalaries = employees.map((emp) => decryptSalary(emp.salary));
      const total = decryptedSalaries.reduce((sum, sal) => sum + sal, 0);
      const average = total / decryptedSalaries.length;
      const min = Math.min(...decryptedSalaries);
      const max = Math.max(...decryptedSalaries);

      return {
        total: employees.length,
        sum: total,
        average: parseFloat(average.toFixed(2)),
        min,
        max,
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Lista de departamentos únicos
   * @returns {Promise<Array<string>>}
   */
  async getUniqueDepartments() {
    try {
      const departments = await prisma.employee.findMany({
        distinct: ['department'],
        select: { department: true },
        where: { isActive: true },
      });
      return departments.map((d) => d.department);
    } catch (error) {
      throw new Error(`Error al obtener departamentos: ${error.message}`);
    }
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}

export default new EmployeeRepository();
