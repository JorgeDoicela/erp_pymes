/**
 * @file onboardingOffboarding.routes.js
 * @description Rutas HTTP para Expediente Digital, Entrega/Devolución de Activos y Salida/Liquidación (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import {
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
} from './onboardingOffboarding.controller.js';
import { authenticate, authorize } from '../../auth/auth.middleware.js';

const router = Router();

// --- Expediente Digital ---
router.get(
  '/expedients/summary',
  authenticate,
  authorize(['admin', 'hr', 'superadmin', 'accounting']),
  getAllExpedientsSummary
);

router.get('/expedients/my', authenticate, getEmployeeExpedient);

router.get(
  '/expedients/:id',
  authenticate,
  authorize(['admin', 'hr', 'superadmin']),
  getEmployeeExpedient
);

router.post(
  '/expedients/upload',
  authenticate,
  authorize(['admin', 'hr', 'employee', 'superadmin']),
  uploadExpedientDocument
);

router.patch(
  '/expedients/documents/:id/verify',
  authenticate,
  authorize(['admin', 'hr', 'superadmin']),
  verifyExpedientDocument
);

router.delete(
  '/expedients/documents/:id',
  authenticate,
  authorize(['admin', 'hr', 'employee', 'superadmin']),
  deleteExpedientDocument
);

// --- Activos y Equipos (EPPs) ---
router.get('/assets', authenticate, authorize(['admin', 'hr', 'superadmin']), getAllAssets);

router.get('/assets/my', authenticate, getEmployeeAssets);

router.get(
  '/assets/employee/:employeeId',
  authenticate,
  authorize(['admin', 'hr', 'superadmin']),
  getEmployeeAssets
);

router.post('/assets', authenticate, authorize(['admin', 'hr', 'superadmin']), deliverAsset);

router.put('/assets/:id', authenticate, authorize(['admin', 'hr', 'superadmin']), updateAsset);

router.patch(
  '/assets/:id/return',
  authenticate,
  authorize(['admin', 'hr', 'superadmin']),
  returnAsset
);

router.delete('/assets/:id', authenticate, authorize(['admin', 'hr', 'superadmin']), deleteAsset);

// --- Offboarding & Liquidación Legal Ecuador ---
router.post(
  '/offboarding/simulate',
  authenticate,
  authorize(['admin', 'hr', 'superadmin']),
  simulateSettlement
);
router.post(
  '/offboarding/start',
  authenticate,
  authorize(['admin', 'hr', 'superadmin']),
  startOffboarding
);
router.put(
  '/offboarding/:id/checklist',
  authenticate,
  authorize(['admin', 'hr', 'superadmin']),
  updateChecklistStep
);
router.patch(
  '/offboarding/:id/step',
  authenticate,
  authorize(['admin', 'hr', 'superadmin']),
  updateChecklistStep
);
router.get('/offboarding', authenticate, authorize(['admin', 'hr', 'superadmin']), getOffboardings);

export default router;
