import expedientService from '../../services/employees/expedientService.js';
import assetService from '../../services/employees/assetService.js';
import offboardingService from '../../services/employees/offboardingService.js';

// --- EXPEDIENTE DIGITAL ---
export const getEmployeeExpedient = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await expedientService.getEmployeeExpedient(id);
        return res.json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const uploadExpedientDocument = async (req, res) => {
    try {
        const employeeId = req.user.employeeId || req.user.id;
        const { type, documentCategory, documentUrl, mimeType, originalName } = req.body;

        const doc = await expedientService.uploadDocument({
            employeeId,
            type,
            documentCategory,
            documentUrl,
            mimeType,
            originalName
        });

        return res.status(201).json({ success: true, message: 'Documento cargado exitosamente', data: doc });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const verifyExpedientDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const adminId = req.user.id;

        const updated = await expedientService.verifyDocument(id, status, notes, adminId);
        return res.json({ success: true, message: 'Estado de documento actualizado', data: updated });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// --- EQUIPOS Y EPPS ---
export const deliverAsset = async (req, res) => {
    try {
        const { employeeId, name, serialNumber, category, condition, receiptSignatureUrl } = req.body;
        const adminId = req.user.id;

        const asset = await assetService.deliverAsset({
            employeeId,
            name,
            serialNumber,
            category,
            condition,
            receiptSignatureUrl,
            adminId
        });

        return res.status(201).json({ success: true, message: 'Entrega de activo/EPP registrada', data: asset });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const returnAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const { returnNotes, condition, status } = req.body;
        const adminId = req.user.id;

        const updated = await assetService.returnAsset(id, { returnNotes, condition, status }, adminId);
        return res.json({ success: true, message: 'Devolución de activo registrada', data: updated });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getEmployeeAssets = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const assets = await assetService.getEmployeeAssets(employeeId);
        return res.json({ success: true, data: assets });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getAllAssets = async (req, res) => {
    try {
        const { status, category, search, page, limit } = req.query;
        const result = await assetService.getAllAssets({
            status, category, search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20
        });
        return res.json({ success: true, ...result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// --- OFFBOARDING & FINIQUITO ---
export const simulateSettlement = async (req, res) => {
    try {
        const { employeeId, exitDate, causal } = req.body;
        const result = await offboardingService.simulateSettlement({ employeeId, exitDate, causal });
        return res.json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const startOffboarding = async (req, res) => {
    try {
        const { employeeId, exitDate, causal, notes } = req.body;
        const adminId = req.user.id;

        const process = await offboardingService.startOffboarding({ employeeId, exitDate, causal, notes, adminId });
        return res.status(201).json({ success: true, message: 'Proceso de salida iniciado', data: process });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const updateChecklistStep = async (req, res) => {
    try {
        const { id } = req.params;
        const { taskId, completed } = req.body;
        const adminId = req.user.id;

        const updated = await offboardingService.updateChecklistStep(id, taskId, completed, adminId);
        return res.json({ success: true, message: 'Checklist actualizado', data: updated });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getOffboardings = async (req, res) => {
    try {
        const { status, search, page, limit } = req.query;
        const result = await offboardingService.getOffboardings({
            status, search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20
        });
        return res.json({ success: true, ...result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
