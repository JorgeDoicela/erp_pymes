import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recruitmentService } from '../../../src/modules/recruitment/recruitment.service.js';
import recruitmentRepository from '../../../src/modules/recruitment/recruitment.repository.js';

const { mockRecruitmentRepo, mockTenantRepo, mockEmailService } = vi.hoisted(() => ({
  mockRecruitmentRepo: {
    createVacancy: vi.fn(),
    getVacancies: vi.fn(),
    getVacancyById: vi.fn(),
    updateVacancy: vi.fn(),
    deleteVacancy: vi.fn(),
    createApplication: vi.fn(),
    getApplications: vi.fn(),
    getApplicationById: vi.fn(),
    updateApplication: vi.fn(),
    deleteApplication: vi.fn(),
    createNote: vi.fn(),
    createInterview: vi.fn(),
    getInterviewById: vi.fn(),
    updateInterview: vi.fn(),
    findTenantInterviewers: vi.fn(),
    findEmployeeByEmailOrIdentity: vi.fn(),
    createEvaluation: vi.fn(),
    executeTransaction: vi.fn(),
  },
  mockTenantRepo: {
    findPublicActiveTenants: vi.fn(),
    findTenantBySlug: vi.fn(),
  },
  mockEmailService: {
    sendApplicationReceivedEmail: vi.fn().mockResolvedValue({}),
    sendInterviewScheduledEmail: vi.fn().mockResolvedValue({}),
    sendInterviewCancelledEmail: vi.fn().mockResolvedValue({}),
    sendHiringEmail: vi.fn().mockResolvedValue({}),
    sendRejectionEmail: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../../src/modules/recruitment/recruitmentEmail.service.js', () => ({
  default: mockEmailService,
  recruitmentEmailService: mockEmailService,
}));

vi.mock('../../../src/modules/tenants/index.js', () => ({
  tenantRepository: mockTenantRepo,
}));

vi.mock('../../../src/modules/recruitment/recruitment.repository.js', () => ({
  recruitmentRepository: mockRecruitmentRepo,
  default: mockRecruitmentRepo,
}));

vi.mock('../../../src/modules/recruitment/recruitment.repository.js', () => ({
  recruitmentRepository: mockRecruitmentRepo,
  default: mockRecruitmentRepo,
}));
vi.mock('../../../src/modules/audit/audit.repository.js', () => ({
  default: {
    createLog: vi.fn().mockResolvedValue({}),
    log: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('../../../src/database/db.js', () => ({
  default: {
    tenant: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Recruitment Multi-Tenant Isolation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Should filter vacancies strictly by tenantId when provided', async () => {
    recruitmentRepository.getVacancies.mockResolvedValue([
      { id: 'vac-1', title: 'Developer', tenantId: 'tenant-A' },
    ]);

    const result = await recruitmentService.getVacancies('tenant-A');

    expect(recruitmentRepository.getVacancies).toHaveBeenCalledWith(
      { tenantId: 'tenant-A' },
      expect.any(Object)
    );
    expect(result).toHaveLength(1);
  });

  it('Should reject access if vacancy belongs to a different tenantId', async () => {
    recruitmentRepository.getVacancyById.mockResolvedValue({
      id: 'vac-2',
      title: 'Designer',
      tenantId: 'tenant-B',
    });

    await expect(recruitmentService.getVacancyById('vac-2', 'tenant-A')).rejects.toThrow(
      'Acceso denegado: La vacante no pertenece a la empresa activa.'
    );
  });

  it('Should assign tenantId to new Employee when candidate is hired', async () => {
    const mockApplication = {
      id: 'app-100',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      phone: '0999999999',
      vacancyId: 'vac-10',
      vacancy: {
        title: 'Backend Engineer',
        department: 'Tech',
        tenantId: 'tenant-CORP',
      },
    };

    recruitmentRepository.getApplicationById.mockResolvedValue(mockApplication);
    recruitmentRepository.executeTransaction.mockImplementation(async (callback) => {
      const mockTx = {
        jobApplication: { update: vi.fn().mockResolvedValue({}) },
        employee: {
          create: vi
            .fn()
            .mockImplementation(({ data }) => Promise.resolve({ id: 'emp-100', ...data })),
        },
        contract: { create: vi.fn().mockResolvedValue({}) },
        jobVacancy: { update: vi.fn().mockResolvedValue({}) },
      };
      return callback(mockTx);
    });

    const hireData = {
      identityCard: '1712345678',
      birthDate: '1995-05-15',
      address: 'Av. Siempre Viva 123',
      civilStatus: 'Soltero',
      contractType: 'Indefinido',
      salary: '2000',
      startDate: '2026-09-01',
      password: 'Password123!',
      sendEmail: false,
    };

    const createdEmployee = await recruitmentService.hireCandidate(
      'app-100',
      hireData,
      'tenant-CORP'
    );

    expect(createdEmployee).toBeDefined();
    expect(createdEmployee.tenantId).toBe('tenant-CORP');
  });

  it('Should list public active companies ordered by open vacancies count and name', async () => {
    mockTenantRepo.findPublicActiveTenants.mockResolvedValue([
      { id: 't-1', name: 'Beta Corp', slug: 'beta-corp', _count: { jobVacancies: 1 } },
      { id: 't-2', name: 'Alfa S.A.', slug: 'alfa-sa', _count: { jobVacancies: 3 } },
      { id: 't-3', name: 'Gamma Ltda', slug: 'gamma-ltda', _count: { jobVacancies: 0 } },
    ]);

    const companies = await recruitmentService.getPublicCompanies();

    expect(companies).toEqual([
      { id: 't-2', name: 'Alfa S.A.', slug: 'alfa-sa', openVacanciesCount: 3 },
      { id: 't-1', name: 'Beta Corp', slug: 'beta-corp', openVacanciesCount: 1 },
      { id: 't-3', name: 'Gamma Ltda', slug: 'gamma-ltda', openVacanciesCount: 0 },
    ]);
  });

  it('Should return empty array when companySlug does not match any tenant', async () => {
    mockTenantRepo.findTenantBySlug.mockResolvedValue(null);

    const vacancies = await recruitmentService.getPublicVacancies({ companySlug: 'inexistente' });

    expect(vacancies).toEqual([]);
    expect(recruitmentRepository.getVacancies).not.toHaveBeenCalled();
  });

  it('Should schedule a virtual or presential interview and send email notification', async () => {
    recruitmentRepository.getApplicationById.mockResolvedValue({
      id: 'app-10',
      firstName: 'Ana',
      lastName: 'Gómez',
      email: 'ana@example.com',
      status: 'PENDING',
      vacancy: { title: 'Contadora', tenantId: 'tenant-A', tenant: { name: 'Acme S.A.' } },
    });
    recruitmentRepository.executeTransaction.mockImplementation(async (cb) => {
      const tx = {
        interview: {
          create: vi.fn().mockResolvedValue({
            id: 'int-1',
            type: 'VIRTUAL',
            location: 'https://meet.google.com/abc',
            date: new Date('2026-11-20T15:00:00Z'),
            interviewer: { firstName: 'Carlos', lastName: 'Ruiz' },
          }),
        },
        jobApplication: { update: vi.fn().mockResolvedValue({}) },
      };
      return cb(tx);
    });

    const result = await recruitmentService.scheduleInterview(
      'app-10',
      {
        date: '2026-11-20T15:00:00Z',
        type: 'VIRTUAL',
        location: 'https://meet.google.com/abc',
        sendEmail: true,
      },
      'emp-1',
      'tenant-A'
    );

    expect(result.id).toBe('int-1');
    expect(mockEmailService.sendInterviewScheduledEmail).toHaveBeenCalledTimes(1);
  });

  it('Should block cancelling an interview from another tenant', async () => {
    recruitmentRepository.getInterviewById.mockResolvedValue({
      id: 'int-99',
      date: new Date(),
      application: { vacancy: { tenantId: 'tenant-B' } },
    });

    await expect(
      recruitmentService.updateInterviewStatus('int-99', 'CANCELLED', 'tenant-A')
    ).rejects.toThrow('Acceso denegado');
  });

  it('Should prevent hiring if an employee with the same email or identityCard already exists', async () => {
    recruitmentRepository.getApplicationById.mockResolvedValue({
      id: 'app-dup',
      email: 'dup@example.com',
      vacancy: { tenantId: 'tenant-A' },
    });
    recruitmentRepository.findEmployeeByEmailOrIdentity.mockResolvedValue({ id: 'emp-existing' });

    await expect(
      recruitmentService.hireCandidate(
        'app-dup',
        {
          identityCard: '1712345678',
          birthDate: '1990-01-01',
          salary: '1000',
          startDate: '2026-11-15',
          password: 'Password123!',
        },
        'tenant-A'
      )
    ).rejects.toThrow('Ya existe un colaborador registrado');
  });
});
