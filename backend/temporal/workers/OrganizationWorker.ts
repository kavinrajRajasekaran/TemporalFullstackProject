
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from '../activities/OrganizationActivities';
import { connectToMongo } from '../../config/db';

async function run() {
  await connectToMongo();

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
