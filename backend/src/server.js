import 'dotenv/config';
import http from 'http';
import app from './app.js';
import socketService from './services/notifications/socketService.js';
import { initContractCronJob } from './jobs/contractCronJob.js';
import { initPerformanceCronJob } from './jobs/performanceCronJob.js';
import { initRequestMonitorCronJob } from './jobs/requestMonitorCronJob.js';
import { initDocumentCronJob } from './jobs/documentCronJob.js';
import { initPayrollCronJob } from './jobs/payrollCronJob.js';

// Init background jobs
initContractCronJob();
initPerformanceCronJob();
initRequestMonitorCronJob();
initDocumentCronJob();
initPayrollCronJob();

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Inicializar Socket.io
socketService.init(server);

import { getIntelligenceDashboard } from './services/intelligenceService.js';

server.listen(PORT, () => {
  console.log(`Backend EMPLIFI corriendo en http://localhost:${PORT}`);
  console.log("Server updated at " + new Date().toISOString());
  // Pre-cargar caché de inteligencia de forma asíncrona
  getIntelligenceDashboard().catch(err => console.error('[Cache Warmup Error]:', err.message));
});
