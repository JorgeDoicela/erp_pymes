import { Router } from 'express';
import { login } from '../controllers/auth/authController.js';
import employeeRoutes from './employees/employee.routes.js';
import contractRoutes from './contracts/contract.routes.js';
import documentRoutes from './documents/document.routes.js';
import attendanceRoutes from './attendance/attendance.routes.js';
import shiftRoutes from './attendance/shift.routes.js';
import absenceRoutes from './attendance/absence.routes.js';
import reportRoutes from './reports/report.routes.js';
import payrollConfigRoutes from './payroll/payrollConfig.routes.js';
import benefitsRoutes from './payroll/benefits.routes.js';
import evaluationRoutes from './performance/evaluation.routes.js';
import goalsRoutes from './performance/goals.routes.js';


const router = Router();

// Ruta de prueba
router.get('/', (req, res) => {
    res.send('API EMPLIFI funcionando correctamente v1');
});

// Login real
router.post('/auth/login', login);

// Rutas de empleados
router.use('/employees', employeeRoutes);
router.use('/contracts', contractRoutes);
router.use('/documents', documentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/shifts', shiftRoutes);
router.use('/absences', absenceRoutes);
router.use('/reports', reportRoutes);

// Payroll Routes
router.use('/payroll', payrollConfigRoutes);
router.use('/benefits', benefitsRoutes);
router.use('/performance', evaluationRoutes);
router.use('/goals', goalsRoutes);

export default router;
