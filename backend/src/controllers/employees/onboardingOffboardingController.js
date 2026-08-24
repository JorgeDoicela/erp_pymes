import expedientService from '../../services/employees/expedientService.js';
import assetService from '../../services/employees/assetService.js';
import offboardingService from '../../services/employees/offboardingService.js';

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
        const { employeeId, type, documentCategory, documentUrl, mimeType, originalName, expiryDate } = req.body;

        const doc = await expedientService.uploadDocument({
            employeeId,
            user: req.user,
            type,
            documentCategory,
            documentUrl,
            mimeType,
            originalName,
            expiryDate
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

export const deleteExpedientDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await expedientService.deleteDocument(id, req.user.id);
        return res.json({ success: true, message: 'Documento eliminado exitosamente', data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// --- EQUIPOS Y EPPS ---
export const deliverAsset = async (req, res) => {
    try {
        const { employeeId, name, serialNumber, category, condition, deliveryDate, receiptSignatureUrl } = req.body;
        const adminId = req.user.id;

        const asset = await assetService.deliverAsset({
            employeeId,
            name,
            serialNumber,
            category,
            condition,
            deliveryDate,
            receiptSignatureUrl,
            adminId,
            user: req.user
        });

        return res.status(201).json({ success: true, message: 'Entrega de activo/EPP registrada', data: asset });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, serialNumber, category, condition, deliveryDate } = req.body;
        const adminId = req.user.id;

        const updated = await assetService.updateAsset(id, { name, serialNumber, category, condition, deliveryDate }, adminId, req.user);
        return res.json({ success: true, message: 'Activo actualizado exitosamente', data: updated });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const returnAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const { returnNotes, condition, status, returnDate } = req.body;
        const adminId = req.user.id;

        const updated = await assetService.returnAsset(id, { returnNotes, condition, status, returnDate }, adminId, req.user);
        return res.json({ success: true, message: 'Devolución de activo registrada', data: updated });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await assetService.deleteAsset(id, req.user.id, req.user);
        return res.json({ success: true, message: 'Registro de activo eliminado exitosamente', data: result });
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
            status, category, search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 100,
            user: req.user
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const result = await offboardingService.getOffboardings({
            status, search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            tenantId
        });
        return res.json({ success: true, ...result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
