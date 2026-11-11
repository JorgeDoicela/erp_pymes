/**
 * @file goals.service.js
 * @description Servicio de aplicación para la gestión de Objetivos SMART (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { performanceRepository } from '../evaluations/performance.repository.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../../../core/errors/appError.js';

export class GoalsService {
  /**
   * Crear un nuevo objetivo SMART para el empleado.
   */
  async createGoal(user, { title, description, metric, targetValue, unit, deadline, priority }) {
    const employeeId = await performanceRepository.resolveEmployeeId(user);

    if (!title || !metric || targetValue === undefined || targetValue === null || !deadline) {
      throw new ValidationError('Faltan campos obligatorios para definir un objetivo SMART.');
    }

    const parsedTarget = parseFloat(targetValue);
    if (isNaN(parsedTarget)) {
      throw new ValidationError('El valor meta debe ser un número válido.');
    }

    return performanceRepository.createGoal({
      employeeId,
      title: title.trim(),
      description: description ? description.trim() : null,
      metric: metric.trim(),
      targetValue: parsedTarget,
      unit: unit || '%',
      deadline: new Date(deadline),
      priority: priority || 'MEDIUM',
      status: 'PENDING',
      progress: 0,
      currentValue: 0,
    });
  }

  /**
   * Obtener los objetivos SMART del empleado autenticado.
   */
  async getMyGoals(user) {
    const employeeId = await performanceRepository.resolveEmployeeId(user);
    return performanceRepository.findGoalsByEmployee(employeeId);
  }

  /**
   * Actualizar el progreso y estado de un objetivo SMART.
   */
  async updateGoalProgress(user, id, { currentValue, status }) {
    const employeeId = await performanceRepository.resolveEmployeeId(user);
    const isAdminOrHR = ['admin', 'hr', 'superadmin'].includes(user?.role);

    const goal = await performanceRepository.findGoalById(id);
    if (!goal) {
      throw new NotFoundError('Objetivo no encontrado');
    }

    if (goal.employeeId !== employeeId && !isAdminOrHR) {
      throw new ForbiddenError('No tienes permiso para actualizar este objetivo');
    }

    const newVal = parseFloat(currentValue);
    const validNewVal = isNaN(newVal) ? 0 : newVal;
    const target = parseFloat(goal.targetValue);

    let newProgress = 0;
    if (!isNaN(target) && target > 0) {
      newProgress = Math.max(
        0,
        Math.min(100, parseFloat(((validNewVal / target) * 100).toFixed(2)))
      );
    } else if (validNewVal >= target && target <= 0) {
      newProgress = 100;
    }

    let newStatus = status || goal.status;
    if (newProgress >= 100) newStatus = 'COMPLETED';
    else if (newProgress > 0 && newStatus === 'PENDING') newStatus = 'IN_PROGRESS';

    return performanceRepository.updateGoal(id, {
      currentValue: validNewVal,
      progress: newProgress,
      status: newStatus,
    });
  }

  /**
   * Eliminar un objetivo SMART.
   */
  async deleteGoal(user, id) {
    const employeeId = await performanceRepository.resolveEmployeeId(user);
    const isAdminOrHR = ['admin', 'hr', 'superadmin'].includes(user?.role);

    const goal = await performanceRepository.findGoalById(id);
    if (!goal) {
      throw new NotFoundError('Objetivo no encontrado');
    }

    if (goal.employeeId !== employeeId && !isAdminOrHR) {
      throw new ForbiddenError('No tienes permiso para eliminar este objetivo');
    }

    await performanceRepository.deleteGoal(id);
    return { success: true, message: 'Objetivo eliminado correctamente' };
  }
}

export const goalsService = new GoalsService();
export default goalsService;
