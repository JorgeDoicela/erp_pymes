import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clear() {
    try {
        const deleted = await prisma.biometricCredential.deleteMany({});
        console.log(`Deleted ${deleted.count} credentials.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
clear();
