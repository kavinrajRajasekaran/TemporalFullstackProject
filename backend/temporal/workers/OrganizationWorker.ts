
import { Worker } from '@temporalio/worker';
import * as activities from '../activities/OrganizationActivities';
import { connectToMongo } from '../../config/db';
async function run() {
  await connectToMongo()
  const worker = await Worker.create({

    workflowsPath: require.resolve('../workflows/OrganizationWorkflow'),
    activities,
    taskQueue: 'organizationManagement'
  });

  console.log('Temporal Worker is running...');
  await worker.run();
}

run().catch((err) => {
  console.error('Worker failed: ', err);
  process.exit(1);
});
