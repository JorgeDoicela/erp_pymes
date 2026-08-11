import { Router } from 'express';
import absenceController from '../../controllers/attendance/absenceController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Crear (Upload file) - Empleado o Admin
router.post('/', absenceController.uploadMiddleware, absenceController.createRequest);

// Listar todas (Admin/HR/Manager/Accounting)
router.get('/', authorize(['admin', 'hr', 'manager', 'accounting']), absenceController.getRequests);

// Mis solicitudes (Empleado)
router.get('/my-requests', absenceController.getMyRequests);

// Aprobar/Rechazar (Admin/HR/Manager)
router.patch('/:id/status', authorize(['admin', 'hr', 'manager']), absenceController.updateStatus);

export default router;
