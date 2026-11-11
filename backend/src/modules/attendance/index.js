/**
 * @file index.js
 * @description Módulo de Control de Asistencia, Turnos, Ausencias y Geocercas (Pure Nested Vertical Slices).
 * Expone la API pública, routers, controladores, servicios, repositorios y tareas programadas.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import attendanceRoutes from './tracking/attendance.routes.js';
import shiftRoutes from './shifts/shift.routes.js';
import absenceRoutes from './absences/absence.routes.js';

import attendanceController from './tracking/attendance.controller.js';
import shiftController from './shifts/shift.controller.js';
import absenceController from './absences/absence.controller.js';

import { attendanceService } from './tracking/attendance.service.js';
import { shiftService } from './shifts/shift.service.js';
import { absenceService } from './absences/absence.service.js';

import { attendanceRepository } from './tracking/attendance.repository.js';
import { shiftRepository } from './shifts/shift.repository.js';
import { absenceRepository } from './absences/absence.repository.js';

import { checkRequestReminders, initRequestMonitorCronJob } from './tracking/attendance.jobs.js';

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
