/**
 * @file goals.controller.js
 * @description Controlador REST para la gestión de Objetivos SMART (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { goalsService } from './goals.service.js';

export const createGoal = async (req, res, next) => {
  try {
    const goal = await goalsService.createGoal(req.user, req.body);
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
};

export const getMyGoals = async (req, res, next) => {
  try {
    const goals = await goalsService.getMyGoals(req.user);
    res.json(goals);
  } catch (error) {
    next(error);
  }
};

export const updateGoalProgress = async (req, res, next) => {
  try {
    const updatedGoal = await goalsService.updateGoalProgress(req.user, req.params.id, req.body);
    res.json(updatedGoal);
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const result = await goalsService.deleteGoal(req.user, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  createGoal,
  getMyGoals,
  updateGoalProgress,
  deleteGoal,
};
