import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const { mockGetSettings, mockFindActiveAdmins } = vi.hoisted(() => ({
  mockGetSettings: vi.fn(),
  mockFindActiveAdmins: vi.fn(),
}));

vi.mock('../../../src/modules/system/system.service.js', () => ({
  default: { getSettings: mockGetSettings },
  systemService: { getSettings: mockGetSettings },
}));

vi.mock('../../../src/database/db.js', () => ({
  default: {
    employee: { findMany: mockFindActiveAdmins },
  },
}));

import { maintenanceMiddleware } from '../../../src/modules/system/maintenance.middleware.js';
import { NotificationRepository } from '../../../src/modules/notifications/alerts/notification.repository.js';

describe('Multi-Tenant Isolation Audit Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maintenanceMiddleware consulta settings aislados por tenantId del JWT', async () => {
    const secret = process.env.JWT_SECRET || 'secret_key_change_me';
    const tokenTenantB = jwt.sign({ id: 'emp-b', role: 'employee', tenantId: 'tenant-B' }, secret);

    mockGetSettings.mockImplementation(async (tenantId) => ({
      maintenanceMode: tenantId === 'tenant-A',
      maintenanceMessage: 'Mantenimiento Tenant A',
    }));

    const req = {
      path: '/api/employees',
      headers: { authorization: `Bearer ${tokenTenantB}` },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await maintenanceMiddleware(req, res, next);

    expect(mockGetSettings).toHaveBeenCalledWith('tenant-B');
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('maintenanceMiddleware bloquea únicamente al tenant que activó mantenimiento', async () => {
    const secret = process.env.JWT_SECRET || 'secret_key_change_me';
    const tokenTenantA = jwt.sign({ id: 'emp-a', role: 'employee', tenantId: 'tenant-A' }, secret);

    mockGetSettings.mockResolvedValue({
      maintenanceMode: true,
      maintenanceMessage: 'Mantenimiento Tenant A',
    });

    const req = {
      path: '/api/employees',
      headers: { authorization: `Bearer ${tokenTenantA}` },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await maintenanceMiddleware(req, res, next);

    expect(mockGetSettings).toHaveBeenCalledWith('tenant-A');
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('NotificationRepository.findActiveAdmins retorna [] si no recibe tenantId', async () => {
    const repo = new NotificationRepository();
    const result = await repo.findActiveAdmins(null);

    expect(result).toEqual([]);
    expect(mockFindActiveAdmins).not.toHaveBeenCalled();
  });
});
