import employeeService from '../../services/employees/employeeService.js';
import bcrypt from 'bcryptjs';
import { isSuperAdminRole } from '../../config/roles.js';
import prisma from '../../database/db.js';

/**
 * EmployeeController
 * Maneja las solicitudes HTTP para empleados
 */
export class EmployeeController {
  /**
   * POST /employees
   * Crear un nuevo empleado
   */
  async create(req, res) {
    try {
      const {
        firstName, lastName, email, department, position, salary, password, role,
        identityCard, birthDate, address, phone, hireDate, contractType, civilStatus,
        bankName, accountNumber, accountType,
        hasNightSurcharge,
        hasDoubleOvertime
      } = req.body;

      if (!password || password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña es obligatoria y debe tener al menos 8 caracteres',
        });
      }

      // Validación de edad al ingreso (18 años)
      if (birthDate && hireDate) {
        const hire = new Date(hireDate);
        const birth = new Date(birthDate);
        let ageAtHire = hire.getFullYear() - birth.getFullYear();
        const m = hire.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && hire.getDate() < birth.getDate())) {
          ageAtHire--;
        }

        if (ageAtHire < 18) {
          return res.status(400).json({
            success: false,
            message: `El empleado debe haber tenido al menos 18 años a su fecha de ingreso (${hire.toLocaleDateString()}).`,
          });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const tenantId = req.tenantId || req.user?.tenantId;

      const employee = await employeeService.createEmployee({
        tenantId,
        firstName,
        lastName,
        email,
        department,
        position,
        salary,
        password: hashedPassword,
        role: role || 'employee',
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
        hasDoubleOvertime
      });

      res.status(201).json({
        success: true,
        message: 'Empleado creado exitosamente',
        data: employee,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear empleado',
      });
    }
  }

  /**
   * GET /employees
   * Obtener todos los empleados (con paginación)
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, q } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const tenantId = req.tenantId || req.user?.tenantId;

      const [employees, total] = await Promise.all([
        employeeService.getAllEmployees({
          skip,
          take: parseInt(limit),
          q,
          tenantId,
        }),
        employeeService.countEmployees({ q, tenantId })
      ]);

      res.status(200).json({
        success: true,
        message: 'Empleados obtenidos exitosamente',
        data: employees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener empleados',
      });
    }
  }

  /**
   * GET /employees/:id
   * Obtener un empleado por ID
   */
  async getById(req, res) {
    try {
      const { id: rawId } = req.params;
      const id = rawId?.trim();
      const tenantId = req.tenantId || req.user?.tenantId;

      if (!id) {
        return res.status(400).json({ success: false, message: 'ID de empleado es requerido' });
      }

      const userRole = (req.user?.role || '').toLowerCase();
      const currentUserId = req.user?.employeeId || req.user?.id;

      if (userRole === 'employee' && currentUserId !== id) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado: Solo puedes consultar tu propia información de empleado.',
          code: 'FORBIDDEN_SELF_ONLY'
        });
      }

      const employee = await employeeService.getEmployee(id, tenantId);

      res.status(200).json({
        success: true,
        message: 'Empleado obtenido exitosamente',
        data: employee,
      });
    } catch (error) {
      const statusCode = error.message === 'Empleado no encontrado' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al obtener empleado',
      });
    }
  }

  /**
   * GET /employees/department/:department
   * Obtener empleados por departamento
   */
  async getByDepartment(req, res) {
    try {
      const { department } = req.params;

      const employees = await employeeService.getEmployeesByDepartment(department);

      res.status(200).json({
        success: true,
        message: `Empleados del departamento ${department} obtenidos`,
        data: employees,
        total: employees.length,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener empleados por departamento',
      });
    }
  }

  /**
   * PUT /employees/:id
   * Actualizar un empleado
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      const userRole = (req.user?.role || '').toLowerCase();
      const currentUserId = req.user?.employeeId || req.user?.id;
      const isAdminOrHr = ['admin', 'hr', 'superadmin'].includes(userRole);

      // Si es un colaborador regular, validar que solo edite su propio perfil
      if (!isAdminOrHr) {
        if (currentUserId !== id) {
          return res.status(403).json({
            success: false,
            message: 'Acceso denegado: Solo puedes actualizar tu propio perfil.',
            code: 'FORBIDDEN_SELF_ONLY'
          });
        }
        // Proteger campos sensibles frente a modificaciones no autorizadas
        delete updateData.salary;
        delete updateData.role;
        delete updateData.department;
        delete updateData.position;
        delete updateData.hireDate;
        delete updateData.contractType;
        delete updateData.isActive;
        delete updateData.exitDate;
        delete updateData.exitReason;
      }

      const userId = req.user?.id;

      // Validar longitud de contraseña si se está actualizando
      if (updateData.password) {
        if (updateData.password.length < 8) {
          return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 8 caracteres',
          });
        }
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const employee = await employeeService.updateEmployee(id, updateData, userId);

      res.status(200).json({
        success: true,
        message: 'Empleado actualizado exitosamente',
        data: employee,
      });
    } catch (error) {
      const statusCode = error.message === 'Empleado no encontrado' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al actualizar empleado',
      });
    }
  }

  /**
   * DELETE /employees/:id
   * Eliminar un empleado
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const employee = await employeeService.deleteEmployee(id);

      res.status(200).json({
        success: true,
        message: 'Empleado eliminado exitosamente',
        data: employee,
      });
    } catch (error) {
      const statusCode = error.message === 'Empleado no encontrado' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al eliminar empleado',
      });
    }
  }

  /**
   * GET /employees/stats/salary
   * Obtener estadísticas de salarios
   */
  async getSalaryStats(req, res) {
    try {
      const stats = await employeeService.getSalaryStatistics();

      res.status(200).json({
        success: true,
        message: 'Estadísticas de salarios obtenidas',
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas',
      });
    }
  }

  /**
   * GET /employees/:id/history
   * Obtener historial de cambios
   */
  async getHistory(req, res) {
    try {
      const { id } = req.params;
      const userRole = (req.user?.role || '').toLowerCase();
      const currentUserId = req.user?.employeeId || req.user?.id;

      if (userRole === 'employee' && currentUserId !== id) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado: Solo puedes consultar tu propio historial.',
          code: 'FORBIDDEN_SELF_ONLY'
        });
      }

      const history = await employeeService.getEmployeeHistory(id);

      res.status(200).json({
        success: true,
        message: 'Historial obtenido exitosamente',
        data: history,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener historial',
      });
    }
  }

  /**
   * GET /employees/profile
   * Obtener perfil del usuario autenticado
   */
  async getProfile(req, res) {
    try {
      const isSuperAdmin = isSuperAdminRole(req.user?.role);
      if (isSuperAdmin) {
        return res.status(200).json({
          success: true,
          data: null,
          isSuperAdmin: true,
          message: 'Cuenta de SuperAdministrador SaaS Activa'
        });
      }
      const id = req.user?.employeeId || req.user?.id;
      const tenantId = req.tenantId || req.user?.tenantId;
      const employee = await employeeService.getEmployee(id, tenantId, req.user);
      res.status(200).json({ success: true, data: employee });
    } catch (error) {
      console.error('[EmployeeController] Profile Error:', error);
      res.status(500).json({ success: false, message: 'Error al obtener perfil: ' + error.message });
    }
  }


  /**
   * POST /employees/:id/terminate
   * Dar de baja a un empleado
   */
  async terminate(req, res) {
    try {
      const { id } = req.params;
      const { exitDate, exitReason, exitType } = req.body;

      const result = await employeeService.updateEmployee(id, {
        isActive: false,
        exitDate: new Date(exitDate),
        exitReason,
        exitType
      }, req.user?.id);

      res.status(200).json({
        success: true,
        message: 'Empleado dado de baja exitosamente',
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al dar de baja empleado',
      });
    }
  }

  /**
   * GET /employees/departments
   * Obtener todos los departamentos únicos
   */
  async getDepartments(req, res) {
    try {
      const departments = await employeeService.getDepartments();
      res.status(200).json({
        success: true,
        data: departments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener departamentos',
      });
    }
  }

  /**
   * POST /employees/consent
   * Actualizar consentimiento de rastreo
   */
  async updateConsent(req, res) {
    try {
      const isSuperAdmin = isSuperAdminRole(req.user?.role);
      const id = req.user?.employeeId || req.user?.id;
      const { consent } = req.body;

      if (!id || isSuperAdmin) {
        return res.status(200).json({
          success: true,
          message: 'Consentimiento registrado',
          data: {
            trackingConsent: !!consent,
            trackingConsentDate: new Date()
          }
        });
      }

      // Buscar si el empleado existe en la base de datos
      const employeeExists = await prisma.employee.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!employeeExists) {
        return res.status(200).json({
          success: true,
          message: 'Consentimiento registrado',
          data: {
            trackingConsent: !!consent,
            trackingConsentDate: new Date()
          }
        });
      }

      const employee = await employeeService.updateEmployee(id, {
        trackingConsent: !!consent,
        trackingConsentDate: new Date()
      }, id);

      res.status(200).json({
        success: true,
        message: 'Consentimiento actualizado',
        data: {
          trackingConsent: employee.trackingConsent,
          trackingConsentDate: employee.trackingConsentDate
        }
      });
    } catch (error) {
      console.error('[EmployeeController] updateConsent error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar consentimiento'
      });
    }
  }
}

export default new EmployeeController();
