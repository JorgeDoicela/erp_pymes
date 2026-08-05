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

// ─── Utilidades de conexión ───────────────────────────────────────────────────

function createPrisma() {
    return new PrismaClient({
        datasources: {
            db: { url: process.env.DATABASE_URL }
        },
        log: ['error'],
    });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Ejecuta una función con reintentos automáticos en caso de error de conexión.
 * Crea un Prisma fresco en cada intento.
 */
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
                const waitMs = attempt * 2000; // 2s, 4s, 6s, 8s...
                console.log(`⚠️  [${label}] Error de conexión (intento ${attempt}/${maxRetries}). Reintentando en ${waitMs / 1000}s...`);
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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║       EMPLIFI — SEED COMPLETO        ║');
    console.log('╚══════════════════════════════════════╝');

    // Verificar conexión inicial
    console.log('\n🔌 Verificando conexión a la base de datos...');
    await withRetry('TEST_CONN', async (prisma) => {
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Conexión establecida correctamente.');
    });

    // 1. Limpiar TODA la BD antes de recrear
    console.log('\n[1/9] Limpiando base de datos...');
    await withRetry('CLEANUP', (prisma) => seedCleanup(prisma));

    // Pausa entre fases para que el pooler no cierre la conexión
    await sleep(1500);

    // 2. Crear Admin + 10 Empleados reales + System Settings
    console.log('\n[2/9] Creando usuarios...');
    let admin, employees, accountant, entrepreneur, allEmployees;
    await withRetry('USERS', async (prisma) => {
        const result = await seedUsers(prisma);
        admin = result.admin;
        employees = result.employees;
        accountant = result.accountant;
        entrepreneur = result.entrepreneur;
        allEmployees = result.allUsers || [admin, ...employees, accountant, entrepreneur].filter(Boolean);
    });

    if (!admin) {
        console.error('❌ Admin no encontrado. Abortando seed.');
        process.exit(1);
    }

    console.log(`\n✅ Total de empleados para seed (Admin, Staff, Contabilidad, Emprendimiento): ${allEmployees.length}`);
    await sleep(1500);

    // 3. Core Records (Contratos, Habilidades, Horarios, Documentos)
    console.log('\n[3/9] Creando registros base (contratos, horarios, habilidades)...');
    await withRetry('CORE_RECORDS', (prisma) => seedCoreRecords(prisma, allEmployees));
    await sleep(1000);
    await withRetry('DOCUMENTS', (prisma) => seedDocuments(prisma, allEmployees));
    await sleep(1500);

    // 4. Reclutamiento
    console.log('\n[4/9] Creando datos de reclutamiento...');
    await withRetry('RECRUITMENT', (prisma) => seedRecruitment(prisma, admin.id))
        .catch((e) => console.error('❌ Error en seedRecruitment:', e.message));
    await sleep(1500);

    // 5. Metas y Beneficios
    console.log('\n[5/9] Creando metas y beneficios...');
    await withRetry('GOALS', (prisma) => seedGoals(prisma, allEmployees))
        .catch((e) => console.error('❌ Error en seedGoals:', e.message));
    await sleep(1000);
    await withRetry('BENEFITS', (prisma) => seedBenefits(prisma, allEmployees))
        .catch((e) => console.error('❌ Error en seedBenefits:', e.message));
    await sleep(1500);

    // 6. Asistencia y Ausencias
    console.log('\n[6/9] Creando asistencia y ausencias...');
    await withRetry('ATTENDANCE', (prisma) => seedAttendance(prisma, allEmployees))
        .catch((e) => console.error('❌ Error en seedAttendance:', e.message));
    await sleep(1000);
    await withRetry('ABSENCES', (prisma) => seedAbsences(prisma, allEmployees))
        .catch((e) => console.error('❌ Error en seedAbsences:', e.message));
    await sleep(1500);

    // 7. Desempeño
    console.log('\n[7/9] Creando evaluaciones de desempeño...');
    await withRetry('PERFORMANCE', (prisma) => seedPerformance(prisma, allEmployees))
        .catch((e) => console.error('❌ Error en seedPerformance:', e.message));
    await sleep(1500);

    // 8. Nómina
    console.log('\n[8/9] Creando nómina...');
    await withRetry('PAYROLL_CONFIG', (prisma) => seedPayrollConfig(prisma))
        .catch((e) => console.error('❌ Error en seedPayrollConfig:', e.message));
    await sleep(1000);
    await withRetry('PAYROLL', (prisma) => seedPayroll(prisma, allEmployees))
        .catch((e) => console.error('❌ Error en seedPayroll:', e.message));
    await sleep(1500);

    // 9. Clima, Auditoría y Notificaciones
    console.log('\n[9/9] Creando clima, auditoría y notificaciones...');
    await withRetry('CLIMATE', (prisma) => seedClimate(prisma))
        .catch((e) => console.error('❌ Error en seedClimate:', e.message));
    await sleep(1000);
    await withRetry('AUDIT', (prisma) => seedAudit(prisma, allEmployees))
        .catch((e) => console.error('❌ Error en seedAudit:', e.message));
    await sleep(1000);
    await withRetry('NOTIFICATIONS', (prisma) => seedNotifications(prisma, admin, allEmployees))
        .catch((e) => console.error('❌ Error en seedNotifications:', e.message));

    // 10. Contabilidad (NUEVO)
    console.log('\n[10/10] Configurando Contabilidad y Nexus...');
    await withRetry('ACCOUNTING', (prisma) => seedAccounting(prisma))
        .catch((e) => console.error('❌ Error en seedAccounting:', e.message));
    await sleep(1000);
    await withRetry('JOURNAL_ENTRIES', (prisma) => seedJournalEntries(prisma))
        .catch((e) => console.error('❌ Error en seedJournalEntries:', e.message));

    // 11. Emprendimiento (AISLADO)
    console.log('\n[11/11] Configurando Incubadora de Startups...');
    await withRetry('ENTREPRENEURSHIP', (prisma) => seedEntrepreneurship(prisma))
        .catch((e) => console.error('❌ Error en seedEntrepreneurship:', e.message));

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║        SEED COMPLETADO ✅            ║');
    console.log('╠══════════════════════════════════════╣');
    console.log('║  Admin:  admin@emplifi.com           ║');
    console.log('║  Contab: contabilidad@emplifi.com    ║');
    console.log('║  Pass:   Emplifi2025!                ║');
    console.log('║  Empleados: 10 (ver consola arriba)  ║');
    console.log('╚══════════════════════════════════════╝');
}

main().catch((e) => {
    console.error('❌ Error fatal en seed:', e);
    process.exit(1);
});