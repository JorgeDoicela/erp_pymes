import employeeService from '../../services/employees/employeeService.js';
import bcrypt from 'bcryptjs';

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

      const hashedPassword = await bcrypt.hash(password || 'defaultPassword123', 10);

      const employee = await employeeService.createEmployee({
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

      const employees = await employeeService.getAllEmployees({
        skip,
        take: parseInt(limit),
        q,
      });

      res.status(200).json({
        success: true,
        message: 'Empleados obtenidos exitosamente',
        data: employees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: employees.length,
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
      const { id } = req.params;

      const employee = await employeeService.getEmployee(id);

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
      const updateData = req.body;
      const userId = req.user?.id;

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
   * GET /employees/me/profile
   * Obtener perfil del usuario autenticado
   */
  async getProfile(req, res) {
    try {
      const id = req.user.id;
      const employee = await employeeService.getEmployee(id);
      res.status(200).json({ success: true, data: employee });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener perfil' });
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
}

export default new EmployeeController();
