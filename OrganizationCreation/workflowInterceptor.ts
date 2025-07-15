import {  
  ActivityInput,  
  Next,  
  WorkflowOutboundCallsInterceptor,  
  proxyActivities
} from '@temporalio/workflow';  
import type * as activities from './temporal/activity';
import mongoose from 'mongoose';

const {statusUpdateActivity}=proxyActivities<typeof activities>({
    startToCloseTimeout:'2 minutes'
})

export function createErrorHandlingInterceptor(workflowType: string, id: mongoose.Types.ObjectId): WorkflowOutboundCallsInterceptor {
  return {
    async scheduleActivity(
      input,
      next: Next<WorkflowOutboundCallsInterceptor, 'scheduleActivity'>
    ) {
      try {
        return await next(input);
      } catch (err) {
        console.log(`Activity ${input.activityType} failed in workflow ${workflowType}`);
        await statusUpdateActivity(id, 'failure');
        throw err;
      }
    },
  };
} 



// const { statusUpdateActivity } = proxyActivities<typeof activities>({
//   startToCloseTimeout: '1 minute',
// });

// export function createErrorHandlingInterceptor(org: IOrg, id: mongoose.Types.ObjectId): WorkflowOutboundCallsInterceptor {
//    return {
//     async executeActivity(input, next: Next<WorkflowOutboundCallsInterceptor, 'executeActivity'>) {
//       try {
//         return await next(input);
//       } catch (err) {
//         console.log(`Activity ${input.activityType} failed, updating status...`);
//         await statusUpdateActivity(id, 'failure');
//         throw err;
//       }
//     },
//   };
// }
