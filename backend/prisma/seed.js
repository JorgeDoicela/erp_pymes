import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedCleanup } from './seeds/cleanup.js';
import { seedUsers } from './seeds/users.js';
import { seedRecruitment } from './seeds/recruitment.js';
import { seedPerformance } from './seeds/performance.js';
import { seedPayroll } from './seeds/payroll.js';
import { seedClimate } from './seeds/climate.js';
import { seedCoreRecords } from './seeds/core_records.js';
import { seedGoals } from './seeds/goals.js';
import { seedBenefits } from './seeds/benefits.js';
import { seedAttendance } from './seeds/attendance.js';
import { seedAbsences } from './seeds/absences.js';
import { seedDocuments } from './seeds/documents.js';
import { seedAudit } from './seeds/audit.js';
import { seedPayrollConfig } from './seeds/payroll_config.js';
import { seedNotifications } from './seeds/notifications.js';
import { seedAccounting, seedJournalEntries } from './seeds/accounting.js';
import { seedEntrepreneurship } from './seeds/entrepreneurship.js';
import { seedResearchData } from './seeds/research_data.js';
import { seedOffboarding } from './seeds/offboarding.js';

function createPrisma() {
    return new PrismaClient({
        datasources: {
            db: { url: process.env.DATABASE_URL }
        },
        log: ['error'],
    });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(label, fn, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const prisma = createPrisma();
        try {
            await prisma.$connect();
            const result = await fn(prisma);
            return result;
        } catch (e) {
            const isConnError =
                e.code === 'P1001' ||
                e.message?.includes("Can't reach database") ||
                e.message?.includes('Server has closed the connection') ||
                e.message?.includes('Connection terminated');

            if (isConnError && attempt < maxRetries) {
                const waitMs = attempt * 2000;
                console.log(` [${label}] Error de conexión (intento ${attempt}/${maxRetries}). Reintentando en ${waitMs / 1000}s...`);
                await sleep(waitMs);
            } else {
                console.error(`❌ [${label}] Falló después de ${attempt} intento(s): ${e.message}`);
                throw e;
            }
        } finally {
            try { await prisma.$disconnect(); } catch (_) { }
        }
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   EMPLIFI — SEED COMPLETO (2 EMPRESAS REALES CON DATOS)    ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log('\n🔌 Verificando conexión a la base de datos...');
    await withRetry('TEST_CONN', async (prisma) => {
        await prisma.$queryRaw`SELECT 1`;
        console.log('Conexión establecida correctamente.');
    });

    // 1. Limpieza
    console.log('\n[1/12] Limpiando base de datos...');
    await withRetry('CLEANUP', (prisma) => seedCleanup(prisma));
    await sleep(1000);

    // 2. Usuarios y Tenants (2 Empresas)
    console.log('\n[2/12] Creando 2 Empresas y sus Colaboradores...');
    let seedUsersResult;
    await withRetry('USERS', async (prisma) => {
        seedUsersResult = await seedUsers(prisma);
    });

    const { tenant1, tenant2, admin1, admin2, allEmployees } = seedUsersResult;
    console.log(`\nTotal colaboradores cargados en base de datos: ${allEmployees.length}`);
    await sleep(1000);

    // 3. Core Records y Documentos
    console.log('\n[3/12] Creando registros base (contratos, horarios, habilidades, documentos, finiquitos)...');
    await withRetry('CORE_RECORDS', (prisma) => seedCoreRecords(prisma, allEmployees));
    await sleep(800);
    await withRetry('DOCUMENTS', (prisma) => seedDocuments(prisma, allEmployees));
    await sleep(800);
    await withRetry('OFFBOARDING', (prisma) => seedOffboarding(prisma, allEmployees));
    await sleep(800);

    // 4. Reclutamiento
    console.log('\n[4/12] Creando procesos de reclutamiento para ambas empresas...');
    await withRetry('RECRUITMENT', (prisma) => seedRecruitment(prisma));
    await sleep(800);

    // 5. Metas y Beneficios
    console.log('\n[5/12] Creando metas SMART y beneficios corporativos...');
    await withRetry('GOALS', (prisma) => seedGoals(prisma, allEmployees));
    await sleep(800);
    await withRetry('BENEFITS', (prisma) => seedBenefits(prisma, allEmployees));
    await sleep(800);

    // 6. Asistencia y Ausencias
    console.log('\n[6/12] Creando marcaciones de asistencia y solicitudes de ausencia...');
    await withRetry('ATTENDANCE', (prisma) => seedAttendance(prisma, allEmployees));
    await sleep(800);
    await withRetry('ABSENCES', (prisma) => seedAbsences(prisma, allEmployees));
    await sleep(800);

    // 7. Evaluaciones de Desempeño
    console.log('\n[7/12] Creando evaluaciones de desempeño 360°...');
    await withRetry('PERFORMANCE', (prisma) => seedPerformance(prisma, allEmployees));
    await sleep(800);

    // 8. Nómina
    console.log('\n[8/12] Configurando y generando nómina de 6 meses para ambas empresas...');
    await withRetry('PAYROLL_CONFIG', (prisma) => seedPayrollConfig(prisma));
    await sleep(800);
    await withRetry('PAYROLL', (prisma) => seedPayroll(prisma, allEmployees));
    await sleep(800);

    // 9. Clima Laboral, Auditoría y Notificaciones
    console.log('\n[9/12] Creando encuestas de clima, logs de auditoría y notificaciones...');
    await withRetry('CLIMATE', (prisma) => seedClimate(prisma));
    await sleep(800);
    await withRetry('AUDIT', (prisma) => seedAudit(prisma, allEmployees));
    await sleep(800);
    await withRetry('NOTIFICATIONS', (prisma) => seedNotifications(prisma, admin1, allEmployees));
    await sleep(800);

    // 10. Contabilidad PUG
    console.log('\n[10/12] Configurando Contabilidad (Centros de Costo, PUG y Asientos)...');
    await withRetry('ACCOUNTING', (prisma) => seedAccounting(prisma));
    await sleep(800);
    await withRetry('JOURNAL_ENTRIES', (prisma) => seedJournalEntries(prisma));
    await sleep(800);

    // 11. Incubadora / Emprendimiento
    console.log('\n[11/12] Configurando Incubadora de Startups...');
    await withRetry('ENTREPRENEURSHIP', (prisma) => seedEntrepreneurship(prisma));
    await sleep(800);

    // 12. Motor Científico de IA
    console.log('\n[12/12] Configurando Módulos de IA (RSI, Causal, MORL, Privacidad Diferencial)...');
    await withRetry('RESEARCH_DATA', (prisma) => seedResearchData(prisma));

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           SEED DE 2 EMPRESAS COMPLETADO                  ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  Empresa 1: Empresa Demo Ecuador S.A.                      ║');
    console.log('║    Admin:   admin.empresa@emplifi.com (Pass: Emplifi2025!)  ║');
    console.log('║    Contab:  contabilidad@emplifi.com   (Pass: Emplifi2025!)  ║');
    console.log('║                                                            ║');
    console.log('║  Empresa 2: TechSolutions Cía. Ltda.                       ║');
    console.log('║    Admin:   admin.tech@techsolutions.ec (Pass: Emplifi2025!)║');
    console.log('║    Contab:  contabilidad.tech@techsolutions.ec (Emplifi2025!)║');
    console.log('║                                                            ║');
    console.log('║  SuperAdmin Global: admin@emplifi.com (Pass: Emplifi2025!) ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
}

main().catch((e) => {
    console.error('❌ Error fatal en seed:', e);
    process.exit(1);
});
