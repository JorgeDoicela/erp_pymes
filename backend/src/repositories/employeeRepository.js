import prisma from '../database/db.js';
import { encrypt, decrypt, encryptSalary, decryptSalary } from '../utils/encryption.js';

/**
 * EmployeeRepository
 * Maneja todas las operaciones de base de datos para empleados
 * Encripta/desencripta automáticamente los salarios
 */
export class EmployeeRepository {
  /**
   * Crear un nuevo empleado
   * @param {Object} data - Datos del empleado
   * @param {string} data.firstName - Nombre
   * @param {string} data.lastName - Apellido
   * @param {string} data.email - Email
   * @param {string} data.department - Departamento
   * @param {string} data.position - Puesto
   * @param {number} data.salary - Salario (se encriptará automáticamente)
   * @returns {Promise<Object>} Empleado creado (con salario desencriptado)
   */
  async create(data) {
    try {
      const { salary, ...rest } = data;

      // Encriptar el salario antes de guardarlo
      const encryptedSalary = encryptSalary(salary);

      const employee = await prisma.employee.create({
        data: {
          ...rest,
          salary: encryptedSalary,
        },
      });

      // Desencriptar el salario en la respuesta
      return {
        ...employee,
        salary: decryptSalary(employee.salary),
      };
    } catch (error) {
      throw new Error(`Error al crear empleado: ${error.message}`);
    }
  }

  /**
   * Obtener un empleado por ID
   * @param {string} id - ID del empleado
   * @returns {Promise<Object>} Empleado (con salario desencriptado)
   */
  async findById(id) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id },
      });

      if (!employee) return null;

      // Desencriptar el salario
      return {
        ...employee,
        salary: decryptSalary(employee.salary),
      };
    } catch (error) {
      throw new Error(`Error al obtener empleado: ${error.message}`);
    }
  }

  /**
   * Obtener todos los empleados
   * @param {Object} options - Opciones de búsqueda
   * @param {number} options.skip - Registros a saltar (para paginación)
   * @param {number} options.take - Cantidad de registros a traer
   * @returns {Promise<Array>} Lista de empleados (con salarios desencriptados)
   */
  async findAll(options = {}) {
    try {
      const { skip = 0, take = 10 } = options;

      const employees = await prisma.employee.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });

      // Desencriptar los salarios
      return employees.map((employee) => ({
        ...employee,
        salary: decryptSalary(employee.salary),
      }));
    } catch (error) {
      throw new Error(`Error al obtener empleados: ${error.message}`);
    }
  }

  /**
   * Buscar empleados por email
   * @param {string} email - Email del empleado
   * @returns {Promise<Object>} Empleado (con salario desencriptado)
   */
  async findByEmail(email) {
    try {
      const employee = await prisma.employee.findUnique({
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
   * Buscar empleados por departamento
   * @param {string} department - Departamento
   * @returns {Promise<Array>} Lista de empleados del departamento
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
   * Actualizar un empleado
   * @param {string} id - ID del empleado
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Empleado actualizado (con salario desencriptado)
   */
  async update(id, data) {
    try {
      const { salary, ...rest } = data;

      // Preparar datos a actualizar
      const updateData = { ...rest };

      // Si se incluye salario, encriptarlo
      if (salary !== undefined) {
        updateData.salary = encryptSalary(salary);
      }

      const employee = await prisma.employee.update({
        where: { id },
        data: updateData,
      });

      // Desencriptar el salario en la respuesta
      return {
        ...employee,
        salary: decryptSalary(employee.salary),
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Empleado no encontrado');
      }
      throw new Error(`Error al actualizar empleado: ${error.message}`);
    }
  }

  /**
   * Eliminar un empleado
   * @param {string} id - ID del empleado
   * @returns {Promise<Object>} Empleado eliminado
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
   * Obtener estadísticas de salarios (sin exponerlos desencriptados)
   * Nota: Esto es una aproximación - en producción deberías calcular en la BD
   * @returns {Promise<Object>} Estadísticas de salarios
   */
  async getSalaryStats() {
    try {
      const employees = await prisma.employee.findMany({
        select: { salary: true },
      });

      const decryptedSalaries = employees.map((emp) =>
        decryptSalary(emp.salary)
      );

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
   * Desconectar Prisma
   */
  async disconnect() {
    await prisma.$disconnect();
  }
}

export default new EmployeeRepository();
