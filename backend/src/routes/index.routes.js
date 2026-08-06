import { Router } from 'express';
import { login, forgotPassword, resetPassword } from '../controllers/auth/authController.js';
import employeeRoutes from './employees/employee.routes.js';
import onboardingOffboardingRoutes from './employees/onboardingOffboarding.routes.js';
import contractRoutes from './contracts/contract.routes.js';
import documentRoutes from './documents/document.routes.js';
import attendanceRoutes from './attendance/attendance.routes.js';
import shiftRoutes from './attendance/shift.routes.js';
import absenceRoutes from './attendance/absence.routes.js';
import reportRoutes from './reports/report.routes.js';
import payrollConfigRoutes from './payroll/payrollConfig.routes.js';
import benefitsRoutes from './payroll/benefits.routes.js';
import salaryAdvanceRoutes from './payroll/salaryAdvance.routes.js';
import evaluationRoutes from './performance/evaluation.routes.js';
import goalsRoutes from './performance/goals.routes.js';
import recruitmentRoutes from './recruitment.routes.js';
import analyticsRoutes from './analytics.routes.js';
import skillRoutes from './skills/skill.routes.js';
import notificationRoutes from './notifications/notification.routes.js';
import auditRoutes from './audit.routes.js';
import exportRoutes from './export/export.routes.js';
import intelligenceRoutes from './intelligence.routes.js';
import accountingRoutes from './accounting.routes.js';
import { runSeed } from '../controllers/admin/seedController.js';


import biometricRoutes from './biometric/biometric.routes.js';
import entrepreneurshipRoutes from './entrepreneurship.routes.js';
import complianceRoutes from './compliance/compliance.routes.js';
import announcementRoutes from './communication/announcement.routes.js';

import tenantRoutes from './tenant/tenant.routes.js';

const router = Router();
// Ruta de prueba
router.get('/', (req, res) => {
    res.send('API EMPLIFI funcionando correctamente v1');
});

// Seed Remoto (Protegido)
router.post('/seed', (req, res, next) => {
    runSeed(req, res).catch(next);
});

// Migración Remota (Fallback)
router.post('/migrate', (req, res, next) => {
    import('../controllers/admin/seedController.js').then(ctrl => {
        ctrl.runMigration(req, res).catch(next);
    });
});

import superAdminRoutes from './admin/superAdmin.routes.js';

// Onboarding y Gestión de Empresas (Tenants)
router.use('/tenants', tenantRoutes);
router.use('/superadmin', superAdminRoutes);

import { rateLimit } from '../middleware/rateLimit.middleware.js';

// Login y Recuperación (Con Rate Limiting: max 10 intentos cada 15 min)
router.post('/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 }), login);
router.post('/auth/forgot-password', rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 }), forgotPassword);
router.post('/auth/reset-password', resetPassword);

// Rutas de reclutamiento: las públicas no tienen auth, las admin aplican authenticate+authorize internamente
router.use('/recruitment', recruitmentRoutes);

import { authenticate } from '../middleware/auth.middleware.js';
import { requireTenant } from '../middleware/tenant.middleware.js';

// Middleware de Aislamiento Multi-Empresa Protegido
const protectedTenant = [authenticate, requireTenant];

// Rutas protegidas por Tenant
router.use('/employees', protectedTenant, employeeRoutes);
router.use('/onboarding-offboarding', protectedTenant, onboardingOffboardingRoutes);
router.use('/contracts', protectedTenant, contractRoutes);
router.use('/documents', protectedTenant, documentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/shifts', protectedTenant, shiftRoutes);
router.use('/absences', protectedTenant, absenceRoutes);
router.use('/reports', protectedTenant, reportRoutes);
router.use('/payroll', protectedTenant, payrollConfigRoutes);
router.use('/benefits', protectedTenant, benefitsRoutes);
router.use('/salary-advances', protectedTenant, salaryAdvanceRoutes);
router.use('/performance', protectedTenant, evaluationRoutes);
router.use('/goals', protectedTenant, goalsRoutes);
// Las rutas admin de /recruitment ya están cubiertas por el router compartido arriba.
// El router interno aplica authenticate + authorize en cada ruta admin individualmente.
router.use('/analytics', protectedTenant, analyticsRoutes);
router.use('/skills', protectedTenant, skillRoutes);
router.use('/notifications', protectedTenant, notificationRoutes);
router.use('/audit', protectedTenant, auditRoutes);
router.use('/export', protectedTenant, exportRoutes);
router.use('/biometric', biometricRoutes);
router.use('/intelligence', protectedTenant, intelligenceRoutes);
router.use('/accounting', protectedTenant, accountingRoutes);
router.use('/entrepreneurship', protectedTenant, entrepreneurshipRoutes);
router.use('/compliance', protectedTenant, complianceRoutes);
router.use('/announcements', protectedTenant, announcementRoutes);

export default router;
