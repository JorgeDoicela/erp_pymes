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
  emailService,
  sustainabilityRepository,
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

  // Diagnóstico no bloqueante de conectividad de correo SMTP
  emailService
    .verifyConnection()
    .then((status) => {
      if (status.verified && status.configured) {
        console.log(`[SMTP] Servidor de correo activo: ${status.message}`);
      } else if (!status.configured) {
        console.log(`[SMTP] ${status.message}`);
      } else {
        console.warn(`[SMTP Warning] Verificación de correo fallida: ${status.message}`);
      }
    })
    .catch((err) => {
      console.warn(`[SMTP Warning] Error al verificar correo: ${err.message}`);
    });

  // Sincronización no bloqueante del corpus vectorial pgvector (HNSW 768d) al arrancar el servidor
  if (process.env.NODE_ENV !== 'test') {
    sustainabilityRepository
      .ensurePgVectorCorpusSeeded()
      .then((ok) => {
        if (ok) {
          console.log('[RAG pgvector] Índice vectorial HNSW (768d) sincronizado y activo.');
        }
      })
      .catch((err) => {
        console.warn(`[RAG pgvector Warning] Sincronización diferida: ${err.message}`);
      });
  }
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
