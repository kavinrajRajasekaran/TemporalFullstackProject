import { Worker } from '@temporalio/worker';
import * as activities from '../activities/Useractivities';
import { connectToMongo } from "../../config/db";
async function run() {
  await connectToMongo()
  const worker = await Worker.create({
    workflowsPath: require.resolve('../workflows/UserWorkflows'),
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
