
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from '../activities/OrganizationActivities';
import { connectToMongo } from '../../config/db';
const DB_URI =process.env.DB_URI!
async function run() {
  await connectToMongo(DB_URI);

  const address = process.env.TEMPORAL_ADDRESS || 'temporal:7233';
  const connection = await NativeConnection.connect({ address });

  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('../workflows/OrganizationWorkflow'),
    activities,
    taskQueue: 'organizationManagement'
  });

  console.log('Organization Worker is running...');
  await worker.run();
}

run().catch((err) => {
  console.error(' Organization Worker failed: ', err);
  process.exit(1);
});
