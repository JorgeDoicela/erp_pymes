/**
 * @file server.js
 * @description Punto de entrada principal y servidor HTTP/WebSocket para la plataforma Norma ERP.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import './config/env.js';
import http from 'http';
import app from './app.js';
import {
  socketService,
  initContractCronJob,
  initPerformanceCronJob,
  initRequestMonitorCronJob,
  initDocumentCronJob,
  initPayrollCronJob,
} from './modules/index.js';

// Init background jobs
initContractCronJob();
initPerformanceCronJob();
initRequestMonitorCronJob();
initDocumentCronJob();
initPayrollCronJob();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Inicializar Socket.io
socketService.init(server);

server.listen(PORT, () => {
  console.log(`Backend NORMA ERP corriendo en http://localhost:${PORT}`);
  console.log('Server updated at ' + new Date().toISOString());
});

const gracefulShutdown = async (signal) => {
  console.log(`[Server] Recibida senal ${signal}. Cerrando conexiones...`);
  server.close(async () => {
    try {
      const { default: prisma } = await import('./database/db.js');
      await prisma.$disconnect();
      console.log('[Server] Conexion de base de datos cerrada.');
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error cerrando conexion de base de datos:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
