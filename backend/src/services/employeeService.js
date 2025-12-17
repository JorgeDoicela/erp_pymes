import employeeRepository from '../repositories/employeeRepository.js';
import auditRepository from '../repositories/auditRepository.js';

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

    // Verificar que la cédula sea única
    const existingIdentityCard = await employeeRepository.findByIdentityCard(employeeData.identityCard);
    if (existingIdentityCard) {
      throw new Error('La cédula ya está registrada');
    }

    // Verificar que la cédula sea única (si repository soporta findByIdentityCard o lo implementamos)
    // Asumiremos que findByIdentityCard no existe aún en el repo, pero podemos usar prisma directamente en el repo o añadirlo.
    // Dado que no puedo ver el repo ahora, voy a asumir que debo añadirlo o usar findUnique si tuviera acceso.
    // Wait, I should check repository first. But I'll modify service assuming repository needs update too if needed.
    // Let's postpone repository call for identityCard uniqueness until I check/update repository.
    // For now, I'll rely on Prisma unique constraint or better, add the check.

    // I will look at Validation first.

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
    // Aquí se podrían añadir más validaciones o lógica de filtrado si fuera necesario
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
   * @param {string} userId - ID del usuario que realiza la acción
   * @returns {Promise<Object>} Empleado actualizado
   */
  async updateEmployee(id, updateData, userId) {
    // Validar que el ID sea válido
    if (!id || typeof id !== 'string') {
      throw new Error('ID de empleado inválido');
    }

    // Validar datos a actualizar
    if (Object.keys(updateData).length === 0) {
      throw new Error('No hay datos para actualizar');
    }

    // IDENTITY CARD IMMUTABILITY CHECK
    if (updateData.identityCard) {
      delete updateData.identityCard; // Silently ignore or throw error?
      // Let's throw to be explicit if the frontend sends it
      // throw new Error('La cédula no se puede modificar');
      // Or safer: just remove it to enforce immutability
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

    // Obtener datos anteriores para el log
    const oldData = await this.getEmployee(id);

    // Realizar actualización
    const updatedEmployee = await employeeRepository.update(id, updateData);

    // Calcular cambios para auditoría
    const changes = {};
    Object.keys(updateData).forEach(key => {
      if (JSON.stringify(updateData[key]) !== JSON.stringify(oldData[key])) {
        // Don't log sensitive salary if not needed, or log encrypted/masked?
        // Requirement says "Cambios de salario registrados en historial"
        changes[key] = { from: oldData[key], to: updateData[key] };
      }
    });

    if (userId && Object.keys(changes).length > 0) {
      await auditRepository.createLog({
        entity: 'Employee',
        entityId: id,
        action: 'UPDATE',
        performedBy: userId,
        details: changes
      });
    }

    return updatedEmployee;
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

      // Nuevos campos
      if (!data.identityCard || typeof data.identityCard !== 'string' || data.identityCard.trim().length === 0) {
        throw new Error('Cédula requerida');
      }
      if (!data.birthDate) {
        throw new Error('Fecha de nacimiento requerida');
      }
      if (!data.address || typeof data.address !== 'string' || data.address.trim().length === 0) {
        throw new Error('Dirección requerida');
      }
      if (!data.phone || typeof data.phone !== 'string' || data.phone.trim().length === 0) {
        throw new Error('Teléfono requerido');
      }
      if (!data.hireDate) {
        throw new Error('Fecha de ingreso requerida');
      }
      if (new Date(data.hireDate) > new Date()) {
        throw new Error('La fecha de ingreso no puede ser futura');
      }

      // Validar formato de cédula (solo números, longitud mínima 10)
      const identityCardRegex = /^\d+$/;
      if (!identityCardRegex.test(data.identityCard) || data.identityCard.length < 10) {
        throw new Error('La cédula debe contener solo números y tener al menos 10 dígitos');
      }
      if (!data.contractType || typeof data.contractType !== 'string' || data.contractType.trim().length === 0) {
        throw new Error('Tipo de contrato requerido');
      }
      if (!data.civilStatus || typeof data.civilStatus !== 'string' || data.civilStatus.trim().length === 0) {
        throw new Error('Estado civil requerido');
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

  /**
   * Obtener historial de cambios de un empleado
   * @param {string} id - ID del empleado
   * @returns {Promise<Array>} Historial de cambios
   */
  async getEmployeeHistory(id) {
    return await auditRepository.getLogsByEntityId(id);
  }
}

export default new EmployeeService();
