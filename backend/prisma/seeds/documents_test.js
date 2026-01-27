import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDocumentExpiration(prisma) {
    console.log('--- Seeding Document Expiration (30/15/-1 days) ---');

    const emp = await prisma.employee.findUnique({ where: { email: 'empleado@test.com' } });
    if (!emp) {
        console.log('User employee not found, skipping document seed');
        return;
    }

    // Clear existing documents to avoid clutter
    await prisma.document.deleteMany({
        where: { employeeId: emp.id }
    });

    const today = new Date();

    // 1. Expiring in 30 days
    const future30 = new Date(today);
    future30.setDate(today.getDate() + 30);
    // Be careful with time, Cron checks start/end of day, so date part is enough

    await prisma.document.create({
        data: {
            type: 'Licencia de Conducir',
            documentUrl: 'licencia_30.pdf',
            expiryDate: future30,
            employeeId: emp.id
        }
    });

    // 2. Expiring in 15 days
    const future15 = new Date(today);
    future15.setDate(today.getDate() + 15);

    await prisma.document.create({
        data: {
            type: 'Certificado Médico',
            documentUrl: 'cert_15.pdf',
            expiryDate: future15,
            employeeId: emp.id
        }
    });

    // 3. Expired Yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    await prisma.document.create({
        data: {
            type: 'Carnet de Vacunación',
            documentUrl: 'carnet_vencido.pdf',
            expiryDate: yesterday,
            employeeId: emp.id
        }
    });

    console.log('Documents seeded: Expiring in 30d, 15d, and Expired (yesterday).');
}
