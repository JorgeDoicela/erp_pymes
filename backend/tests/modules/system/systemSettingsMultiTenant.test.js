import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SystemService } from '../../../src/modules/system/system.service.js';

const { mockSystemRepo } = vi.hoisted(() => ({
  mockSystemRepo: {
    findByTenantId: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    upsertDefault: vi.fn(),
    upsertById: vi.fn(),
  },
}));

vi.mock('../../../src/modules/system/system.repository.js', () => ({
  systemRepository: mockSystemRepo,
  default: mockSystemRepo,
}));

describe('SystemService — Aislamiento Multi-Tenant y Control de IPs', () => {
  let service;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SystemService();
  });

  it('no debe filtrar configuración de otro tenant cuando el tenant activo aún no tiene SystemSetting', async () => {
    mockSystemRepo.findByTenantId.mockResolvedValue(null);
    mockSystemRepo.create.mockImplementation(async (data) => ({ id: 'set-B', ...data }));

    const result = await service.getSettings('tenant-B');

    expect(mockSystemRepo.findFirst).not.toHaveBeenCalled();
    expect(mockSystemRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-B',
        ipRestrictionEnabled: false,
        allowedIPs: null,
      })
    );
    expect(result.tenantId).toBe('tenant-B');
  });

  it('impide activar restricción por IP si no hay ninguna IP o rango CIDR configurado', async () => {
    mockSystemRepo.findByTenantId.mockResolvedValue({
      id: 'set-A',
      tenantId: 'tenant-A',
      ipRestrictionEnabled: false,
      allowedIPs: null,
    });

    await expect(
      service.updateSettings({ ipRestrictionEnabled: true, allowedIPs: '' }, 'tenant-A')
    ).rejects.toThrow('Debe registrar al menos una dirección IP o rango CIDR válido');
  });

  it('permite desactivar la restricción por IP conservando la lista de IPs guardada', async () => {
    mockSystemRepo.findByTenantId.mockResolvedValue({
      id: 'set-A',
      tenantId: 'tenant-A',
      ipRestrictionEnabled: true,
      allowedIPs: '192.168.1.0/24',
    });
    mockSystemRepo.updateById.mockImplementation(async (_id, data) => ({
      id: 'set-A',
      tenantId: 'tenant-A',
      ...data,
    }));

    const updated = await service.updateSettings(
      { ipRestrictionEnabled: false, allowedIPs: '192.168.1.0/24' },
      'tenant-A'
    );

    expect(updated.ipRestrictionEnabled).toBe(false);
    expect(updated.allowedIPs).toBe('192.168.1.0/24');
  });
});
