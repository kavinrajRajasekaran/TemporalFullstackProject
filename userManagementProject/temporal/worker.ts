// temporal/worker.ts

import { Worker } from '@temporalio/worker';
import * as activities from './activity';
async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'user-management'
  });

  console.log('Temporal Worker is running...');
  await worker.run();
}

run().catch((err) => {
  console.error('Worker failed: ', err);
  process.exit(1);
});
