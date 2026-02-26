const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const totalEmployees = await prisma.employee.count();
    const totalEvaluations = await prisma.employeeEvaluation.count();
    const completedEvaluations = await prisma.employeeEvaluation.count({ where: { status: 'COMPLETED' } });

    console.log('Total Employees:', totalEmployees);
    console.log('Total Evaluations:', totalEvaluations);
    console.log('Completed Evaluations:', completedEvaluations);

    const evs = await prisma.employeeEvaluation.findMany({
        include: { employee: true }
    });

    evs.forEach(ev => {
        console.log(`Employee: ${ev.employee.firstName} ${ev.employee.lastName}, Status: ${ev.status}, Score: ${ev.finalScore}`);
    });

    await prisma.$disconnect();
}

check();
