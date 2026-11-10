/**
 * @file index.js
 * @description Módulo de Empleados y Talento Humano de Norma ERP (Monolito Modular / Hexagonal).
 * Agrupa rutas, controladores, servicios, repositorios y DTOs del dominio de empleados.
 */

import router from '../../routes/employees/employee.routes.js';
import employeeRepository from '../../repositories/employees/employeeRepository.js';
import employeeController from '../../controllers/employees/employeeController.js';
import employeeService from '../../services/employees/employeeService.js';
import * as employeeDto from '../../dto/employees/employee.dto.js';

export {
  router as employeeRoutes,
  employeeRepository,
  employeeController,
  employeeService,
  employeeDto,
};

export default router;
