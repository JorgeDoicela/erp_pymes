import prisma from './src/database/db.js';

async function main() {
    const user = await prisma.employee.findUnique({
        where: { id: 'cmlyvcna' }
    });
    console.log(JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
