import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedCleanup } from './seeds/cleanup.js';
import { seedUsers } from './seeds/users.js';
import { seedEmployees } from './seeds/employees.js';
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
    const args = process.argv.slice(2);
    const onlyArg = args.find(arg => arg.startsWith('--only='));
    const moduleToRun = onlyArg ? onlyArg.split('=')[1] : 'all';

    console.log(`[SEED] Starting Seed (Module: ${moduleToRun})`);

    // 1. Cleanup
    if (moduleToRun === 'all' || moduleToRun === 'cleanup') {
        await seedCleanup(prisma);
    }

    // 2. Users - Ensure they exist regardless of previous step
    let admin = await prisma.employee.findUnique({ where: { email: 'admin@emplifi.com' } });
    let testUser = await prisma.employee.findUnique({ where: { email: 'empleado@test.com' } });

    if ((!admin || !testUser) && (moduleToRun === 'all' || moduleToRun === 'users')) {
        const users = await seedUsers(prisma);
        if (!admin) admin = users.admin;
        if (!testUser) testUser = users.testUser;
    }

    // Double check to ensure we have them for dependencies
    if (!admin) admin = await prisma.employee.findUnique({ where: { email: 'admin@emplifi.com' } });
    if (!testUser) testUser = await prisma.employee.findUnique({ where: { email: 'empleado@test.com' } });

    console.log(`[ADMIN] Admin ID: ${admin?.id || 'NOT FOUND'}`);
    console.log(`[USER] Test User ID: ${testUser?.id || 'NOT FOUND'}`);

    // 3. Employees
    let bulkEmployees = [];
    if (moduleToRun === 'all' || moduleToRun === 'employees') {
        bulkEmployees = await seedEmployees(prisma);
    }

    // Always fetch bulk if list is empty (for partial runs)
    if (bulkEmployees.length === 0) {
        bulkEmployees = await prisma.employee.findMany({
            where: { role: 'employee', email: { not: 'empleado@test.com' } }
        });
    }

    const allEmployees = [];
    if (admin) allEmployees.push(admin);
    if (testUser) allEmployees.push(testUser);
    allEmployees.push(...bulkEmployees);

    console.log(`[EMPLOYEES] Total Employees for Seeding: ${allEmployees.length}`);

    // 4. Core Records (Contracts, Skills, Schedules, Documents)
    if (moduleToRun === 'all' || moduleToRun === 'core') {
        if (allEmployees.length > 0) {
            await seedCoreRecords(prisma, allEmployees);
            await seedDocuments(prisma, allEmployees);
        }
    }

    // 5. Modules
    if (moduleToRun === 'all' || moduleToRun === 'recruitment') {
        if (admin) {
            await seedRecruitment(prisma, admin.id);
        } else {
            console.error("Skipping Recruitment: Admin not found");
        }
    }

    if (moduleToRun === 'all' || moduleToRun === 'goals') {
        await seedGoals(prisma, allEmployees);
    }

    if (moduleToRun === 'all' || moduleToRun === 'benefits') {
        await seedBenefits(prisma, allEmployees);
    }

    if (moduleToRun === 'all' || moduleToRun === 'attendance') {
        await seedAttendance(prisma, allEmployees);
        await seedAbsences(prisma, allEmployees);
    }

    if (moduleToRun === 'all' || moduleToRun === 'performance') {
        await seedPerformance(prisma, allEmployees);
    }

    if (moduleToRun === 'all' || moduleToRun === 'payroll') {
        await seedPayrollConfig(prisma);
        await seedPayroll(prisma, allEmployees);
    }

    if (moduleToRun === 'all' || moduleToRun === 'climate') {
        await seedClimate(prisma);
    }

    if (moduleToRun === 'all' || moduleToRun === 'audit') {
        await seedAudit(prisma, allEmployees);
    }

    // 6. Notifications (Always run if admin exists, or if module is notifications)
    if (moduleToRun === 'all' || moduleToRun === 'notifications') {
        await seedNotifications(prisma, admin, allEmployees);
    }

    console.log('SEED FINISHED.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
