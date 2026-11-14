/**
 * @file env.js
 * @description Cargador centralizado y profesional de variables de entorno para Norma ERP.
 * Resuelve automáticamente el archivo .env de la raíz del proyecto y adapta
 * las conexiones de base de datos entre entorno Docker y Host local nativo.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Rutas canónicas para búsqueda de .env
const rootEnvPath = path.resolve(__dirname, '../../../.env');
const backendEnvPath = path.resolve(__dirname, '../../.env');

// 2. Carga prioritaria del .env de la raíz (fuente única de verdad)
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else {
  dotenv.config(); // fallback estándar
}

// 3. Detección de entorno de ejecución (Docker vs Host local nativo)
const isRunningInDocker =
  fs.existsSync('/.dockerenv') ||
  process.env.IS_DOCKER === 'true' ||
  process.env.CONTAINER === 'true';

// 4. Adaptación transparente de DATABASE_URL para desarrollo nativo fuera de Docker
// Si estamos en el host nativo (ej: Windows) y la URL apunta al hostname interno 'db',
// adaptamos automáticamente al puerto host publicado (por defecto 5434 en local).
if (!isRunningInDocker && process.env.DATABASE_URL) {
  if (process.env.DATABASE_URL.includes('@db:5432')) {
    const postgresHostPort = process.env.POSTGRES_PORT || '5434';
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
      '@db:5432',
      `@localhost:${postgresHostPort}`
    );
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '',
  isRunningInDocker,
};

export default env;
