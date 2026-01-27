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

        // Use local prisma binary to ensure availability and avoid npx fetching
        const prismaPath = path.join(process.cwd(), 'node_modules', '.bin', 'prisma');
        const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

        console.log(`Prisma executable path: ${prismaPath}`);

        // Set HOME to /tmp to avoid 'mkdir' permission errors in read-only environments (Vercel)
        const env = { ...process.env, HOME: '/tmp' };

        exec(`"${prismaPath}" db push --accept-data-loss --schema="${schemaPath}"`, { env }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Migration error: ${error.message}`);
                // Fallback to npx if binary not found (unlikely if in dependencies)
                console.log('Falling back to npx...');
                exec('npx prisma db push --accept-data-loss', { env }, (err2, out2, err2_stderr) => {
                    if (err2) {
                        console.error(`Fallback Migration error: ${err2.message}`);
                        return res.status(500).json({ success: false, error: err2.message, stderr: err2_stderr });
                    }
                    res.status(200).json({ success: true, message: 'Migración completada (Fallback)', output: out2 });
                });
                return;
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
