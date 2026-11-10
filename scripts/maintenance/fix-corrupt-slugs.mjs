/**
 * @file fix-corrupt-slugs.mjs
 * @description Script de mantenimiento para sanear slugs corruptos o de longitud inválida en la tabla Tenant.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno del backend
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

import prisma from '../../backend/src/database/db.js';

async function fixSlugs() {
    try {
        console.log('[Mantenimiento] Buscando empresas con slugs corruptos o excesivamente largos...');
        const tenants = await prisma.tenant.findMany();

        let modified = 0;
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
                console.log(`  Nuevo:    ${cleanSlug}`);

                await prisma.tenant.update({
                    where: { id: tenant.id },
                    data: { slug: cleanSlug }
                });
                modified++;
            }
        }
        console.log(`[Mantenimiento] Proceso finalizado con éxito. Empresas corregidas: ${modified}.`);
    } catch (err) {
        console.error('[Mantenimiento] Error al corregir slugs:', err);
    } finally {
        await prisma.$disconnect();
    }
}

fixSlugs();
