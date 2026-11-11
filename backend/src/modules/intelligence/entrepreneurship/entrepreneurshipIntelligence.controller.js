/**
 * @file entrepreneurshipIntelligence.controller.js
 * @description Norma ERP - Controlador de Inteligencia de Proyectos de Emprendimiento
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import * as entrepreneurshipIntelligenceService from './entrepreneurshipIntelligence.service.js';

export const getProjectAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const [score, financial, recommendedMentors] = await Promise.all([
      entrepreneurshipIntelligenceService.calculateSuccessScore(id),
      entrepreneurshipIntelligenceService.getFinancialAnalysis(id),
      entrepreneurshipIntelligenceService.getMentorRecommendations(id),
    ]);

    res.json({
      successScore: score,
      financialAnalysis: financial,
      recommendedMentors,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPitchAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const analysis = await entrepreneurshipIntelligenceService.analyzePitchNarrative(id);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGrowthData = async (req, res) => {
  try {
    const { id } = req.params;
    const growth = await entrepreneurshipIntelligenceService.getGrowthMetrics(id);
    res.json(growth);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
