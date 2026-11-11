/**
 * @file employee.service.js
 * @description Servicio de aplicación y dominio para la gestión de empleados (Norma ERP).
 * Orquesta reglas de negocio, validaciones legales ecuatorianas y trazabilidad de auditoría.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import defaultEmployeeRepo from './employee.repository.js';
import { auditRepository } from '../../audit/index.js';
import prisma from '../../../database/db.js';
import { NotFoundError, ValidationError, ConflictError } from '../../../core/errors/appError.js';

const VALID_CIVIL_STATUSES = ['Soltero', 'Casado', 'Divorciado', 'Viudo', 'Union Libre'];
const VALID_CONTRACT_TYPES = ['Indefinido', 'Temporal', 'Por Obra', 'Prácticas'];

export class EmployeeService {
  /**
   * @param {Object} [deps] - Inyección de dependencias
   * @param {Object} [deps.employeeRepo] - Repositorio de empleados
   * @param {Object} [deps.auditRepo] - Repositorio de auditoría
   * @param {Object} [deps.db] - Cliente de base de datos (fallback de integración)
   */
  constructor({
    employeeRepo = defaultEmployeeRepo,
    auditRepo = auditRepository,
    db = prisma,
  } = {}) {
    this.employeeRepository = employeeRepo;
    this.auditRepository = auditRepo;
    this.prisma = db;
  }

  /**
   * Crear un nuevo empleado con validaciones de negocio
   * @param {Object} employeeData - Datos del empleado
   * @returns {Promise<Object>} Empleado creado
   */
  async createEmployee(employeeData) {
    this.validateEmployeeData(employeeData);

    // Verificar límite de empleados según Plan del Tenant
    if (employeeData.tenantId) {
      let tenant = null;
      if (typeof this.employeeRepository.getTenantPlanLimits === 'function') {
        tenant = await this.employeeRepository.getTenantPlanLimits(employeeData.tenantId);
      }
      if (!tenant && this.prisma?.tenant?.findUnique) {
        tenant = await this.prisma.tenant.findUnique({
          where: { id: employeeData.tenantId },
          select: { maxEmployees: true, name: true, plan: true },
        });
      }

      if (tenant) {
        let currentCount = 0;
        if (typeof this.employeeRepository.countActiveByTenant === 'function') {
          currentCount = await this.employeeRepository.countActiveByTenant(employeeData.tenantId);
        } else if (this.prisma?.employee?.count) {
          currentCount = await this.prisma.employee.count({
            where: { tenantId: employeeData.tenantId, isActive: true },
          });
        }

        if (currentCount >= tenant.maxEmployees) {
          throw new ValidationError(
            `Has alcanzado el límite máximo de empleados activos (${tenant.maxEmployees}) para el plan ${tenant.plan} de '${tenant.name}'. Contacta con administración para ampliar tu plan.`
          );
        }
      }
    }

    // Verificar que el email sea único
    const existingEmployee = await this.employeeRepository.findByEmail(employeeData.email);
    if (existingEmployee) {
      throw new ConflictError('El email ya está registrado');
    }

    // Verificar que la cédula sea única
    const existingIdentityCard = await this.employeeRepository.findByIdentityCard(
      employeeData.identityCard
    );
    if (existingIdentityCard) {
      throw new ConflictError('La cédula ya está registrada');
    }

    const employee = await this.employeeRepository.create(employeeData);

    // Auditoría asíncrona no bloqueante
    this.auditRepository
      .createLog({
        entity: 'Employee',
        entityId: employee.id,
        action: 'CREATE',
        performedBy: 'System',
        details: {
          firstName: employee.firstName,
          lastName: employee.lastName,
          department: employee.department,
        },
      })
      .catch((err) => console.error('Error logging employee creation:', err));

    return employee;
  }

  /**
   * Obtener un empleado por ID
   * @param {string} id - ID del empleado
   * @param {string|null} tenantId - ID del tenant (opcional)
   * @param {Object|null} user - Objeto de usuario autenticado
   * @returns {Promise<Object>} Empleado
   */
  async getEmployee(id, tenantId = null, user = null) {
    let employee = await this.employeeRepository.findById(id);

    if (!employee && user?.email) {
      employee = await this.employeeRepository.findByEmail(user.email);
    }

    if (!employee && user) {
      return {
        id: user.id || 'system-admin',
        firstName: user.firstName || user.name || 'Usuario',
        lastName: user.lastName || 'Administrador',
        email: user.email || 'admin@normaerp.com',
        department: 'Administración',
        position: user.role || 'Administrador',
        role: user.role || 'admin',
        identityCard: 'N/A',
        phone: 'N/A',
        address: 'N/A',
        isActive: true,
        contracts: [],
        documents: [],
        skills: [],
        workHistory: [],
      };
    }

    if (!employee) {
      throw new NotFoundError('Empleado no encontrado');
    }

    if (tenantId && employee.tenantId && employee.tenantId !== tenantId) {
      throw new NotFoundError('Empleado no encontrado');
    }

    return employee;
  }

  /**
   * Obtener todos los empleados con opciones de paginación
   * @param {Object} options
   * @returns {Promise<Array>}
   */
  async getAllEmployees(options = {}) {
    return await this.employeeRepository.findAll(options);
  }

  /**
   * Contar total de empleados según criterios
   * @param {Object} options
   * @returns {Promise<number>}
   */
  async countEmployees(options = {}) {
    return await this.employeeRepository.countAll(options);
  }

  /**
   * Buscar empleados por departamento
   * @param {string} department
   * @returns {Promise<Array>}
   */
  async getEmployeesByDepartment(department) {
    if (!department || typeof department !== 'string') {
      throw new ValidationError('Departamento inválido');
    }
    return await this.employeeRepository.findByDepartment(department);
  }

  /**
   * Actualizar un empleado con registro de cambios
   * @param {string} id - ID del empleado
   * @param {Object} updateData - Datos a actualizar
   * @param {string} userId - ID del usuario que ejecuta la acción
   * @returns {Promise<Object>} Empleado actualizado
   */
  async updateEmployee(id, updateData, userId) {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('ID de empleado inválido');
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No hay datos para actualizar');
    }

    // Inmutabilidad de la cédula de identidad
    if (updateData.identityCard) {
      delete updateData.identityCard;
    }

    // Si se actualiza el email, verificar que sea único
    if (updateData.email) {
      const employee = await this.employeeRepository.findByEmail(updateData.email);
      if (employee && employee.id !== id) {
        throw new ConflictError('El email ya está registrado por otro empleado');
      }
    }

    this.validateEmployeeData(updateData, true);

    const oldData = await this.getEmployee(id);
    const updatedEmployee = await this.employeeRepository.update(id, updateData);

    const changes = {};
    Object.keys(updateData).forEach((key) => {
      if (JSON.stringify(updateData[key]) !== JSON.stringify(oldData[key])) {
        changes[key] = { from: oldData[key], to: updateData[key] };
      }
    });

    if (userId && Object.keys(changes).length > 0) {
      this.auditRepository
        .createLog({
          entity: 'Employee',
          entityId: id,
          action: 'UPDATE',
          performedBy: userId,
          details: changes,
        })
        .catch((err) => console.error('Error logging employee update:', err));
    }

    return updatedEmployee;
  }

  /**
   * Actualizar o registrar consentimiento de rastreo/geolocalización
   * @param {string} id - ID del empleado o usuario
   * @param {boolean} consent - Valor del consentimiento
   * @param {Object|null} user - Usuario autenticado
   * @returns {Promise<Object>} Resultado del consentimiento
   */
  async updateConsent(id, consent, user = null) {
    if (!id) {
      return {
        trackingConsent: !!consent,
        trackingConsentDate: new Date(),
      };
    }

    const employeeExists = await this.employeeRepository.findById(id);
    if (!employeeExists) {
      return {
        trackingConsent: !!consent,
        trackingConsentDate: new Date(),
      };
    }

    const employee = await this.updateEmployee(
      id,
      {
        trackingConsent: !!consent,
        trackingConsentDate: new Date(),
      },
      id
    );

    return {
      trackingConsent: employee.trackingConsent,
      trackingConsentDate: employee.trackingConsentDate,
    };
  }

  /**
   * Eliminar un empleado
   * @param {string} id
   * @returns {Promise<Object>} Empleado eliminado
   */
  async deleteEmployee(id) {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('ID de empleado inválido');
    }
    const deleted = await this.employeeRepository.delete(id);

    this.auditRepository
      .createLog({
        entity: 'Employee',
        entityId: id,
        action: 'DELETE',
        performedBy: 'Admin',
        details: `Deleted employee ${id}`,
      })
      .catch((err) => console.error('Error logging employee deletion:', err));

    return deleted;
  }

  /**
   * Obtener estadísticas de salarios
   * @returns {Promise<Object>}
   */
  async getSalaryStatistics() {
    return await this.employeeRepository.getSalaryStats();
  }

  /**
   * Validar reglas de negocio para los datos del empleado
   * @param {Object} data
   * @param {boolean} isPartial
   */
  validateEmployeeData(data, isPartial = false) {
    const { firstName, lastName, email, department, position, salary } = data;

    if (!isPartial) {
      if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0)
        throw new ValidationError('Nombre requerido y debe ser texto');
      if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0)
        throw new ValidationError('Apellido requerido y debe ser texto');
      if (!email || typeof email !== 'string' || !this.isValidEmail(email))
        throw new ValidationError('Email inválido');

      if (!data.birthDate) throw new ValidationError('Fecha de nacimiento requerida');
      if (!data.hireDate) throw new ValidationError('Fecha de ingreso requerida');

      const birthDate = new Date(data.birthDate);
      const hireDate = new Date(data.hireDate);
      const today = new Date();

      if (birthDate > today)
        throw new ValidationError('La fecha de nacimiento no puede ser futura');
      if (hireDate <= birthDate)
        throw new ValidationError(
          'La fecha de ingreso debe ser posterior a la fecha de nacimiento'
        );
      if (hireDate > today) throw new ValidationError('La fecha de ingreso no puede ser futura');

      const ageAtHire = this.calculateAge(birthDate, hireDate);
      const ageToday = this.calculateAge(birthDate, today);

      if (ageAtHire < 18) {
        throw new ValidationError(
          `El empleado debe haber tenido al menos 18 años al momento de su contratación. Edad a esa fecha: ${ageAtHire} años.`
        );
      }

      if (ageToday < 18) {
        throw new ValidationError(
          `El empleado debe ser mayor de edad hoy. Edad actual: ${ageToday} años.`
        );
      }

      if (ageToday > 65) {
        throw new ValidationError(
          `El empleado supera la edad máxima de contratación (65 años). Edad actual: ${ageToday} años.`
        );
      }

      if (!data.identityCard || !/^\d{10,}$/.test(data.identityCard)) {
        throw new ValidationError('Cédula requerida y debe tener al menos 10 dígitos numéricos');
      }

      if (!department || typeof department !== 'string' || department.trim().length === 0)
        throw new ValidationError('Departamento requerido');
      if (!position || typeof position !== 'string' || position.trim().length === 0)
        throw new ValidationError('Puesto requerido');

      if (salary === undefined || typeof salary !== 'number' || salary <= 0)
        throw new ValidationError('Salario debe ser un número positivo');

      if (salary < 450) {
        throw new ValidationError(
          'El salario no puede ser inferior al salario básico unificado ($450)'
        );
      }

      if (!data.address || typeof data.address !== 'string' || data.address.trim().length < 10)
        throw new ValidationError('La dirección debe ser detallada (mínimo 10 caracteres)');
      if (!data.phone || !/^\d{10}$/.test(data.phone))
        throw new ValidationError('El teléfono debe tener exactamente 10 dígitos numéricos');

      if (!data.contractType || !VALID_CONTRACT_TYPES.includes(data.contractType))
        throw new ValidationError(
          `Tipo de contrato inválido. Valores permitidos: ${VALID_CONTRACT_TYPES.join(', ')}`
        );
      if (!data.civilStatus || !VALID_CIVIL_STATUSES.includes(data.civilStatus))
        throw new ValidationError(
          `Estado civil inválido. Valores permitidos: ${VALID_CIVIL_STATUSES.join(', ')}`
        );
    } else {
      if (
        firstName !== undefined &&
        (typeof firstName !== 'string' || firstName.trim().length === 0)
      )
        throw new ValidationError('Nombre debe ser texto válido');
      if (lastName !== undefined && (typeof lastName !== 'string' || lastName.trim().length === 0))
        throw new ValidationError('Apellido debe ser texto válido');
      if (email !== undefined && (typeof email !== 'string' || !this.isValidEmail(email)))
        throw new ValidationError('Email inválido');
      if (
        department !== undefined &&
        (typeof department !== 'string' || department.trim().length === 0)
      )
        throw new ValidationError('Departamento debe ser texto válido');
      if (position !== undefined && (typeof position !== 'string' || position.trim().length === 0))
        throw new ValidationError('Puesto debe ser texto válido');

      if (salary !== undefined) {
        if (typeof salary !== 'number' || salary <= 0)
          throw new ValidationError('Salario debe ser un número positivo');
        if (salary < 450)
          throw new ValidationError(
            'El salario no puede ser inferior al salario básico unificado ($450)'
          );
      }

      if (data.hasNightSurcharge !== undefined && typeof data.hasNightSurcharge !== 'boolean')
        throw new ValidationError('Recargo nocturno debe ser booleano');
      if (data.hasDoubleOvertime !== undefined && typeof data.hasDoubleOvertime !== 'boolean')
        throw new ValidationError('Doble horas extras debe ser booleano');
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async getEmployeeHistory(id) {
    return await this.auditRepository.getLogsByEntityId(id);
  }

  calculateAge(birthDate, referenceDate = new Date()) {
    const birth = new Date(birthDate);
    const ref = new Date(referenceDate);
    let age = ref.getFullYear() - birth.getFullYear();
    const monthDiff = ref.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  async getDepartments() {
    return await this.employeeRepository.getUniqueDepartments();
  }
}

export default new EmployeeService();
