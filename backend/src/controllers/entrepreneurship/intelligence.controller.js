/**
 * @file intelligence.controller.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import * as intelligenceService from '../../services/entrepreneurship/intelligence.js';

export const getProjectAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const [score, financial, recommendedMentors] = await Promise.all([
      intelligenceService.calculateSuccessScore(id),
      intelligenceService.getFinancialAnalysis(id),
      intelligenceService.getMentorRecommendations(id),
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
    const analysis = await intelligenceService.analyzePitchNarrative(id);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGrowthData = async (req, res) => {
  try {
    const { id } = req.params;
    const growth = await intelligenceService.getGrowthMetrics(id);
    res.json(growth);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
