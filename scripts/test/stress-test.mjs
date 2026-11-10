/**
 * @file stress-test.mjs
 * @description Ejecutor directo de pruebas de estrés para los motores matemáticos y analíticos.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testPath = path.resolve(__dirname, '../../backend/tests/stress/aiFrameworkStress.js');

console.log('[Stress Test] Iniciando suite de estrés de motores analíticos...');
const child = spawn('node', [testPath], { stdio: 'inherit', shell: true });

child.on('exit', (code) => {
    process.exit(code || 0);
});
