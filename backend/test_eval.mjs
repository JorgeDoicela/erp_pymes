import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

try {
    const admin = await prisma.employee.findFirst({ where: { role: 'admin' } });
    const employees = await prisma.employee.findMany({ take: 2, where: { role: { not: 'admin' } } });
    const template = await prisma.evaluationTemplate.findFirst();

    // Generate a valid JWT token for admin
    const token = jwt.sign(
        { id: admin.id, role: admin.role },
        'secret_key_change_me',
        { expiresIn: '1d' }
    );

    const body = {
        templateId: template.id,
        employeeIds: employees.map(e => e.id),
        evaluatorIds: [admin.id],
        startDate: '2026-03-01',
        endDate: '2026-06-30'
    };

    console.log('Testing POST /api/performance/assignments...');
    console.log('Body:', JSON.stringify(body));

    const response = await fetch('http://localhost:4000/api/performance/assignments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result));

    if (response.ok) {
        console.log('\n✅ SUCCESS! Cleaning up...');
        // Clean up test evaluations
        const toDelete = await prisma.employeeEvaluation.findMany({
            where: {
                templateId: template.id,
                employeeId: { in: employees.map(e => e.id) },
                createdAt: { gte: new Date(Date.now() - 60000) }
            }
        });
        if (toDelete.length > 0) {
            await prisma.employeeEvaluation.deleteMany({
                where: { id: { in: toDelete.map(e => e.id) } }
            });
            console.log(`Cleaned up ${toDelete.length} test records.`);
        }
    }

} catch (e) {
    console.error('ERROR:', e.message);
} finally {
    await prisma.$disconnect();
}
