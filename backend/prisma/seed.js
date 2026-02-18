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

const prisma = new PrismaClient();

async function main() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║       EMPLIFI — SEED COMPLETO        ║');
    console.log('╚══════════════════════════════════════╝');

    // 1. Limpiar TODA la BD antes de recrear
    console.log('\n[1/9] Limpiando base de datos...');
    await seedCleanup(prisma);

    // 2. Crear Admin + 10 Empleados reales + System Settings
    console.log('\n[2/9] Creando usuarios...');
    const { admin, employees } = await seedUsers(prisma);

    if (!admin) {
        console.error('❌ Admin no encontrado. Abortando seed.');
        process.exit(1);
    }

    const allEmployees = [admin, ...employees];
    console.log(`\n✅ Total de empleados para seed: ${allEmployees.length}`);

    // 3. Core Records (Contratos, Habilidades, Horarios, Documentos)
    console.log('\n[3/9] Creando registros base (contratos, horarios, habilidades)...');
    await seedCoreRecords(prisma, allEmployees);
    await seedDocuments(prisma, allEmployees);

    // 4. Reclutamiento
    console.log('\n[4/9] Creando datos de reclutamiento...');
    await seedRecruitment(prisma, admin.id);

    // 5. Metas y Beneficios
    console.log('\n[5/9] Creando metas y beneficios...');
    await seedGoals(prisma, allEmployees);
    await seedBenefits(prisma, allEmployees);

    // 6. Asistencia y Ausencias
    console.log('\n[6/9] Creando asistencia y ausencias...');
    try {
        await seedAttendance(prisma, allEmployees);
    } catch (e) { console.error('❌ Error en seedAttendance:', e); }

    try {
        await seedAbsences(prisma, allEmployees);
    } catch (e) { console.error('❌ Error en seedAbsences:', e); }

    // 7. Desempeño
    console.log('\n[7/9] Creando evaluaciones de desempeño...');
    try {
        await seedPerformance(prisma, allEmployees);
    } catch (e) { console.error('❌ Error en seedPerformance:', e); }

    // 8. Nómina
    console.log('\n[8/9] Creando nómina...');
    try {
        await seedPayrollConfig(prisma);
        await seedPayroll(prisma, allEmployees);
    } catch (e) { console.error('❌ Error en seedPayroll:', e); }

    // 9. Clima, Auditoría y Notificaciones
    console.log('\n[9/9] Creando clima, auditoría y notificaciones...');
    try {
        await seedClimate(prisma);
    } catch (e) { console.error('❌ Error en seedClimate:', e); }

    try {
        await seedAudit(prisma, allEmployees);
    } catch (e) { console.error('❌ Error en seedAudit:', e); }

    try {
        await seedNotifications(prisma, admin, allEmployees);
    } catch (e) { console.error('❌ Error en seedNotifications:', e); }

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║        SEED COMPLETADO ✅            ║');
    console.log('╠══════════════════════════════════════╣');
    console.log('║  Admin:  admin@emplifi.com           ║');
    console.log('║  Pass:   Emplifi2025!                ║');
    console.log('║  Empleados: 10 (ver consola arriba)  ║');
    console.log('╚══════════════════════════════════════╝');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

//arreglado