import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

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
        console.log(`Current Working Directory: ${process.cwd()}`);

        try {
            console.log('Root contents:', fs.readdirSync(process.cwd()));
            if (fs.existsSync(path.join(process.cwd(), 'backend'))) {
                console.log('Backend contents:', fs.readdirSync(path.join(process.cwd(), 'backend')));
            }
        } catch (e) {
            console.log('Error listing directories:', e.message);
        }

        // Locate Schema
        let schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
        if (!fs.existsSync(schemaPath)) {
            const altSchemaPath = path.join(process.cwd(), 'backend', 'prisma', 'schema.prisma');
            if (fs.existsSync(altSchemaPath)) {
                schemaPath = altSchemaPath;
            } else {
                console.warn('Schema not found in standard locations, trying default...');
            }
        }
        console.log(`Using Schema Path: ${schemaPath}`);

        // Locate Prisma Binary
        // Try to find the local node_modules binary
        let prismaPath = path.join(process.cwd(), 'node_modules', '.bin', 'prisma');
        if (!fs.existsSync(prismaPath)) {
            // Try backend/node_modules if it exists
            const altPrismaPath = path.join(process.cwd(), 'backend', 'node_modules', '.bin', 'prisma');
            if (fs.existsSync(altPrismaPath)) {
                prismaPath = altPrismaPath;
            }
        }
        console.log(`Using Prisma Path: ${prismaPath}`);

        // Set HOME to /tmp to avoid 'mkdir' permission errors
        const env = { ...process.env, HOME: '/tmp' };

        exec(`"${prismaPath}" db push --accept-data-loss --schema="${schemaPath}"`, { env }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Migration error (Primary): ${error.message}`);
                console.error(`Stderr (Primary): ${stderr}`);

                // Fallback to npx
                console.log('Falling back to npx...');
                exec('npx prisma db push --accept-data-loss', { env }, (err2, out2, err2_stderr) => {
                    if (err2) {
                        console.error(`Fallback Migration error: ${err2.message}`);
                        // Return BOTH errors for debugging
                        return res.status(500).json({
                            success: false,
                            message: 'Migration failed',
                            primaryError: error.message,
                            primaryStderr: stderr,
                            fallbackError: err2.message,
                            fallbackStderr: err2_stderr,
                            cwd: process.cwd()
                        });
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
        res.status(500).json({ success: false, message: 'Error interno en migración', error: error.message });
    }
};
