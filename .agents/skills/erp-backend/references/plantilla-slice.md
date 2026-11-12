# Plantilla de Slice Backend

Ejemplo para un recurso `overtime-requests` dentro del dominio compuesto `attendance` (slice `overtime`). Sustituir nombres.

---

## `attendance/overtime/overtime.dto.js`

```js
/**
 * @file overtime.dto.js
 * @description Esquemas Zod de entrada para solicitudes de horas extra.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { z } from 'zod';

export const OVERTIME_TYPES = Object.freeze(['SUPPLEMENTARY_50', 'EXTRAORDINARY_100']);
export const OVERTIME_STATUSES = Object.freeze(['PENDING', 'APPROVED', 'REJECTED']);

export const createOvertimeDto = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato YYYY-MM-DD'),
  hours: z.coerce.number().positive().max(12, 'Máximo 12 horas por día'),
  type: z.enum(OVERTIME_TYPES),
  reason: z.string().trim().min(5).max(500),
});

export const listOvertimeQueryDto = z.object({
  status: z.enum(OVERTIME_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamsDto = z.object({ id: z.string().min(1) });
```

## `attendance/overtime/overtime.repository.js`

```js
import prisma from '../../../database/db.js';

const OVERTIME_SELECT = Object.freeze({
  id: true,
  date: true,
  hours: true,
  type: true,
  status: true,
  employee: { select: { id: true, firstName: true, lastName: true } },
});

export class OvertimeRepository {
  async create(data) {
    return prisma.overtimeRequest.create({ data, select: OVERTIME_SELECT });
  }

  async findPage({ tenantId, status, page, limit }) {
    const where = { employee: { tenantId }, ...(status ? { status } : {}) };
    const [items, total] = await prisma.$transaction([
      prisma.overtimeRequest.findMany({
        where,
        select: OVERTIME_SELECT,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.overtimeRequest.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id, tenantId) {
    return prisma.overtimeRequest.findFirst({ where: { id, employee: { tenantId } }, select: OVERTIME_SELECT });
  }
}

export default new OvertimeRepository();
```

## `attendance/overtime/overtime.service.js`

```js
import defaultRepo from './overtime.repository.js';
import { employeeRepository as defaultEmployeeRepo } from '../../employees/index.js';
import { NotFoundError } from '../../../core/errors/appError.js';

export class OvertimeService {
  constructor({ overtimeRepo = defaultRepo, employeeRepo = defaultEmployeeRepo } = {}) {
    this.overtimeRepo = overtimeRepo;
    this.employeeRepo = employeeRepo;
  }

  /** @param {{ tenantId: string, employeeId: string, input: object }} params */
  async request({ tenantId, employeeId, input }) {
    const employee = await this.employeeRepo.findById(employeeId, tenantId);
    if (!employee) throw new NotFoundError('Empleado no encontrado');
    return this.overtimeRepo.create({ ...input, date: new Date(`${input.date}T12:00:00Z`), employeeId });
  }

  /** @param {{ tenantId: string, status?: string, page: number, limit: number }} params */
  async list(params) {
    const { items, total } = await this.overtimeRepo.findPage(params);
    return { items, meta: { page: params.page, limit: params.limit, total } };
  }
}

export default new OvertimeService();
```

## `attendance/overtime/overtime.controller.js`

```js
import overtimeService from './overtime.service.js';
import { asyncHandler } from '../../../core/utils/asyncHandler.js';

export const requestOvertime = asyncHandler(async (req, res) => {
  const data = await overtimeService.request({
    tenantId: req.tenantId,
    employeeId: req.user.employeeId || req.user.id,
    input: req.body,
  });
  res.status(201).json({ success: true, data });
});

export const listOvertime = asyncHandler(async (req, res) => {
  const { items, meta } = await overtimeService.list({ tenantId: req.tenantId, ...req.query });
  res.status(200).json({ success: true, data: items, meta });
});
```

## `attendance/overtime/overtime.routes.js`

```js
import { Router } from 'express';
import { authenticate, authorize } from '../../auth/auth.middleware.js';
import { requireTenant } from '../../tenants/organization/tenant.middleware.js';
import { validate } from '../../../core/middleware/validate.middleware.js';
import { ROLES } from '../../../config/roles.js';
import { createOvertimeDto, listOvertimeQueryDto } from './overtime.dto.js';
import * as overtimeController from './overtime.controller.js';

const router = Router();
router.use(authenticate, requireTenant);

router.post('/', validate(createOvertimeDto), overtimeController.requestOvertime);
router.get(
  '/',
  authorize([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]),
  validate({ query: listOvertimeQueryDto }),
  overtimeController.listOvertime
);

export default router;
```

## `attendance/index.js` (agregar al contrato público)

```js
import overtimeRoutes from './overtime/overtime.routes.js';
import overtimeService, { OvertimeService } from './overtime/overtime.service.js';
export { overtimeRoutes, overtimeService, OvertimeService };
```

## `backend/tests/modules/attendance/overtimeService.test.js`

```js
import { describe, it, expect, vi } from 'vitest';
import { OvertimeService } from '../../../src/modules/attendance/overtime/overtime.service.js';
import { NotFoundError } from '../../../src/core/errors/appError.js';

describe('OvertimeService', () => {
  it('rechaza solicitudes de empleados de otro tenant', async () => {
    const service = new OvertimeService({
      overtimeRepo: { create: vi.fn() },
      employeeRepo: { findById: vi.fn().mockResolvedValue(null) },
    });
    await expect(
      service.request({ tenantId: 't1', employeeId: 'e9', input: { date: '2026-11-12', hours: 2 } })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
```

