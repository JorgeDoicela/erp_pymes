/**
 * @file employee.controller.js
 * @description Controlador HTTP para el módulo de empleados (Norma ERP).
 * Adaptador de entrada delgado protegido por asyncHandler y Clean Architecture.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import employeeService from './employee.service.js';
import bcrypt from 'bcryptjs';
import { isSuperAdminRole, isTenantRole, TENANT_ROLES } from '../../../config/roles.js';
import { asyncHandler } from '../../../core/utils/asyncHandler.js';
import { ValidationError, ForbiddenError } from '../../../core/errors/appError.js';

export class EmployeeController {
  /**
   * POST /employees
   * Crear un nuevo empleado
   */
  create = asyncHandler(async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      department,
      position,
      salary,
      password,
      role,
      identityCard,
      birthDate,
      address,
      phone,
      hireDate,
      contractType,
      civilStatus,
      bankName,
      accountNumber,
      accountType,
      hasNightSurcharge,
      hasDoubleOvertime,
    } = req.body;

    if (!password || password.length < 8) {
      throw new ValidationError('La contraseña es obligatoria y debe tener al menos 8 caracteres');
    }

    if (birthDate && hireDate) {
      const hire = new Date(hireDate);
      const birth = new Date(birthDate);
      let ageAtHire = hire.getFullYear() - birth.getFullYear();
      const m = hire.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && hire.getDate() < birth.getDate())) {
        ageAtHire--;
      }

      if (ageAtHire < 18) {
        throw new ValidationError(
          `El empleado debe haber tenido al menos 18 años a su fecha de ingreso (${hire.toLocaleDateString()}).`
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const tenantId = req.tenantId || req.user?.tenantId;

    const assignedRole = (role || 'employee').toLowerCase();
    if (!isTenantRole(assignedRole)) {
      throw new ValidationError(
        `Rol inválido para empleado de empresa. Roles permitidos: ${TENANT_ROLES.join(', ')}`
      );
    }

    const employee = await employeeService.createEmployee({
      tenantId,
      firstName,
      lastName,
      email,
      department,
      position,
      salary,
      password: hashedPassword,
      role: assignedRole,
      identityCard,
      birthDate: new Date(birthDate),
      address,
      phone,
      hireDate: new Date(hireDate),
      contractType,
      civilStatus,
      bankName,
      accountNumber,
      accountType,
      hasNightSurcharge,
      hasDoubleOvertime,
    });

    res.status(201).json({
      success: true,
      message: 'Empleado creado exitosamente',
      data: employee,
    });
  });

  /**
   * GET /employees
   * Obtener todos los empleados (con paginación)
   */
  getAll = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, q } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const tenantId = req.tenantId || req.user?.tenantId;

    const [employees, total] = await Promise.all([
      employeeService.getAllEmployees({
        skip,
        take: parseInt(limit, 10),
        q,
        tenantId,
      }),
      employeeService.countEmployees({ q, tenantId }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Empleados obtenidos exitosamente',
      data: employees,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
      },
    });
  });

  /**
   * GET /employees/:id
   * Obtener un empleado por ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id: rawId } = req.params;
    const id = rawId?.trim();
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!id) {
      throw new ValidationError('ID de empleado es requerido');
    }

    const userRole = (req.user?.role || '').toLowerCase();
    const currentUserId = req.user?.employeeId || req.user?.id;

    if (userRole === 'employee' && currentUserId !== id) {
      throw new ForbiddenError(
        'Acceso denegado: Solo puedes consultar tu propia información de empleado.'
      );
    }

    const employee = await employeeService.getEmployee(id, tenantId);

    res.status(200).json({
      success: true,
      message: 'Empleado obtenido exitosamente',
      data: employee,
    });
  });

  /**
   * GET /employees/department/:department
   * Obtener empleados por departamento
   */
  getByDepartment = asyncHandler(async (req, res) => {
    const { department } = req.params;
    const employees = await employeeService.getEmployeesByDepartment(department);

    res.status(200).json({
      success: true,
      message: `Empleados del departamento ${department} obtenidos`,
      data: employees,
      total: employees.length,
    });
  });

  /**
   * PUT /employees/:id
   * Actualizar un empleado
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    const userRole = (req.user?.role || '').toLowerCase();
    const currentUserId = req.user?.employeeId || req.user?.id;
    const isAdminOrHr = ['admin', 'hr', 'superadmin'].includes(userRole);

    if (!isAdminOrHr) {
      if (currentUserId !== id) {
        throw new ForbiddenError('Acceso denegado: Solo puedes actualizar tu propio perfil.');
      }
      delete updateData.salary;
      delete updateData.role;
      delete updateData.department;
      delete updateData.position;
      delete updateData.hireDate;
      delete updateData.contractType;
      delete updateData.isActive;
      delete updateData.exitDate;
      delete updateData.exitReason;
    } else if (updateData.role) {
      const assignedRole = updateData.role.toLowerCase();
      if (!isTenantRole(assignedRole)) {
        throw new ValidationError(
          `Rol inválido para empleado de empresa. Roles permitidos: ${TENANT_ROLES.join(', ')}`
        );
      }
      updateData.role = assignedRole;
    }

    const userId = req.user?.id;

    if (updateData.password) {
      if (updateData.password.length < 8) {
        throw new ValidationError('La contraseña debe tener al menos 8 caracteres');
      }
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const employee = await employeeService.updateEmployee(id, updateData, userId);

    res.status(200).json({
      success: true,
      message: 'Empleado actualizado exitosamente',
      data: employee,
    });
  });

  /**
   * DELETE /employees/:id
   * Eliminar un empleado
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employee = await employeeService.deleteEmployee(id);

    res.status(200).json({
      success: true,
      message: 'Empleado eliminado exitosamente',
      data: employee,
    });
  });

  /**
   * GET /employees/stats/salary
   * Obtener estadísticas salariales
   */
  getSalaryStats = asyncHandler(async (req, res) => {
    const stats = await employeeService.getSalaryStatistics();

    res.status(200).json({
      success: true,
      message: 'Estadísticas de salarios obtenidas',
      data: stats,
    });
  });

  /**
   * GET /employees/:id/history
   * Obtener historial de cambios
   */
  getHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userRole = (req.user?.role || '').toLowerCase();
    const currentUserId = req.user?.employeeId || req.user?.id;

    if (userRole === 'employee' && currentUserId !== id) {
      throw new ForbiddenError('Acceso denegado: Solo puedes consultar tu propio historial.');
    }

    const history = await employeeService.getEmployeeHistory(id);

    res.status(200).json({
      success: true,
      message: 'Historial obtenido exitosamente',
      data: history,
    });
  });

  /**
   * GET /employees/profile
   * Obtener perfil del usuario autenticado
   */
  getProfile = asyncHandler(async (req, res) => {
    const isSuperAdmin = isSuperAdminRole(req.user?.role);
    if (isSuperAdmin) {
      return res.status(200).json({
        success: true,
        data: null,
        isSuperAdmin: true,
        message: 'Cuenta de SuperAdministrador SaaS Activa',
      });
    }

    const id = req.user?.employeeId || req.user?.id;
    const tenantId = req.tenantId || req.user?.tenantId;
    const employee = await employeeService.getEmployee(id, tenantId, req.user);

    res.status(200).json({ success: true, data: employee });
  });

  /**
   * POST /employees/:id/terminate
   * Dar de baja a un empleado
   */
  terminate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { exitDate, exitReason, exitType } = req.body;

    const result = await employeeService.updateEmployee(
      id,
      {
        isActive: false,
        exitDate: new Date(exitDate),
        exitReason,
        exitType,
      },
      req.user?.id
    );

    res.status(200).json({
      success: true,
      message: 'Empleado dado de baja exitosamente',
      data: result,
    });
  });

  /**
   * GET /employees/departments
   * Obtener todos los departamentos únicos
   */
  getDepartments = asyncHandler(async (req, res) => {
    const departments = await employeeService.getDepartments();
    res.status(200).json({
      success: true,
      data: departments,
    });
  });

  /**
   * POST /employees/consent
   * Actualizar consentimiento de rastreo
   */
  updateConsent = asyncHandler(async (req, res) => {
    const isSuperAdmin = isSuperAdminRole(req.user?.role);
    const id = req.user?.employeeId || req.user?.id;
    const { consent } = req.body;

    if (!id || isSuperAdmin) {
      return res.status(200).json({
        success: true,
        message: 'Consentimiento registrado',
        data: {
          trackingConsent: !!consent,
          trackingConsentDate: new Date(),
        },
      });
    }

    const result = await employeeService.updateConsent(id, consent, req.user);

    res.status(200).json({
      success: true,
      message: 'Consentimiento actualizado',
      data: result,
    });
  });
}

export default new EmployeeController();
