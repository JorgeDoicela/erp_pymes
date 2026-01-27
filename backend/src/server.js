import app from './app.js';
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

app.listen(PORT, () => {
  console.log(`Backend EMPLIFI corriendo en http://localhost:${PORT}`);
  console.log("Server updated at " + new Date().toISOString());
});
