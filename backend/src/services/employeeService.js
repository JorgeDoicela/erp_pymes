import employeeRepository from '../repositories/employeeRepository.js';

/**
 * EmployeeService
 * Contiene la lógica de negocio para gestión de empleados
 */
export class EmployeeService {
  /**
   * Crear un nuevo empleado con validaciones
   * @param {Object} employeeData - Datos del empleado
   * @returns {Promise<Object>} Empleado creado
   */
  async createEmployee(employeeData) {
    // Validaciones
    this.validateEmployeeData(employeeData);

    // Verificar que el email sea único
    const existingEmployee = await employeeRepository.findByEmail(employeeData.email);
    if (existingEmployee) {
      throw new Error('El email ya está registrado');
    }

    return await employeeRepository.create(employeeData);
  }

  /**
   * Obtener un empleado por ID
   * @param {string} id - ID del empleado
   * @returns {Promise<Object>} Empleado
   */
  async getEmployee(id) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new Error('Empleado no encontrado');
    }
    return employee;
  }

  /**
   * Obtener todos los empleados
   * @param {Object} options - Opciones de búsqueda
   * @returns {Promise<Array>} Lista de empleados
   */
  async getAllEmployees(options = {}) {
    return await employeeRepository.findAll(options);
  }

  /**
   * Buscar empleados por departamento
   * @param {string} department - Departamento
   * @returns {Promise<Array>} Lista de empleados
   */
  async getEmployeesByDepartment(department) {
    if (!department || typeof department !== 'string') {
      throw new Error('Departamento inválido');
    }
    return await employeeRepository.findByDepartment(department);
  }

  /**
   * Actualizar un empleado
   * @param {string} id - ID del empleado
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Empleado actualizado
   */
  async updateEmployee(id, updateData) {
    // Validar que el ID sea válido
    if (!id || typeof id !== 'string') {
      throw new Error('ID de empleado inválido');
    }

    // Validar datos a actualizar
    if (Object.keys(updateData).length === 0) {
      throw new Error('No hay datos para actualizar');
    }

    // Si se actualiza el email, verificar que sea único
    if (updateData.email) {
      const employee = await employeeRepository.findByEmail(updateData.email);
      if (employee && employee.id !== id) {
        throw new Error('El email ya está registrado por otro empleado');
      }
    }

    // Validar datos parciales
    this.validateEmployeeData(updateData, true);

    return await employeeRepository.update(id, updateData);
  }

  /**
   * Eliminar un empleado
   * @param {string} id - ID del empleado
   * @returns {Promise<Object>} Empleado eliminado
   */
  async deleteEmployee(id) {
    if (!id || typeof id !== 'string') {
      throw new Error('ID de empleado inválido');
    }
    return await employeeRepository.delete(id);
  }

  /**
   * Obtener estadísticas de salarios
   * @returns {Promise<Object>} Estadísticas
   */
  async getSalaryStatistics() {
    return await employeeRepository.getSalaryStats();
  }

  /**
   * Validar datos de un empleado
   * @param {Object} data - Datos a validar
   * @param {boolean} isPartial - Si es actualización parcial
   * @throws {Error} Si hay validaciones fallidas
   */
  validateEmployeeData(data, isPartial = false) {
    const { firstName, lastName, email, department, position, salary } = data;

    if (!isPartial) {
      // Validaciones para crear
      if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
        throw new Error('Nombre requerido y debe ser texto');
      }
      if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
        throw new Error('Apellido requerido y debe ser texto');
      }
      if (!email || typeof email !== 'string' || !this.isValidEmail(email)) {
        throw new Error('Email inválido');
      }
      if (!department || typeof department !== 'string' || department.trim().length === 0) {
        throw new Error('Departamento requerido');
      }
      if (!position || typeof position !== 'string' || position.trim().length === 0) {
        throw new Error('Puesto requerido');
      }
      if (salary === undefined || typeof salary !== 'number' || salary <= 0) {
        throw new Error('Salario debe ser un número positivo');
      }
    } else {
      // Validaciones parciales para actualizar
      if (firstName !== undefined) {
        if (typeof firstName !== 'string' || firstName.trim().length === 0) {
          throw new Error('Nombre debe ser texto válido');
        }
      }
      if (lastName !== undefined) {
        if (typeof lastName !== 'string' || lastName.trim().length === 0) {
          throw new Error('Apellido debe ser texto válido');
        }
      }
      if (email !== undefined) {
        if (typeof email !== 'string' || !this.isValidEmail(email)) {
          throw new Error('Email inválido');
        }
      }
      if (department !== undefined) {
        if (typeof department !== 'string' || department.trim().length === 0) {
          throw new Error('Departamento debe ser texto válido');
        }
      }
      if (position !== undefined) {
        if (typeof position !== 'string' || position.trim().length === 0) {
          throw new Error('Puesto debe ser texto válido');
        }
      }
      if (salary !== undefined) {
        if (typeof salary !== 'number' || salary <= 0) {
          throw new Error('Salario debe ser un número positivo');
        }
      }
    }
  }

  /**
   * Validar formato de email
   * @param {string} email - Email a validar
   * @returns {boolean} True si es válido
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default new EmployeeService();
