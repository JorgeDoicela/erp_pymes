/**
 * @file validation.controller.js
 * @description Norma ERP - Controlador de Validación de Mercado y Entrevistas
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import entrepreneurshipRepository from './entrepreneurship.repository.js';

export const getInterviews = async (req, res) => {
  try {
    const interviews = await entrepreneurshipRepository.findInterviews(req.params.id);
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addInterview = async (req, res) => {
  try {
    const { projectId, customerName, feedback, sentiment, insights } = req.body;
    const project = await entrepreneurshipRepository.findProjectDetails(projectId);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const interview = await entrepreneurshipRepository.createInterview({
      projectId,
      customerName,
      feedback,
      sentiment,
      insights,
    });
    res.status(201).json(interview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateInterview = async (req, res) => {
  try {
    const { customerName, feedback, sentiment, insights } = req.body;
    const interview = await entrepreneurshipRepository.updateInterview(req.params.id, {
      customerName,
      feedback,
      sentiment,
      insights,
    });
    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteInterview = async (req, res) => {
  try {
    await entrepreneurshipRepository.deleteInterview(req.params.id);
    res.json({ message: 'Entrevista eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMarketSize = async (req, res) => {
  try {
    const { projectId, tam, sam, som } = req.body;
    const project = await entrepreneurshipRepository.findProjectDetails(projectId);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const market = await entrepreneurshipRepository.upsertTargetMarket(projectId, {
      tam: parseFloat(tam),
      sam: parseFloat(sam),
      som: parseFloat(som),
    });
    res.json(market);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
