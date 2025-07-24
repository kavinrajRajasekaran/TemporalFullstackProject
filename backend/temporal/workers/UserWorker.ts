import { Worker,NativeConnection } from '@temporalio/worker';
import * as activities from '../activities/Useractivities';
import { connectToMongo } from "../../config/db";
const DB_URI =process.env.DB_URI!
async function run() {
  const address = process.env.TEMPORAL_ADDRESS || 'temporal:7233';
  const connection = await NativeConnection.connect({ address });

  await connectToMongo(DB_URI)
  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('../workflows/UserWorkflows'),
    activities,
    taskQueue: 'user-management'
  });  


  console.log('User Worker is running...');
  await worker.run();
}

run().catch((err) => {
  console.error('User Worker failed: ', err);
  process.exit(1);
});
