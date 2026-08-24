import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getResearchResults, submitSurveyResponse, seedSyntheticResponses } from '../src/services/researchService.js';
import prisma from '../src/database/db.js';

vi.mock('../src/database/db.js', () => ({
    default: {
        researchSurveyResponse: {
            findMany: vi.fn(),
            create: vi.fn(),
            createMany: vi.fn()
        }
    }
}));

describe('Research & Empirical Psychometric Service Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Should process survey response and calculate Likert aggregates and Cronbach Alpha correctly', async () => {
        const mockResponses = [
            {
                id: 'resp_1',
                surveyType: 'POST_SYSTEM',
                respondentRole: 'Dueño / Gerente General',
                companySize: 'Microempresa (1 - 9 emp)',
                economicSector: 'Comercio / Ventas',
                answers: {
                    post_1_navigation_usability: 5,
                    post_2_geofence_passkey_speed: 5,
                    post_3_payroll_time_savings: 5,
                    post_4_severance_automation_safety: 5
                },
                isSynthetic: false,
                createdAt: new Date()
            },
            {
                id: 'resp_2',
                surveyType: 'POST_SYSTEM',
                respondentRole: 'Contador / Auxiliar Contable',
                companySize: 'Pequeña empresa (10 - 49 emp)',
                economicSector: 'Servicios Profesionales / Tecnología',
                answers: {
                    post_1_navigation_usability: 4,
                    post_2_geofence_passkey_speed: 4,
                    post_3_payroll_time_savings: 4,
                    post_4_severance_automation_safety: 4
                },
                isSynthetic: false,
                createdAt: new Date()
            },
            {
                id: 'resp_3',
                surveyType: 'POST_SYSTEM',
                respondentRole: 'Encargado de Talento Humano / Personal',
                companySize: 'Pequeña empresa (10 - 49 emp)',
                economicSector: 'Comercio / Ventas',
                answers: {
                    post_1_navigation_usability: 3,
                    post_2_geofence_passkey_speed: 3,
                    post_3_payroll_time_savings: 3,
                    post_4_severance_automation_safety: 3
                },
                isSynthetic: false,
                createdAt: new Date()
            }
        ];

        prisma.researchSurveyResponse.findMany.mockResolvedValue(mockResponses);

        const results = await getResearchResults({ surveyType: 'POST_SYSTEM' });

        expect(results).toBeDefined();
        expect(results.summary.postCount).toBe(3);
        expect(results.cronbachAlpha.post).toBeDefined();
        expect(results.cronbachAlpha.post.alpha).toBeGreaterThanOrEqual(0.70);
        expect(results.postLikertStats.post_1_navigation_usability.average).toBe(4.00);
        expect(results.postLikertStats.post_1_navigation_usability.agreePercent).toBe(66.7);
    });

    it('Should reject empty required fields when submitting a survey response', async () => {
        await expect(submitSurveyResponse({
            surveyType: 'POST_SYSTEM',
            respondentRole: '',
            companySize: 'Microempresa'
        })).rejects.toThrow('Faltan campos obligatorios en el formulario de encuesta.');
    });
});
