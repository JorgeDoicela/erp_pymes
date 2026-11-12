/**
 * @file onboardingOffboarding.controller.js
 * @description Controlador HTTP para Expediente Digital, Entrega/Devolución de Activos y Salida/Liquidación (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import expedientService from '../records/expedient.service.js';
import assetService from '../records/asset.service.js';
import offboardingService from './offboarding.service.js';

// --- EXPEDIENTE DIGITAL ---
export const getAllExpedientsSummary = async (req, res) => {
  try {
    const result = await expedientService.getAllExpedientsSummary(req.user);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getEmployeeExpedient = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await expedientService.getEmployeeExpedient(id, req.user);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const uploadExpedientDocument = async (req, res) => {
  try {
    const { employeeId, type, documentCategory, documentUrl, mimeType, originalName, expiryDate } =
      req.body;

    const file = req.file;
    const finalUrl = file ? `/uploads/documents/${file.filename}` : documentUrl;
    const finalMime = file ? file.mimetype : mimeType;
    const finalName = file ? file.originalname : originalName;

    if (!finalUrl) {
      return res.status(400).json({
        success: false,
        message: 'Debes adjuntar un archivo o especificar documentUrl',
      });
    }

    const doc = await expedientService.uploadDocument({
      employeeId,
      user: req.user,
      type,
      documentCategory,
      documentUrl: finalUrl,
      mimeType: finalMime,
      originalName: finalName,
      expiryDate,
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyExpedientDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user?.id || req.user?.employeeId;

    const updated = await expedientService.verifyDocument(id, status, notes, adminId);
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteExpedientDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await expedientService.deleteDocument(id, req.user);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// --- GESTIÓN DE ACTIVOS Y EQUIPAMIENTO (EPP) ---
export const deliverAsset = async (req, res) => {
  try {
    const adminId = req.user?.id || req.user?.employeeId;
    const asset = await assetService.deliverAsset({
      ...req.body,
      adminId,
      user: req.user,
    });
    return res.status(201).json({ success: true, data: asset });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id || req.user?.employeeId;
    const updated = await assetService.updateAsset(id, req.body, adminId, req.user);
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const returnAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id || req.user?.employeeId;
    const updated = await assetService.returnAsset(id, req.body, adminId, req.user);
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id || req.user?.employeeId;
    const result = await assetService.deleteAsset(id, adminId, req.user);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getEmployeeAssets = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const assets = await assetService.getEmployeeAssets(employeeId, req.user);
    return res.json({ success: true, data: assets });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllAssets = async (req, res) => {
  try {
    const { status, category, search, page, limit } = req.query;
    const result = await assetService.getAllAssets({
      status,
      category,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 100,
      user: req.user,
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// --- OFFBOARDING & LIQUIDACIONES LEGALES ECUADOR ---
export const simulateSettlement = async (req, res) => {
  try {
    const { employeeId, exitDate, causal } = req.body;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'employeeId es obligatorio' });
    }
    const simulation = await offboardingService.simulateSettlement({
      employeeId,
      exitDate: exitDate ? new Date(exitDate) : new Date(),
      causal,
    });
    return res.json({ success: true, data: simulation });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const startOffboarding = async (req, res) => {
  try {
    const { employeeId, exitDate, causal, notes } = req.body;
    const adminId = req.user?.id || req.user?.employeeId;
    const process = await offboardingService.startOffboarding({
      employeeId,
      exitDate: exitDate || new Date(),
      causal: causal || 'VOLUNTARY_RESIGNATION',
      notes,
      adminId,
      user: req.user,
    });
    return res.status(201).json({ success: true, data: process });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateChecklistStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { stepKey, status, notes, taskId, completed } = req.body;
    const adminId = req.user?.id || req.user?.employeeId;

    const targetTaskId = taskId || stepKey;
    const isCompleted = completed !== undefined ? completed : status === 'COMPLETED';

    const updated = await offboardingService.updateChecklistStep(
      id,
      targetTaskId,
      isCompleted,
      adminId
    );
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getOffboardings = async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const tenantId = req.tenantId || req.user?.tenantId;
    const result = await offboardingService.getOffboardings({
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      tenantId,
      user: req.user,
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export default {
  getAllExpedientsSummary,
  getEmployeeExpedient,
  uploadExpedientDocument,
  verifyExpedientDocument,
  deleteExpedientDocument,
  deliverAsset,
  updateAsset,
  returnAsset,
  deleteAsset,
  getEmployeeAssets,
  getAllAssets,
  simulateSettlement,
  startOffboarding,
  updateChecklistStep,
  getOffboardings,
};
