/**
 * @file capTable.controller.js
 * @description Norma ERP - Controlador de CapTable y Rondas de Inversión
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import entrepreneurshipRepository from './entrepreneurship.repository.js';

export const getCapTable = async (req, res) => {
  try {
    const equities = await entrepreneurshipRepository.findEquities(req.params.id);
    res.json(equities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addEquityHolder = async (req, res) => {
  try {
    const { projectId, holderName, percentage, role, vestingTerms } = req.body;
    const project = await entrepreneurshipRepository.findProjectDetails(projectId);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const equity = await entrepreneurshipRepository.createEquity({
      projectId,
      holderName,
      percentage: parseFloat(percentage),
      role,
      vestingTerms,
    });
    res.status(201).json(equity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEquityHolder = async (req, res) => {
  try {
    const { holderName, percentage, role, vestingTerms } = req.body;
    const equity = await entrepreneurshipRepository.updateEquity(req.params.id, {
      holderName,
      percentage: percentage ? parseFloat(percentage) : undefined,
      role,
      vestingTerms,
    });
    res.json(equity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEquityHolder = async (req, res) => {
  try {
    await entrepreneurshipRepository.deleteEquity(req.params.id);
    res.json({ message: 'Socio eliminado del CapTable' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFundingRounds = async (req, res) => {
  try {
    const rounds = await entrepreneurshipRepository.findFundingRounds(req.params.id);
    res.json(rounds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addFundingRound = async (req, res) => {
  try {
    const { projectId, roundName, amountRaised, valuation, date, investors } = req.body;
    const project = await entrepreneurshipRepository.findProjectDetails(projectId);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const round = await entrepreneurshipRepository.createFundingRound({
      projectId,
      roundName,
      amountRaised: parseFloat(amountRaised),
      valuation: parseFloat(valuation),
      date: new Date(date),
      investors,
    });
    await entrepreneurshipRepository.updateProject(projectId, {
      valuation: parseFloat(valuation),
    });
    res.status(201).json(round);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFundingRound = async (req, res) => {
  try {
    const { roundName, amountRaised, valuation, date, investors } = req.body;
    const round = await entrepreneurshipRepository.updateFundingRound(req.params.id, {
      roundName,
      amountRaised: amountRaised ? parseFloat(amountRaised) : undefined,
      valuation: valuation ? parseFloat(valuation) : undefined,
      date: date ? new Date(date) : undefined,
      investors,
    });

    if (valuation) {
      await entrepreneurshipRepository.updateProject(round.projectId, {
        valuation: parseFloat(valuation),
      });
    }

    res.json(round);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteFundingRound = async (req, res) => {
  try {
    await entrepreneurshipRepository.deleteFundingRound(req.params.id);
    res.json({ message: 'Ronda de inversión eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
