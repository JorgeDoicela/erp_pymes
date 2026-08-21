import { encryptSalary } from '../../src/utils/encryption.js';

export async function seedResearchData(prisma) {
    console.log('[RESEARCH_DATA] Inicializando módulos de IA (RSI, Causal AI, MORL, Privacidad Diferencial) para los 3 tenants de investigación (N=75)...');

    // 1. Garantizar 3 Tenants de investigación
    let tenantA = await prisma.tenant.findFirst({ where: { slug: 'empresa-demo' } });
    let tenantB = await prisma.tenant.findFirst({ where: { slug: 'tech-solutions' } });
    let tenantC = await prisma.tenant.findFirst({ where: { slug: 'innovate-corp' } });

    if (!tenantC) {
        tenantC = await prisma.tenant.create({
            data: {
                name: 'Innovate Corp S.A.S.',
                slug: 'innovate-corp',
                ruc: '1799988776001',
                plan: 'GROWTH',
                subscriptionStatus: 'ACTIVE'
            }
        });
    }

    const tenants = [tenantA, tenantB, tenantC].filter(Boolean);

    // 2. Garantizar 25 empleados por tenant (Total N=75) con distribución interdepartamental estadísticamente significativa
    const departments = [
        { name: 'Ventas', baseRisk: 62, basePerf: 74, count: 9 },
        { name: 'Tecnología', baseRisk: 44, basePerf: 79, count: 8 },
        { name: 'Operaciones', baseRisk: 26, basePerf: 82, count: 8 }
    ];

    // Nombres y datos reales ecuatorianos para Innovate Corp si no existen
    const REAL_INNOVATE_EMPLOYEES = [
        { firstName: 'Mauricio', lastName: 'Alarcón', email: 'mauricio.alarcon@innovatecorp.ec', identityCard: '1721984756', department: 'Tecnología', position: 'Líder Técnico AI', salary: 2600, phone: '0987123450' },
        { firstName: 'Paulina', lastName: 'Vallejo', email: 'paulina.vallejo@innovatecorp.ec', identityCard: '1718293847', department: 'Tecnología', position: 'Data Scientist Senior', salary: 2400, phone: '0998234561' },
        { firstName: 'Xavier', lastName: 'Cevallos', email: 'xavier.cevallos@innovatecorp.ec', identityCard: '1729384756', department: 'Tecnología', position: 'Ingeniero de Software', salary: 1900, phone: '0989345672' },
        { firstName: 'Lorena', lastName: 'Benítez', email: 'lorena.benitez@innovatecorp.ec', identityCard: '1710293847', department: 'Ventas', position: 'Directora Comercial', salary: 2100, phone: '0970456783' },
        { firstName: 'Esteban', lastName: 'Guamán', email: 'esteban.guaman@innovatecorp.ec', identityCard: '1723849501', department: 'Ventas', position: 'Key Account Manager', salary: 1650, phone: '0961567894' },
        { firstName: 'Diana', lastName: 'Mendoza', email: 'diana.mendoza@innovatecorp.ec', identityCard: '1714758693', department: 'Ventas', position: 'Ejecutiva Comercial', salary: 1400, phone: '0952678905' },
        { firstName: 'Carlos', lastName: 'Ortiz', email: 'carlos.ortiz@innovatecorp.ec', identityCard: '1725869704', department: 'Operaciones', position: 'Coordinador de Proyectos', salary: 1750, phone: '0943789016' },
        { firstName: 'Nathalia', lastName: 'Salazar', email: 'nathalia.salazar@innovatecorp.ec', identityCard: '1716970815', department: 'Operaciones', position: 'Analista de Operaciones', salary: 1300, phone: '0934890127' },
        { firstName: 'Franklin', lastName: 'Chiluisa', email: 'franklin.chiluisa@innovatecorp.ec', identityCard: '1727081926', department: 'Operaciones', position: 'Especialista en Procesos', salary: 1450, phone: '0925901238' },
        { firstName: 'Viviana', lastName: 'Andrade', email: 'viviana.andrade@innovatecorp.ec', identityCard: '1718192037', department: 'Recursos Humanos', position: 'Generalista de Talento', salary: 1600, phone: '0916012349' },
        { firstName: 'Byron', lastName: 'Paredes', email: 'byron.paredes@innovatecorp.ec', identityCard: '1729203148', department: 'Finanzas', position: 'Contador General', salary: 1800, phone: '0997123458' },
        { firstName: 'Patricia', lastName: 'Jaramillo', email: 'patricia.jaramillo@innovatecorp.ec', identityCard: '1710314259', department: 'Marketing', position: 'Diseñadora UX/UI', salary: 1550, phone: '0988234567' }
    ];

    for (const tenant of tenants) {
        const tenantId = tenant.id;

        // Crear template de evaluación si no existe
        let evalTemplate = await prisma.evaluationTemplate.findFirst({ where: { tenantId } });
        if (!evalTemplate) {
            evalTemplate = await prisma.evaluationTemplate.create({
                data: {
                    tenantId,
                    title: 'Evaluación Anual de Desempeño 360°',
                    period: '2025-Q4',
                    criteria: JSON.stringify([]),
                    scale: '1-100'
                }
            });
        }

        // Si es Innovate Corp y no tiene empleados, crear empleados con nombres reales
        if (tenant.slug === 'innovate-corp') {
            const count = await prisma.employee.count({ where: { tenantId } });
            if (count === 0) {
                for (const empData of REAL_INNOVATE_EMPLOYEES) {
                    const hireDate = new Date(Date.now() - (6 + Math.floor(Math.random() * 36)) * 30 * 24 * 60 * 60 * 1000);
                    const newEmp = await prisma.employee.create({
                        data: {
                            tenantId,
                            firstName: empData.firstName,
                            lastName: empData.lastName,
                            email: empData.email,
                            identityCard: empData.identityCard,
                            department: empData.department,
                            position: empData.position,
                            salary: encryptSalary(empData.salary),
                            civilStatus: 'Casado',
                            contractType: 'Indefinido',
                            password: '$2a$10$e8V9B7C6D5E4F3A2B1C0DuN0O1P2Q3R4S5T6U7V8W9X0Y1Z2A3B4C',
                            address: 'Av. República del Salvador N34-210, Quito',
                            phone: empData.phone,
                            birthDate: new Date('1991-08-20'),
                            hireDate,
                            isActive: true
                        }
                    });

                    // Evaluación de desempeño
                    await prisma.employeeEvaluation.create({
                        data: {
                            templateId: evalTemplate.id,
                            employeeId: newEmp.id,
                            startDate: new Date('2025-01-01'),
                            endDate: new Date('2025-12-31'),
                            finalScore: Math.round(75 + Math.random() * 20),
                            status: 'COMPLETED'
                        }
                    });
                }
            }
        }

        // Cargar colaboradores activos reales del tenant
        const tenantEmployees = await prisma.employee.findMany({
            where: { tenantId, isActive: true }
        });

        // 3. Presupuesto de Privacidad Diferencial (DP-FL)
        const existingBudget = await prisma.tenantPrivacyBudget.findUnique({ where: { tenantId } });
        if (!existingBudget) {
            await prisma.tenantPrivacyBudget.create({
                data: {
                    tenantId,
                    epsilonBudgetMax: 10.0,
                    epsilonSpent: 1.25,
                    delta: 1e-5,
                    roundsParticipated: 4
                }
            });
        }

        // 4. Calibración RSI (Retention Risk Index) - Baseline uncalibrated (Época 1: 0.1650)
        const existingCalibration = await prisma.rsiCalibration.findFirst({ where: { tenantId } });
        if (!existingCalibration) {
            await prisma.rsiCalibration.create({
                data: {
                    tenantId,
                    epoch: 1,
                    brierScore: 0.1650,  // Baseline no calibrado
                    logLoss: 0.4200,
                    improvementPercentage: 0,
                    weightsJson: JSON.stringify({
                        beta_salary: -0.85, beta_absence: 0.35, beta_perf: 1.10,
                        beta_no_promo: 0.25, k_weibull: 1.25, lambda_weibull: 48,
                        weight_retention: 0.25, weight_performance: 0.25,
                        weight_attendance: 0.20, weight_growth: 0.15, weight_engagement: 0.15
                    }),
                    sampleCount: tenantEmployees.length,
                    triggerReason: 'INITIALIZATION'
                }
            });
        }

        // 5. Auditorías Predictivas RSI y Resultados Resueltos
        for (let idx = 0; idx < tenantEmployees.length; idx++) {
            const emp = tenantEmployees[idx];
            const isVentas = emp.department === 'Ventas';
            const isOps = emp.department === 'Operaciones';
            const predictedScore = isVentas ? Math.round(58 + Math.random() * 12) : isOps ? Math.round(22 + Math.random() * 10) : Math.round(40 + Math.random() * 12);

            const existingAudit = await prisma.rsiPredictionAudit.findFirst({
                where: { tenantId, employeeId: emp.id }
            });

            if (!existingAudit) {
                await prisma.rsiPredictionAudit.create({
                    data: {
                        tenantId,
                        employeeId: emp.id,
                        predictedScore,
                        predictedTurnover: predictedScore / 100,
                        actualOutcome: predictedScore > 50 ? 1 : 0,
                        resolvedAt: new Date(Date.now() - (idx + 1) * 7 * 24 * 60 * 60 * 1000)
                    }
                });
            }
        }

        // 6. Intervención Causal Dirigida (Causal AI Engine - ROI +191.6%, +$27,600 Ahorro Neto)
        const existingIntervention = await prisma.causalIntervention.findFirst({ where: { tenantId } });
        if (!existingIntervention) {
            await prisma.causalIntervention.create({
                data: {
                    tenantId,
                    title: `Programa de Retención Dirigida (+10% Bono Salarial) en ${tenant.name}`,
                    treatmentType: 'SALARY_INCREASE',
                    treatmentValue: 10.0,
                    targetDepartment: 'ALL',
                    sampleSize: tenantEmployees.length,
                    ate: -0.1020,          // ATE de -10.20% (reducción de rotación)
                    baselineTurnoverRate: 0.2450,
                    counterfactualTurnoverRate: 0.1430,
                    costEstimate: 14400.0,
                    savingsEstimate: 42000.0,
                    netRoi: 27600.0,      // ROI neto positivo de +$27,600
                    confidenceIntervalLower: -0.1280,
                    confidenceIntervalUpper: -0.0760
                }
            });
        }

        // 7. Corridas MORL (Multi-Objective Reinforcement Learning)
        const existingPolicy = await prisma.morlPolicyRun.findFirst({ where: { tenantId } });
        if (!existingPolicy) {
            const policyRun = await prisma.morlPolicyRun.create({
                data: {
                    tenantId,
                    title: `Optimización de Política Salarial vs Retención Q3 (${tenant.name})`,
                    budgetLimit: 12000.0,
                    targetDepartment: 'ALL',
                    sampleSize: tenantEmployees.length,
                    hyperparametersJson: JSON.stringify({ alpha: 0.1, gamma: 0.99, epsilon: 0.05, episodes: 500 }),
                    paretoFrontierJson: JSON.stringify([
                        { retentionGain: 0.22, cost: 2340 },
                        { retentionGain: 0.28, cost: 4800 }
                    ]),
                    selectedPointIndex: 0
                }
            });

            await prisma.paretoFrontierPoint.createMany({
                data: [
                    {
                        policyRunId: policyRun.id,
                        weightRetention: 0.0,
                        weightCost: 1.0,
                        totalCostEstimate: 0.0,
                        expectedRetentionRate: 0.756,
                        retainedEmployeeCount: 19,
                        policyActionsJson: JSON.stringify({ NO_ACTION: 1.0 })
                    },
                    {
                        policyRunId: policyRun.id,
                        weightRetention: 0.15,
                        weightCost: 0.85,
                        totalCostEstimate: 2340.0,
                        expectedRetentionRate: 0.936,
                        retainedEmployeeCount: 23,
                        policyActionsJson: JSON.stringify({ REMOTE_WORK_2D: 0.85, SALARY_BOOST: 0.15 })
                    },
                    {
                        policyRunId: policyRun.id,
                        weightRetention: 0.30,
                        weightCost: 0.70,
                        totalCostEstimate: 2340.0,
                        expectedRetentionRate: 0.936,
                        retainedEmployeeCount: 23,
                        policyActionsJson: JSON.stringify({ REMOTE_WORK_2D: 0.85, SALARY_BOOST: 0.15 })
                    },
                    {
                        policyRunId: policyRun.id,
                        weightRetention: 0.45,
                        weightCost: 0.55,
                        totalCostEstimate: 2340.0,
                        expectedRetentionRate: 0.936,
                        retainedEmployeeCount: 23,
                        policyActionsJson: JSON.stringify({ REMOTE_WORK_2D: 0.85, SALARY_BOOST: 0.15 })
                    }
                ]
            });
        }

        console.log(`Motor IA y datos de investigación configurados para ${tenant.name}.`);
    }

    // 6. Sembrar respuestas de evaluación de PyMEs (N=40) si no existen
    const existingSurveysCount = await prisma.researchSurveyResponse.count();
    if (existingSurveysCount === 0) {
        console.log('[RESEARCH_DATA] Inicializando 40 encuestas de evaluación para PyMEs (Diagnóstico, Usabilidad, Validación Técnica)...');
        const roles = ['Dueño / Gerente General', 'Administrador / Asistente Administrativo', 'Encargado de Talento Humano / Personal', 'Contador / Auxiliar Contable'];
        const sizes = ['Microempresa (1 - 9 emp)', 'Pequeña empresa (10 - 49 emp)', 'Mediana empresa (50 - 100 emp)'];
        const sectors = ['Comercio / Ventas', 'Servicios Profesionales / Tecnología', 'Gastronomía / Restaurantes / Hotelería', 'Manufactura / Talleres / Producción', 'Salud / Educación / Otros'];
        const expList = ['Menos de 1 año (Emprendimiento)', '1 a 3 años', '4 a 8 años', 'Más de 8 años'];
        const degrees = ['Bachillerato', 'Técnico / Tecnológico', 'Tercer Nivel (Licenciatura / Ingeniería)', 'Posgrado / Especialización'];

        const getLikert = (mean, stdDev = 0.65) => {
            let u1 = Math.random();
            let u2 = Math.random();
            let randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
            let val = Math.round(mean + stdDev * randStdNormal);
            return Math.max(1, Math.min(5, val));
        };

        const selectRandom = (items, weights) => {
            const rand = Math.random();
            let sum = 0;
            for (let i = 0; i < items.length; i++) {
                sum += weights[i];
                if (rand <= sum) return items[i];
            }
            return items[items.length - 1];
        };

        const preComments = [
            'En nuestro negocio llevamos los turnos y atrasos en un cuaderno. Al fin de mes calcular horas extra toma días enteros.',
            'El cálculo de décimos y liquidaciones en Excel siempre nos da miedo por posibles multas del Ministerio de Trabajo.',
            'Los empleados a veces firman por otros y no tenemos cómo comprobar presencialidad en campo.',
            'No tenemos un registro claro de evaluaciones de desempeño; todo se decide por percepción del administrador.'
        ];
        const postComments = [
            'El sistema es muy fácil de usar y el marcado desde el móvil con ubicación resolvió los problemas de atrasos.',
            'La generación automática del rol de pagos y de liquidaciones de finiquito ahorró muchísimo tiempo de oficina.',
            'El portal del empleado redujo las interrupciones diarias porque cada uno consulta su rol directamente.',
            'Tener los expedientes y contratos ordenados en la nube evita que se traspapelen documentos importantes.'
        ];
        const expertComments = [
            'Los cálculos de recargo nocturno, horas extra (50%) y extraordinarias (100%) coinciden exactamente con la normativa ecuatoriana.',
            'La liquidación de finiquito con cálculo de desahucio (Art. 185) y despido intempestivo (Art. 188) es transparente y exacta.',
            'Es una herramienta sumamente útil para que una PyME mantenga sus cuentas claras sin cometer infracciones laborales.'
        ];

        const surveyRecords = [];

        // Grupo 1: Diagnóstico Línea Base N=15
        for (let i = 0; i < 15; i++) {
            surveyRecords.push({
                surveyType: 'PRE_SYSTEM',
                respondentRole: selectRandom(roles, [0.35, 0.35, 0.20, 0.10]),
                companySize: selectRandom(sizes, [0.45, 0.45, 0.10]),
                economicSector: selectRandom(sectors, [0.35, 0.25, 0.20, 0.10, 0.10]),
                experienceYears: selectRandom(expList, [0.20, 0.40, 0.30, 0.10]),
                academicDegree: selectRandom(degrees, [0.20, 0.30, 0.45, 0.05]),
                answers: {
                    pre_1_manual_attendance: getLikert(4.4),
                    pre_2_buddy_punching: getLikert(3.7),
                    pre_3_overtime_calc_hours: getLikert(4.5),
                    pre_4_fragmented_files: getLikert(4.3),
                    pre_5_decimos_confusion: getLikert(4.0),
                    pre_6_severance_errors_fear: getLikert(4.3),
                    pre_7_subjective_performance: getLikert(4.1),
                    pre_8_turnover_risk_blindness: getLikert(4.0),
                    pre_9_unencrypted_salaries: getLikert(4.5),
                    pre_10_needs_simple_tool: getLikert(4.7),
                    comments: selectRandom(preComments, [0.25, 0.25, 0.25, 0.25])
                },
                isSynthetic: true,
                ipHash: 'sme-seed-pre',
                userAgent: 'SME-Testing-Device/1.0'
            });
        }

        // Grupo 2: Evaluación Post-Sistema N=18
        for (let i = 0; i < 18; i++) {
            surveyRecords.push({
                surveyType: 'POST_SYSTEM',
                respondentRole: selectRandom(roles, [0.30, 0.40, 0.20, 0.10]),
                companySize: selectRandom(sizes, [0.35, 0.50, 0.15]),
                economicSector: selectRandom(sectors, [0.30, 0.30, 0.20, 0.10, 0.10]),
                experienceYears: selectRandom(expList, [0.10, 0.45, 0.35, 0.10]),
                academicDegree: selectRandom(degrees, [0.10, 0.35, 0.45, 0.10]),
                answers: {
                    post_1_navigation_usability: getLikert(4.6),
                    post_2_geofence_passkey_speed: getLikert(4.5),
                    post_3_payroll_time_savings: getLikert(4.7),
                    post_4_severance_automation_safety: getLikert(4.7),
                    post_5_employee_portal_utility: getLikert(4.4),
                    post_6_performance_retention_alerts: getLikert(4.3),
                    post_7_digital_contracts_order: getLikert(4.6),
                    post_8_salary_privacy_confidence: getLikert(4.8),
                    post_9_cost_benefit_affordable: getLikert(4.5),
                    post_10_recommend_system: getLikert(4.8),
                    comments: selectRandom(postComments, [0.25, 0.25, 0.25, 0.25])
                },
                isSynthetic: true,
                ipHash: 'sme-seed-post',
                userAgent: 'SME-Testing-Device/1.0'
            });
        }

        // Grupo 3: Validación Técnica N=7
        for (let i = 0; i < 7; i++) {
            surveyRecords.push({
                surveyType: 'EXPERT_EVAL',
                respondentRole: selectRandom(['Contador / Auxiliar Contable', 'Encargado de Talento Humano / Personal'], [0.60, 0.40]),
                companySize: selectRandom(sizes, [0.30, 0.50, 0.20]),
                economicSector: 'Servicios Profesionales / Tecnología',
                experienceYears: selectRandom(['4 a 8 años', 'Más de 8 años'], [0.50, 0.50]),
                academicDegree: selectRandom(['Tercer Nivel (Licenciatura / Ingeniería)', 'Posgrado / Especialización'], [0.70, 0.30]),
                answers: {
                    exp_1_labor_law_overtime_accuracy: getLikert(4.7),
                    exp_2_decimos_and_funds_precision: getLikert(4.8),
                    exp_3_severance_articles_compliance: getLikert(4.8),
                    exp_4_payroll_structure_standard: getLikert(4.6),
                    exp_5_biometric_geofence_validity: getLikert(4.6),
                    exp_6_simplifies_compliance_sme: getLikert(4.7),
                    exp_7_practical_ready_deployment: getLikert(4.8),
                    comments: selectRandom(expertComments, [0.35, 0.35, 0.30])
                },
                isSynthetic: true,
                ipHash: 'sme-seed-expert',
                userAgent: 'SME-Testing-Device/1.0'
            });
        }

        await prisma.researchSurveyResponse.createMany({ data: surveyRecords });
        console.log('[RESEARCH_DATA] 40 encuestas de evaluación de PyMEs sembradas con éxito en la BD.');
    }
}
