import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedRequests(prisma) {
    console.log('--- Seeding Absence Requests (Pending scenarios) ---');

    const emp = await prisma.employee.findUnique({ where: { email: 'empleado@test.com' } });
    if (!emp) {
        console.log('User employee not found, skipping request seed');
        return;
    }

    // Clear existing pending requests for this test user to avoid clutter
    await prisma.absenceRequest.deleteMany({
        where: { employeeId: emp.id, status: 'PENDING' }
    });

    const now = new Date();

    // 1. New Request (0 hours ago)
    await prisma.absenceRequest.create({
        data: {
            employeeId: emp.id,
            type: 'Personal',
            startDate: now,
            endDate: now,
            reason: 'Test Recent Request',
            status: 'PENDING',
            createdAt: now
        }
    });

    // 2. Request 24h ago
    const ago24h = new Date(now);
    ago24h.setHours(now.getHours() - 24);
    await prisma.absenceRequest.create({
        data: {
            employeeId: emp.id,
            type: 'Enfermedad',
            startDate: now,
            endDate: now,
            reason: 'Test 24h Reminder',
            status: 'PENDING',
            createdAt: ago24h
        }
    });

    // 3. Request 48h ago
    const ago48h = new Date(now);
    ago48h.setHours(now.getHours() - 48);
    await prisma.absenceRequest.create({
        data: {
            employeeId: emp.id,
            type: 'Vacaciones',
            startDate: now,
            endDate: now,
            reason: 'Test 48h Escalation',
            status: 'PENDING',
            createdAt: ago48h
        }
    });

    console.log('Requests seeded: Recent, 24h ago, 48h ago.');
}
