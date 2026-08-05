import prisma from '../database/db.js';

async function fixSlugs() {
    try {
        console.log('Buscando empresas con slugs corruptos o excesivamente largos...');
        const tenants = await prisma.tenant.findMany();
        
        for (const tenant of tenants) {
            if (tenant.slug && tenant.slug.length > 50) {
                const cleanSlug = tenant.name
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '')
                    .slice(0, 50);
                
                console.log(`Corrigiendo slug para '${tenant.name}':`);
                console.log(`  Anterior: ${tenant.slug.slice(0, 40)}...`);
                console.log(`  Nuevo: ${cleanSlug}`);

                await prisma.tenant.update({
                    where: { id: tenant.id },
                    data: { slug: cleanSlug }
                });
            }
        }
        console.log('✅ Slugs corregidos con éxito.');
    } catch (err) {
        console.error('Error al corregir slugs:', err);
    } finally {
        await prisma.$disconnect();
    }
}

fixSlugs();
