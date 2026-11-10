/**
 * @file index.js
 * @description Módulo de Control de Asistencia, Turnos, Ausencias y Geocercas (Vertical Slice Bounded Context).
 * Expone la API pública, routers, controladores, servicios, repositorios y tareas programadas.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import attendanceRoutes from './attendance.routes.js';
import shiftRoutes from './shift.routes.js';
import absenceRoutes from './absence.routes.js';

import attendanceController from './attendance.controller.js';
import shiftController from './shift.controller.js';
import absenceController from './absence.controller.js';

import { attendanceService } from './attendance.service.js';
import { shiftService } from './shift.service.js';
import { absenceService } from './absence.service.js';

import { attendanceRepository } from './attendance.repository.js';
import { shiftRepository } from './shift.repository.js';
import { absenceRepository } from './absence.repository.js';

import { checkRequestReminders, initRequestMonitorCronJob } from './attendance.jobs.js';

export {
  attendanceRoutes,
  shiftRoutes,
  absenceRoutes,
  attendanceController,
  shiftController,
  absenceController,
  attendanceService,
  shiftService,
  absenceService,
  attendanceRepository,
  shiftRepository,
  absenceRepository,
  checkRequestReminders,
  initRequestMonitorCronJob,
};

export default {
  attendanceRoutes,
  shiftRoutes,
  absenceRoutes,
};
