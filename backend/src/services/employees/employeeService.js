import employeeRepository from '../../repositories/employees/employeeRepository.js';
import auditRepository from '../../repositories/audit/auditRepository.js';

/**
 * EmployeeService
 * Contiene la lógica de negocio para gestión de empleados
 */
const VALID_CIVIL_STATUSES = ['Soltero', 'Casado', 'Divorciado', 'Viudo', 'Union Libre'];
const VALID_CONTRACT_TYPES = ['Indefinido', 'Temporal', 'Por Obra', 'Prácticas'];

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

    // --- INICIO REGLAS DE NEGOCIO ---

    // 1. Reglas de contratación
    if (!isPartial) {
      if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) throw new Error('Nombre requerido y debe ser texto');
      if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) throw new Error('Apellido requerido y debe ser texto');
      if (!email || typeof email !== 'string' || !this.isValidEmail(email)) throw new Error('Email inválido');

      // Validaciones de fechas
      if (!data.birthDate) throw new Error('Fecha de nacimiento requerida');
      if (!data.hireDate) throw new Error('Fecha de ingreso requerida');

      const birthDate = new Date(data.birthDate);
      const hireDate = new Date(data.hireDate);
      const today = new Date();

      if (birthDate > today) throw new Error('La fecha de nacimiento no puede ser futura');
      if (hireDate <= birthDate) throw new Error('La fecha de ingreso debe ser posterior a la fecha de nacimiento');
      if (hireDate > today) throw new Error('La fecha de ingreso no puede ser futura');

      const age = this.calculateAge(birthDate);

      // "El empleado debe ser mayor de 18 años para poder ser contratado."
      if (age < 18) {
        throw new Error(`El empleado debe ser mayor de edad. Edad actual: ${age} años.`);
      }
      // "La edad máxima para contratación será de 65 años..."
      if (age > 65) {
        throw new Error(`El empleado supera la edad máxima de contratación (65 años). Edad actual: ${age} años.`);
      }

      // "Todo empleado debe contar con documentación de identidad válida..."
      if (!data.identityCard || !/^\d{10,}$/.test(data.identityCard)) {
        throw new Error('Cédula requerida y debe tener al menos 10 dígitos numéricos');
      }

      // 2. Reglas de cargos y puestos
      if (!department || typeof department !== 'string' || department.trim().length === 0) throw new Error('Departamento requerido');
      if (!position || typeof position !== 'string' || position.trim().length === 0) throw new Error('Puesto requerido');

      // "Para cargos de jefatura o supervisión..."
      if (position.toLowerCase().includes('jefe') || position.toLowerCase().includes('supervisor')) {
        // TODO: Validar experiencia laboral previa (WorkHistory) > X años
      }

      // "Un cargo debe pertenecer obligatoriamente a un área o departamento."
      // (Validado implícitamente al requerir ambos)    

      // 3. Reglas salariales
      if (salary === undefined || typeof salary !== 'number' || salary <= 0) throw new Error('Salario debe ser un número positivo');

      // "El salario del empleado no puede ser menor al salario básico legal vigente."
      if (salary < 450) {
        throw new Error('El salario no puede ser inferior al salario básico unificado ($450)');
      }

      // Otras Validaciones (Address, Phone, Enums)
      if (!data.address || typeof data.address !== 'string' || data.address.trim().length < 10) throw new Error('La dirección debe ser detallada (mínimo 10 caracteres)');
      if (!data.phone || !/^\d{10}$/.test(data.phone)) throw new Error('El teléfono debe tener exactamente 10 dígitos numéricos');

      if (!data.contractType || !VALID_CONTRACT_TYPES.includes(data.contractType)) throw new Error(`Tipo de contrato inválido. Valores permitidos: ${VALID_CONTRACT_TYPES.join(', ')}`);
      if (!data.civilStatus || !VALID_CIVIL_STATUSES.includes(data.civilStatus)) throw new Error(`Estado civil inválido. Valores permitidos: ${VALID_CIVIL_STATUSES.join(', ')}`);

    } else {
      // Validaciones parciales para actualizar
      if (firstName !== undefined && (typeof firstName !== 'string' || firstName.trim().length === 0)) throw new Error('Nombre debe ser texto válido');
      if (lastName !== undefined && (typeof lastName !== 'string' || lastName.trim().length === 0)) throw new Error('Apellido debe ser texto válido');
      if (email !== undefined && (typeof email !== 'string' || !this.isValidEmail(email))) throw new Error('Email inválido');
      if (department !== undefined && (typeof department !== 'string' || department.trim().length === 0)) throw new Error('Departamento debe ser texto válido');
      if (position !== undefined && (typeof position !== 'string' || position.trim().length === 0)) throw new Error('Puesto debe ser texto válido');

      if (salary !== undefined) {
        if (typeof salary !== 'number' || salary <= 0) throw new Error('Salario debe ser un número positivo');
        if (salary < 450) throw new Error('El salario no puede ser inferior al salario básico unificado ($450)');
      }

      // Validate booleans if present
      if (data.hasNightSurcharge !== undefined && typeof data.hasNightSurcharge !== 'boolean') throw new Error('Recargo nocturno debe ser booleano');
      if (data.hasDoubleOvertime !== undefined && typeof data.hasDoubleOvertime !== 'boolean') throw new Error('Doble horas extras debe ser booleano');
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

  /**
   * Calcular edad basada en fecha de nacimiento
   * @param {Date} birthDate 
   * @returns {number} Edad en años
   */
  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}

export default new EmployeeService();
