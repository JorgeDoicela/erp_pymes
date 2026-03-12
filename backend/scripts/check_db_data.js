import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying Database Content ---');

    const employees = await prisma.employee.count();
    console.log(`Employees: ${employees}`);

    const attendance = await prisma.attendance.count();
    console.log(`Attendance Records: ${attendance}`);

    const evaluations = await prisma.employeeEvaluation.count();
    console.log(`Evaluations: ${evaluations}`);

    const pendingEvals = await prisma.employeeEvaluation.count({ where: { status: 'PENDING' } });
    const completedEvals = await prisma.employeeEvaluation.count({ where: { status: 'COMPLETED' } });
    console.log(`- Pending Evaluations: ${pendingEvals}`);
    console.log(`- Completed Evaluations: ${completedEvals}`);

    const absences = await prisma.absenceRequest.count();
    console.log(`Absence Requests: ${absences}`);

    const entrepreneurships = await prisma.entrepreneurship.count();
    console.log(`Entrepreneurship Projects: ${entrepreneurships}`);

    const adminUser = await prisma.employee.findUnique({ where: { email: 'admin@emplifi.com' } });
    console.log('--- Admin User Check ---');
    console.log(adminUser);

    const summary = await prisma.employee.findMany({ select: { email: true, role: true } });
    console.log('--- Quick Summary ---');
    summary.forEach(s => console.log(`${s.email} [${s.role}]`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
