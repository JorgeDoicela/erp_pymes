import prisma from '../database/db.js';

function getLikert(mean, stdDev = 0.7) {
    let u1 = Math.random();
    let u2 = Math.random();
    let randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    let val = Math.round(mean + stdDev * randStdNormal);
    return Math.max(1, Math.min(5, val));
}

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
    console.log('Iniciando sembrado estocástico de datos de investigación en Neon DB...');

    const roles = ['Gerente General / Dueño', 'Director / Jefe de RRHH', 'Contador / Administrador Financiero', 'Analista de Personal / Operaciones'];
    const sizes = ['Microempresa (1 - 9 emp)', 'Pequeña empresa (10 - 49 emp)', 'Mediana empresa (50 - 199 emp)', 'Empresa grande (> 200 emp)'];
    const sectors = ['Tecnología / Servicios Profesionales', 'Comercio / Distribución', 'Manufactura / Producción', 'Salud / Educación', 'Servicios Financieros'];
    const expList = ['< 2 años', '2 - 5 años', '6 - 10 años', '> 10 años'];

    const records = [];

    // 1. Pre-Sistema (N = 25) — Diagnóstico de Línea Base
    const preComments = [
        'El cálculo de liquidaciones y proporcional del 13ro/14to en Excel siempre nos generaba dudas legales.',
        'La marcación en papel facilitaba atrasos no justificados en el personal de ventas externas.',
        'No teníamos una forma objetiva de medir el desempeño más allá de la opinión directa del supervisor.',
        'El almacenamiento de salarios en hojas de cálculo compartidas en red local era un riesgo constante.'
    ];

    for (let i = 0; i < 25; i++) {
        const role = selectRandom(roles, [0.30, 0.35, 0.20, 0.15]);
        const size = selectRandom(sizes, [0.35, 0.45, 0.15, 0.05]);
        const sector = selectRandom(sectors, [0.30, 0.30, 0.20, 0.10, 0.10]);
        const exp = selectRandom(expList, [0.20, 0.40, 0.30, 0.10]);

        const answers = {
            pre_6_manual_attendance: getLikert(4.3),
            pre_7_buddy_punching: getLikert(3.5),
            pre_8_field_tracking_diff: getLikert(4.1),
            pre_9_overtime_calc_hours: getLikert(4.4),
            pre_10_fragmented_files: getLikert(4.2),
            pre_11_subjective_performance: getLikert(3.9),
            pre_12_lacks_5d_metric: getLikert(4.3),
            pre_13_turnover_risk_blindness: getLikert(4.0),
            pre_18_manual_severance_errors: getLikert(4.1),
            pre_20_unencrypted_salaries: getLikert(4.5),
            comments: selectRandom(preComments, [0.25, 0.25, 0.25, 0.25])
        };

        records.push({
            surveyType: 'PRE_SYSTEM',
            respondentRole: role,
            companySize: size,
            economicSector: sector,
            experienceYears: exp,
            academicDegree: 'Licenciatura / Ingeniería',
            answers,
            isSynthetic: true,
            ipHash: 'seed-calibration',
            userAgent: 'Research-Seeder/1.0'
        });
    }

    // 2. Post-Sistema UAT (N = 35) — Evaluación de Usabilidad e Impacto
    const postComments = [
        'La automatización del finiquito según la ley ecuatoriana redujo drásticamente el tiempo de revisión.',
        'El marcado con geocerca Haversine funciona muy bien; al inicio requirió ajustar el radio de cobertura.',
        'El Scoring 5D ayuda a justificar aumentos salariales con datos reales frente a la gerencia.',
        'El simulador causal es muy útil aunque requiere cierta curva de aprendizaje para interpretar los contrafactuales.'
    ];

    for (let i = 0; i < 35; i++) {
        const role = selectRandom(roles, [0.25, 0.45, 0.15, 0.15]);
        const size = selectRandom(sizes, [0.25, 0.50, 0.20, 0.05]);
        const sector = selectRandom(sectors, [0.40, 0.20, 0.20, 0.10, 0.10]);
        const exp = selectRandom(expList, [0.10, 0.40, 0.40, 0.10]);

        const answers = {
            post_1_navigation_usability: getLikert(4.5),
            post_2_5d_score_clarity: getLikert(4.6),
            post_3_geofence_passkey_speed: getLikert(4.4),
            post_4_recommend_system: getLikert(4.7),
            post_6_weibull_survival_precision: getLikert(4.3),
            post_7_rsi_self_improve_confidence: getLikert(4.4),
            post_9_causal_simulator_whatif: getLikert(4.2),
            post_10_ate_roi_budget_justification: getLikert(4.5),
            post_12_pareto_frontier_tradeoff: getLikert(4.1),
            post_14_aes256_privacy_confidence: getLikert(4.8),
            post_16_ecuador_labor_law_compliance: getLikert(4.8),
            comments: selectRandom(postComments, [0.25, 0.25, 0.25, 0.25])
        };

        records.push({
            surveyType: 'POST_SYSTEM',
            respondentRole: role,
            companySize: size,
            economicSector: sector,
            experienceYears: exp,
            academicDegree: 'Licenciatura / Ingeniería',
            answers,
            isSynthetic: true,
            ipHash: 'seed-calibration',
            userAgent: 'Research-Seeder/1.0'
        });
    }

    // 3. Evaluación de Expertos (N = 15) — Validación Algorítmica
    const expertComments = [
        'La combinación de Do-Calculus e IPW para controlar sesgos de confusión aporta una base matemática sólida.',
        'El recorte de gradientes y ruido Gaussiano en DP-SGD cumple con los parámetros estándar de privacidad diferencial.',
        'El modelo proporcional de Weibull ajustado con covariables es metodológicamente correcto para análisis de tiempo hasta el evento.',
        'Se recomienda documentar explícitamente el ajuste de hiperparámetros en el informe de la Frontera de Pareto MORL.'
    ];

    for (let i = 0; i < 15; i++) {
        const role = 'Docente / Investigador Académico';
        const size = selectRandom(sizes, [0.20, 0.40, 0.30, 0.10]);
        const sector = 'Tecnología / Servicios Profesionales';
        const exp = selectRandom(['6 - 10 años', '> 10 años'], [0.40, 0.60]);
        const degree = selectRandom(['Maestría / MSc', 'Doctorado / PhD'], [0.60, 0.40]);

        const answers = {
            exp_1_weibull_theoretical_rigor: getLikert(4.7),
            exp_2_causal_docalculus_validity: getLikert(4.8),
            exp_3_dpsgd_privacy_guarantee: getLikert(4.5),
            exp_4_morl_pareto_optimality: getLikert(4.6),
            exp_5_rsi_gradient_descent_calibration: getLikert(4.5),
            exp_7_haversine_passkey_security: getLikert(4.8),
            exp_8_ecuador_labor_law_precision: getLikert(4.9),
            exp_9_scientific_paper_contribution: getLikert(4.8),
            comments: selectRandom(expertComments, [0.25, 0.25, 0.25, 0.25])
        };

        records.push({
            surveyType: 'EXPERT_EVAL',
            respondentRole: role,
            companySize: size,
            economicSector: sector,
            experienceYears: exp,
            academicDegree: degree,
            answers,
            isSynthetic: true,
            ipHash: 'seed-calibration',
            userAgent: 'Research-Seeder/1.0'
        });
    }

    const created = await prisma.researchSurveyResponse.createMany({
        data: records
    });

    console.log(`Sembrado exitoso. Se insertaron ${created.count} registros en la base de datos Neon.`);
    await prisma.$disconnect();
}

runSeeding().catch(err => {
    console.error('Error durante el sembrado:', err);
    prisma.$disconnect();
    process.exit(1);
});
