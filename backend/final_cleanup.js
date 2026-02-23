import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
    const deleted = await prisma.biometricCredential.deleteMany({
        where: {
            OR: [
                { credentialId: '' },
                { publicKey: '' }
            ]
        }
    });
    console.log(`Deleted ${deleted.count} invalid records.`);
}

cleanup().finally(() => prisma.$disconnect());
