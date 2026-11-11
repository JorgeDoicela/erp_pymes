/**
 * @file modularMonolith.test.js
 * @description Pruebas unitarias para la arquitectura de Monolito Modular y errores de dominio (Fase 3).
 */

import { describe, it, expect } from 'vitest';
import * as modules from '../src/modules/index.js';
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../src/core/errors/appError.js';

describe('Fase 3: Arquitectura de Monolito Modular y Core de Errores', () => {
  describe('Registro Central de Módulos (src/modules/index.js)', () => {
    it('debe exportar los componentes del módulo Accounting', () => {
      expect(modules.accountingRoutes).toBeDefined();
      expect(modules.accountingRepository).toBeDefined();
      expect(modules.accountingController).toBeDefined();
      expect(modules.accountingDto).toBeDefined();
    });

    it('debe exportar los componentes del módulo Payroll', () => {
      expect(modules.payrollRoutes).toBeDefined();
      expect(modules.payrollRepository).toBeDefined();
      expect(modules.payrollController).toBeDefined();
      expect(modules.payrollConfigController).toBeDefined();
      expect(modules.payrollCalculationService).toBeDefined();
      expect(modules.payrollConfigService).toBeDefined();
      expect(modules.payrollDto).toBeDefined();
    });

    it('debe exportar los componentes del módulo Employees', () => {
      expect(modules.employeeRoutes).toBeDefined();
      expect(modules.employeeRepository).toBeDefined();
      expect(modules.employeeController).toBeDefined();
      expect(modules.employeeService).toBeDefined();
      expect(modules.employeeDto).toBeDefined();
      expect(modules.onboardingOffboardingRoutes).toBeDefined();
      expect(modules.assetService).toBeDefined();
      expect(modules.expedientService).toBeDefined();
      expect(modules.offboardingService).toBeDefined();
      expect(modules.onboardingOffboardingController).toBeDefined();
    });

    it('debe exportar los componentes del módulo Attendance', () => {
      expect(modules.attendanceRoutes).toBeDefined();
      expect(modules.shiftRoutes).toBeDefined();
      expect(modules.absenceRoutes).toBeDefined();
      expect(modules.attendanceController).toBeDefined();
      expect(modules.shiftController).toBeDefined();
      expect(modules.absenceController).toBeDefined();
      expect(modules.attendanceService).toBeDefined();
      expect(modules.shiftService).toBeDefined();
      expect(modules.absenceService).toBeDefined();
    });

    it('debe exportar los componentes del módulo Contracts', () => {
      expect(modules.contractRoutes).toBeDefined();
      expect(modules.contractRepository).toBeDefined();
      expect(modules.contractController).toBeDefined();
      expect(modules.contractService).toBeDefined();
    });

    it('debe exportar los componentes del módulo Documents', () => {
      expect(modules.documentRoutes).toBeDefined();
      expect(modules.documentRepository).toBeDefined();
      expect(modules.documentController).toBeDefined();
      expect(modules.documentService).toBeDefined();
    });

    it('debe exportar los componentes del módulo Compliance', () => {
      expect(modules.complianceRoutes).toBeDefined();
      expect(modules.complianceController).toBeDefined();
      expect(modules.complianceService).toBeDefined();
      expect(modules.statutoryBenefitsService).toBeDefined();
    });

    it('debe exportar los componentes del módulo Signatures', () => {
      expect(modules.signatureRoutes).toBeDefined();
      expect(modules.signatureController).toBeDefined();
      expect(modules.qrSignatureService).toBeDefined();
      expect(modules.ecuadorianElectronicSignatureService).toBeDefined();
    });

    it('debe exportar los componentes del módulo Performance', () => {
      expect(modules.evaluationRoutes).toBeDefined();
      expect(modules.goalsRoutes).toBeDefined();
      expect(modules.performanceService).toBeDefined();
    });

    it('debe exportar los componentes del módulo Recruitment', () => {
      expect(modules.recruitmentRoutes).toBeDefined();
      expect(modules.recruitmentController).toBeDefined();
      expect(modules.recruitmentService).toBeDefined();
      expect(modules.recruitmentRepository).toBeDefined();
    });

    it('debe exportar los componentes del módulo Audit', () => {
      expect(modules.auditRoutes).toBeDefined();
      expect(modules.auditController).toBeDefined();
      expect(modules.auditService).toBeDefined();
      expect(modules.auditRepository).toBeDefined();
    });

    it('debe exportar los componentes del módulo Biometrics', () => {
      expect(modules.biometricRoutes).toBeDefined();
      expect(modules.biometricController).toBeDefined();
      expect(modules.biometricService).toBeDefined();
      expect(modules.biometricRepository).toBeDefined();
    });

    it('debe exportar los componentes del módulo Skills', () => {
      expect(modules.skillRoutes).toBeDefined();
      expect(modules.skillController).toBeDefined();
      expect(modules.skillService).toBeDefined();
      expect(modules.skillRepository).toBeDefined();
    });

    it('debe exportar los componentes del módulo Communication', () => {
      expect(modules.announcementRoutes).toBeDefined();
      expect(modules.announcementController).toBeDefined();
      expect(modules.announcementService).toBeDefined();
      expect(modules.announcementRepository).toBeDefined();
    });

    it('debe exportar los componentes del módulo Tenants', () => {
      expect(modules.tenantRoutes).toBeDefined();
      expect(modules.superAdminRoutes).toBeDefined();
      expect(modules.tenantController).toBeDefined();
      expect(modules.superAdminController).toBeDefined();
      expect(modules.seedController).toBeDefined();
      expect(modules.tenantService).toBeDefined();
      expect(modules.superAdminService).toBeDefined();
      expect(modules.tenantRepository).toBeDefined();
    });

    it('debe exportar los componentes del módulo Notifications', () => {
      expect(modules.notificationRoutes).toBeDefined();
      expect(modules.notificationController).toBeDefined();
      expect(modules.notificationPreferencesController).toBeDefined();
      expect(modules.notificationService).toBeDefined();
      expect(modules.notificationRepository).toBeDefined();
      expect(modules.emailService).toBeDefined();
      expect(modules.socketService).toBeDefined();
    });

    it('debe exportar los componentes del módulo Reports', () => {
      expect(modules.reportRoutes).toBeDefined();
      expect(modules.exportRoutes).toBeDefined();
      expect(modules.reportController).toBeDefined();
      expect(modules.exportController).toBeDefined();
      expect(modules.reportService).toBeDefined();
      expect(modules.exportService).toBeDefined();
      expect(modules.reportRepository).toBeDefined();
    });

    it('debe exportar los componentes del módulo Intelligence', () => {
      expect(modules.intelligenceRoutes).toBeDefined();
      expect(modules.analyticsRoutes).toBeDefined();
      expect(modules.entrepreneurshipRoutes).toBeDefined();
      expect(modules.intelligenceController).toBeDefined();
      expect(modules.analyticsController).toBeDefined();
      expect(modules.intelligenceService).toBeDefined();
      expect(modules.analyticsService).toBeDefined();
      expect(modules.rsiService).toBeDefined();
      expect(modules.causalInferenceService).toBeDefined();
      expect(modules.federatedLearningService).toBeDefined();
      expect(modules.ftTransformerService).toBeDefined();
      expect(modules.morlOptimizationService).toBeDefined();
      expect(modules.temporalAttentionService).toBeDefined();
    });

    it('debe exportar los componentes del módulo Auth', () => {
      expect(modules.authRoutes).toBeDefined();
      expect(modules.authController).toBeDefined();
      expect(modules.authService).toBeDefined();
      expect(modules.authRepository).toBeDefined();
    });

    it('debe exportar los componentes del módulo System', () => {
      expect(modules.systemRoutes).toBeDefined();
      expect(modules.systemService).toBeDefined();
    });
  });

  describe('Jerarquía de Errores de Dominio (src/core/errors/appError.js)', () => {
    it('debe instanciar AppError con propiedades operacionales', () => {
      const err = new AppError('Fallo del sistema', 500);
      expect(err).toBeInstanceOf(Error);
      expect(err.statusCode).toBe(500);
      expect(err.isOperational).toBe(true);
    });

    it('debe retornar códigos de estado semánticos en errores especializados', () => {
      expect(new NotFoundError().statusCode).toBe(404);
      expect(new ValidationError().statusCode).toBe(400);
      expect(new UnauthorizedError().statusCode).toBe(401);
      expect(new ForbiddenError().statusCode).toBe(403);
      expect(new ConflictError().statusCode).toBe(409);
    });
  });
});
