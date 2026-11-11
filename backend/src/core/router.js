/**
 * @file router.js
 * @description Norma ERP - Enrutador Central del Monolito Modular
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import {
  authRoutes,
  employeeRoutes,
  onboardingOffboardingRoutes,
  payrollRoutes as payrollConfigRoutes,
  benefitsRoutes,
  salaryAdvanceRoutes,
  accountingRoutes,
  sustainabilityRoutes,
  attendanceRoutes,
  shiftRoutes,
  absenceRoutes,
  contractRoutes,
  documentRoutes,
  complianceRoutes,
  signatureRoutes,
  evaluationRoutes,
  goalsRoutes,
  recruitmentRoutes,
  auditRoutes,
  biometricRoutes,
  biometricController,
  skillRoutes,
  announcementRoutes,
  tenantRoutes,
  superAdminRoutes,
  seedController,
  notificationRoutes,
  reportRoutes,
  exportRoutes,
  intelligenceRoutes,
  analyticsRoutes,
  entrepreneurshipRoutes,
} from '../modules/index.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { requireTenant } from '../middleware/tenant.middleware.js';

const router = Router();

// Módulo Desacoplado de Firma Digital QR y Firma Electrónica Oficial Ecuador (.p12)
router.use('/signatures', signatureRoutes);

// Ruta de prueba
router.get('/', (req, res) => {
  res.send('API NORMA ERP funcionando correctamente v1');
});

// Seed y Migración Remota (Protegido para SuperAdmin)
router.post('/seed', authenticate, authorize(['superadmin']), (req, res, next) => {
  seedController.runSeed(req, res).catch(next);
});

router.post('/migrate', authenticate, authorize(['superadmin']), (req, res, next) => {
  seedController.runMigration(req, res).catch(next);
});

// Onboarding y Gestión de Empresas (Tenants)
router.use('/tenants', tenantRoutes);
router.use('/superadmin', superAdminRoutes);

// Autenticación y Recuperación (Con Rate Limiting interno)
router.use('/auth', authRoutes);

// Rutas de reclutamiento: las públicas no tienen auth, las admin aplican authenticate+authorize internamente
router.use('/recruitment', recruitmentRoutes);

// Middleware de Aislamiento Multi-Empresa Protegido
const protectedTenant = [authenticate, requireTenant];

// Rutas protegidas por Tenant
router.use('/employees', protectedTenant, employeeRoutes);
router.use('/onboarding-offboarding', protectedTenant, onboardingOffboardingRoutes);
router.use('/contracts', protectedTenant, contractRoutes);
router.use('/documents', protectedTenant, documentRoutes);
router.use('/attendance', protectedTenant, attendanceRoutes);
router.use('/shifts', protectedTenant, shiftRoutes);
router.use('/absences', protectedTenant, absenceRoutes);
router.use('/reports', protectedTenant, reportRoutes);
router.use('/payroll', protectedTenant, payrollConfigRoutes);
router.use('/benefits', protectedTenant, benefitsRoutes);
router.use('/salary-advances', protectedTenant, salaryAdvanceRoutes);
router.use('/performance', protectedTenant, evaluationRoutes);
router.use('/goals', protectedTenant, goalsRoutes);
router.use('/analytics', protectedTenant, analyticsRoutes);
router.use('/skills', protectedTenant, skillRoutes);
router.use('/notifications', protectedTenant, notificationRoutes);
router.use('/audit', protectedTenant, auditRoutes);
router.use('/export', protectedTenant, exportRoutes);

// Rutas públicas de autenticación biométrica (login del empleado sin token previo)
router.post('/biometric/login/options', biometricController.getAuthenticationOptions);
router.post('/biometric/login/verify', biometricController.verifyAuthentication);

// Rutas protegidas de biometría (registro, estado — requieren sesión activa)
router.use('/biometric', protectedTenant, biometricRoutes);
router.use('/intelligence', protectedTenant, intelligenceRoutes);
router.use('/accounting', protectedTenant, accountingRoutes);
router.use('/sustainability', protectedTenant, sustainabilityRoutes);
router.use('/entrepreneurship', protectedTenant, entrepreneurshipRoutes);
router.use('/compliance', protectedTenant, complianceRoutes);
router.use('/announcements', protectedTenant, announcementRoutes);

export default router;

