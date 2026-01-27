import { absenceService } from '../../services/attendance/absenceService.js';
import notificationService from '../../services/notifications/notificationService.js';
import prisma from '../../database/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { STORAGE_CONFIG } from '../../config/storage.config.js';

// --- Configuración de Multer ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.resolve(process.cwd(), STORAGE_CONFIG.PATHS.EVIDENCE);
        // Crear directorio si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'evidence-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: STORAGE_CONFIG.MAX_FILE_SIZE } // 5MB limit consolidated
});

// --- Controller Methods ---

const createRequest = async (req, res, next) => {
    try {
        // req.body tiene los campos de texto, req.file el archivo
        const { type, startDate, endDate, reason, employeeId } = req.body;

        // Si viene del token (usuario normal) usamos ese, si es admin creando para otro podría venir en body
        // Por seguridad, si es empleado, forzar su ID.
        // Asumiremos que el middleware de auth ya puso req.user

        const targetEmployeeId = employeeId || req.user.id;

        console.log('Creating Absence Request');
        console.log('Body:', req.body);
        console.log('File:', req.file); // DEBUG

        const request = await absenceService.createRequest({
            employeeId: targetEmployeeId,
            type,
            startDate,
            endDate,
            reason,
            file: req.file
        });

        // NOTIFICATION: Notify Admins (Approvers)
        const admins = await prisma.employee.findMany({ where: { role: 'admin', isActive: true } });
        const employee = await prisma.employee.findUnique({ where: { id: targetEmployeeId } });

        for (const admin of admins) {
            await notificationService.sendAbsenceRequested({
                recipientId: admin.id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                type: type,
                startDate: startDate,
                endDate: endDate,
                requestId: request.id
            });
        }

        res.status(201).json({ success: true, data: request });
    } catch (error) {
        next(error);
    }
};

const getRequests = async (req, res, next) => {
    try {
        const { status, employeeId } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (employeeId) filter.employeeId = employeeId;

        const requests = await absenceService.getAllRequests(filter);
        res.json({ success: true, data: requests });
    } catch (error) {
        next(error);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, adminComment } = req.body;

        const updated = await absenceService.updateRequestStatus(id, status, adminComment);
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

const getMyRequests = async (req, res, next) => {
    try {
        const requests = await absenceService.getEmployeeRequests(req.user.id);
        res.json({ success: true, data: requests });
    } catch (error) {
        next(error);
    }
};

export default {
    createRequest,
    getRequests,
    updateStatus,
    getMyRequests,
    uploadMiddleware: upload.single('evidence') // Middleware export
};
