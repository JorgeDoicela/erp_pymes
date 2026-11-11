/**
 * @file seed.controller.js
 * @description Norma ERP - Controlador de Operaciones Administrativas de Seed y Migración Remota
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const isValidSeedSecret = (secret) => {
  const seedSecret = process.env.SEED_SECRET;
  return Boolean(
    seedSecret && typeof secret === 'string' && secret.trim() !== '' && secret === seedSecret
  );
};

export const runSeed = async (req, res) => {
  try {
    if (!isValidSeedSecret(req.body?.secret)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso Denegado. Secreto inválido o no configurado.',
      });
    }

    let scriptPath = path.resolve('prisma/seed.js');
    if (!fs.existsSync(scriptPath)) {
      const altScriptPath = path.resolve('backend/prisma/seed.js');
      if (fs.existsSync(altScriptPath)) {
        scriptPath = altScriptPath;
      } else {
        console.warn('seed.js not found in standard locations');
      }
    }

    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error seed: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: 'Error al ejecutar seed',
          error: error.message,
        });
      }

      if (stderr) {
        console.warn(`Seed stderr: ${stderr}`);
      }

      res.status(200).json({
        success: true,
        message: 'Seed ejecutado exitosamente',
        output: stdout.substring(0, 500) + '...',
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error interno en servicio de seed' });
  }
};

export const runMigration = async (req, res) => {
  try {
    if (!isValidSeedSecret(req.body?.secret)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso Denegado. Secreto inválido o no configurado.',
      });
    }

    let schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      const altSchemaPath = path.join(process.cwd(), 'backend', 'prisma', 'schema.prisma');
      if (fs.existsSync(altSchemaPath)) {
        schemaPath = altSchemaPath;
      } else {
        console.warn('Schema not found in standard locations, trying default...');
      }
    }

    let prismaPath = path.join(process.cwd(), 'node_modules', '.bin', 'prisma');
    if (!fs.existsSync(prismaPath)) {
      const altPrismaPath = path.join(process.cwd(), 'backend', 'node_modules', '.bin', 'prisma');
      if (fs.existsSync(altPrismaPath)) {
        prismaPath = altPrismaPath;
      }
    }

    const env = { ...process.env, HOME: '/tmp' };

    exec(
      `"${prismaPath}" db push --accept-data-loss --skip-generate --schema="${schemaPath}"`,
      { env },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Migration error (Primary): ${error.message}`);
          exec('npx prisma db push --accept-data-loss', { env }, (err2, out2, err2_stderr) => {
            if (err2) {
              console.error(`Fallback Migration error: ${err2.message}`);
              return res.status(500).json({
                success: false,
                message: 'Migration failed',
                primaryError: error.message,
                primaryStderr: stderr,
                fallbackError: err2.message,
                fallbackStderr: err2_stderr,
                cwd: process.cwd(),
              });
            }
            res
              .status(200)
              .json({ success: true, message: 'Migración completada (Fallback)', output: out2 });
          });
          return;
        }
        res.status(200).json({
          success: true,
          message: 'Migración completada',
          output: stdout,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: 'Error interno en migración', error: error.message });
  }
};

