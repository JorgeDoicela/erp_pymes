/**
 * @file entrepreneurship.controller.js
 * @description Norma ERP - Controlador de Proyectos de Emprendimiento
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import entrepreneurshipRepository from './entrepreneurship.repository.js';

export const getProjects = async (req, res) => {
  try {
    const { stage, status } = req.query;
    const tenantId = req.tenantId || req.user?.tenantId;
    const projects = await entrepreneurshipRepository.findProjects({ stage, status, tenantId });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener proyectos', details: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { title, description, industry, stage, budget, innovationScore } = req.body;
    const targetOwnerId = req.body.ownerId || req.user?.employeeId || req.user?.id;

    if (!targetOwnerId) {
      return res.status(400).json({ error: 'Propietario del proyecto (ownerId) no especificado' });
    }

    const project = await entrepreneurshipRepository.createProject({
      title,
      description,
      industry,
      stage: stage || 'IDEATION',
      ownerId: targetOwnerId,
      budget: parseFloat(budget) || 0,
      innovationScore: parseFloat(innovationScore) || 0,
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear proyecto', details: error.message });
  }
};

export const getProjectDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await entrepreneurshipRepository.findProjectDetails(id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener detalles', details: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await entrepreneurshipRepository.updateProject(req.params.id, req.body);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar proyecto', details: error.message });
  }
};

export const addMilestone = async (req, res) => {
  try {
    const { projectId, title, description, dueDate } = req.body;
    const milestone = await entrepreneurshipRepository.createMilestone({
      projectId,
      title,
      description,
      dueDate: new Date(dueDate),
    });
    res.status(201).json(milestone);
  } catch (error) {
    res.status(500).json({ error: 'Error al añadir hito', details: error.message });
  }
};

export const updateMilestone = async (req, res) => {
  try {
    const { title, description, status, dueDate, completedDate, kanbanColumn } = req.body;
    const milestone = await entrepreneurshipRepository.updateMilestone(req.params.id, {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
      completedDate: completedDate ? new Date(completedDate) : undefined,
      ...(kanbanColumn && { kanbanColumn }),
    });
    res.json(milestone);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar hito', details: error.message });
  }
};

export const deleteMilestone = async (req, res) => {
  try {
    await entrepreneurshipRepository.deleteMilestone(req.params.id);
    res.json({ message: 'Hito eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar hito', details: error.message });
  }
};

export const addUpdate = async (req, res) => {
  try {
    const { projectId, title, content, type } = req.body;
    const update = await entrepreneurshipRepository.createUpdate({ projectId, title, content, type });
    res.status(201).json(update);
  } catch (error) {
    res.status(500).json({ error: 'Error al añadir actualización', details: error.message });
  }
};

export const deleteUpdate = async (req, res) => {
  try {
    await entrepreneurshipRepository.deleteUpdate(req.params.id);
    res.json({ message: 'Actualización eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar actualización', details: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    await entrepreneurshipRepository.deleteProject(req.params.id);
    res.json({ message: 'Proyecto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar proyecto', details: error.message });
  }
};

