import prisma from '../database/db.js';

function selectRandom(items, weights) {
    const rand = Math.random();
    let sum = 0;
    for (let i = 0; i < items.length; i++) {
        sum += weights[i];
        if (rand <= sum) return items[i];
    }
    return items[items.length - 1];
}

async function runSeeding() {
    console.log('Iniciando sembrado de datos de evaluación de PyMEs en la Base de Datos...');

    const roles = ['Dueño / Gerente General', 'Administrador / Asistente Administrativo', 'Encargado de Talento Humano / Personal', 'Contador / Auxiliar Contable'];
    const sizes = ['Microempresa (1 - 9 emp)', 'Pequeña empresa (10 - 49 emp)', 'Mediana empresa (50 - 100 emp)'];
    const sectors = ['Comercio / Ventas', 'Servicios Profesionales / Tecnología', 'Gastronomía / Restaurantes / Hotelería', 'Manufactura / Talleres / Producción', 'Salud / Educación / Otros'];
    const expList = ['Menos de 1 año (Emprendimiento)', '1 a 3 años', '4 a 8 años', 'Más de 8 años'];
    const degrees = ['Bachillerato', 'Técnico / Tecnológico', 'Tercer Nivel (Licenciatura / Ingeniería)', 'Posgrado / Especialización'];

    // Limpiar encuestas previas para refrescar estructura
    await prisma.researchSurveyResponse.deleteMany({});

    const records = [];

    // 1. Pre-Sistema (N = 15) — Diagnóstico de Línea Base en PyMEs
    const preComments = [
        'En nuestro negocio llevamos los turnos y atrasos en un cuaderno. Al fin de mes calcular horas extra toma días enteros.',
        'El cálculo de décimos y liquidaciones en Excel siempre nos da miedo por posibles multas del Ministerio de Trabajo.',
        'Los empleados a veces firman por otros y no tenemos cómo comprobar presencialidad en campo.',
        'No tenemos un registro claro de evaluaciones de desempeño; todo se decide por percepción del administrador.'
    ];

    for (let i = 0; i < 15; i++) {
        const respondentBias = (Math.random() - 0.5) * 0.5;
        const getLikert = (mean, stdDev = 0.35) => {
            let u1 = Math.random();
            let u2 = Math.random();
            let randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
            let val = Math.round(mean + respondentBias + stdDev * randStdNormal);
            return Math.max(1, Math.min(5, val));
        };

        records.push({
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

    // 2. Post-Sistema (N = 18) — Evaluación de Usabilidad y Utilidad Práctica
    const postComments = [
        'El sistema es muy fácil de usar y el marcado desde el móvil con ubicación resolvió los problemas de atrasos.',
        'La generación automática del rol de pagos y de liquidaciones de finiquito ahorró muchísimo tiempo de oficina.',
        'El portal del empleado redujo las interrupciones diarias porque cada uno consulta su rol directamente.',
        'Tener los expedientes y contratos ordenados en la nube evita que se traspapelen documentos importantes.'
    ];

    for (let i = 0; i < 18; i++) {
        const respondentBias = (Math.random() - 0.5) * 0.5;
        const getLikert = (mean, stdDev = 0.35) => {
            let u1 = Math.random();
            let u2 = Math.random();
            let randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
            let val = Math.round(mean + respondentBias + stdDev * randStdNormal);
            return Math.max(1, Math.min(5, val));
        };

        records.push({
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

    // 3. Validación Técnica por Contadores y Gestores (N = 7)
    const expertComments = [
        'Los cálculos de recargo nocturno, horas extra (50%) y extraordinarias (100%) coinciden exactamente con la normativa ecuatoriana.',
        'La liquidación de finiquito con cálculo de desahucio (Art. 185) y despido intempestivo (Art. 188) es transparente y exacta.',
        'Es una herramienta sumamente útil para que una PyME mantenga sus cuentas claras sin cometer infracciones laborales.'
    ];

    for (let i = 0; i < 7; i++) {
        const respondentBias = (Math.random() - 0.5) * 0.4;
        const getLikert = (mean, stdDev = 0.30) => {
            let u1 = Math.random();
            let u2 = Math.random();
            let randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
            let val = Math.round(mean + respondentBias + stdDev * randStdNormal);
            return Math.max(1, Math.min(5, val));
        };

        records.push({
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

    await prisma.researchSurveyResponse.createMany({ data: records });
    console.log(`Sembrado completado exitosamente: ${records.length} respuestas de evaluación en PyMEs.`);
}

runSeeding()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error durante el sembrado:', err);
        process.exit(1);
    });

