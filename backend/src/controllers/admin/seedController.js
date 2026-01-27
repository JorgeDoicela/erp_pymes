import { exec } from 'child_process';
import path from 'path';

export const runSeed = async (req, res) => {
    try {
        const { secret } = req.body;
        const seedSecret = process.env.SEED_SECRET;

        // Security Check
        if (!seedSecret || secret !== seedSecret) {
            return res.status(403).json({
                success: false,
                message: 'Acceso Denegado. Secreto inválido.'
            });
        }

        console.log('--- Iniciando Seed Remoto ---');

        // Execute the seed script directly via node
        // We assume we are in backend/src/controllers/admin... so we go up
        const scriptPath = path.resolve('prisma/seed.js');

        // Execute using child_process for isolation
        exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error seed: ${error.message}`);
                return res.status(500).json({
                    success: false,
                    message: 'Error al ejecutar seed',
                    error: error.message
                });
            }

            if (stderr) {
                console.warn(`Seed stderr: ${stderr}`);
            }

            console.log(`Seed output: ${stdout}`);

            res.status(200).json({
                success: true,
                message: 'Seed ejecutado exitosamente',
                output: stdout.substring(0, 500) + '...' // Limit output
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno en servicio de seed' });
    }
};
export const runMigration = async (req, res) => {
    try {
        const { secret } = req.body;
        const seedSecret = process.env.SEED_SECRET;

        if (!seedSecret || secret !== seedSecret) {
            return res.status(403).json({ success: false, message: 'Acceso Denegado' });
        }

        console.log('--- Iniciando Migración Remota ---');
        // npx prisma db push --accept-data-loss
        // We need to run this from backend folder? process.cwd() is usually root in Vercel function?
        // Actually Vercel function cwd is usually the project root or the function root.
        // We will try running it.
        exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
            if (error) {
                console.error(`Migration error: ${error.message}`);
                return res.status(500).json({ success: false, error: error.message });
            }
            console.log(`Migration output: ${stdout}`);
            res.status(200).json({
                success: true,
                message: 'Migración completada',
                output: stdout
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error interno en migración' });
    }
};
