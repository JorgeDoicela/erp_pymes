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
