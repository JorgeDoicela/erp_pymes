import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script de Respaldo - RNF-25
 * Genera un backup de la base de datos PostgreSQL configurada en .env
 */

const dbUrl = process.env.DATABASE_URL;
const backupDir = path.join(process.cwd(), 'backups');

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const fileName = `backup-${timestamp}.sql`;
const filePath = path.join(backupDir, fileName);

console.log(`--- Iniciando Respaldo de Base de Datos ---`);

// Intentar usar pg_dump si está disponible en el sistema
exec(`pg_dump "${dbUrl}" > "${filePath}"`, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Error al ejecutar pg_dump: ${error.message}`);
        console.log('--- Nota: Asegúrate de tener PostgreSQL instalado y en el PATH ---');
        return;
    }

    if (stderr) {
        console.warn(`⚠️ Advertencia: ${stderr}`);
    }

    console.log(`✅ Respaldo completado exitosamente: ${fileName}`);
    console.log(`Ubicación: ${filePath}`);
});
