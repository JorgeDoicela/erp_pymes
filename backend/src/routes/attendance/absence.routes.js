import { Router } from 'express';
import absenceController from '../../controllers/attendance/absenceController.js';
import { authenticate } from '../../middleware/auth.middleware.js'; // Ajustar ruta si es necesario

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Crear (Upload file)
router.post('/', absenceController.uploadMiddleware, absenceController.createRequest);

// Listar todas (Admin) o filtrar
router.get('/', absenceController.getRequests);

// Mis solicitudes (Empleado)
router.get('/my-requests', absenceController.getMyRequests);

// Aprobar/Rechazar (Admin)
router.patch('/:id/status', absenceController.updateStatus);

export default router;
