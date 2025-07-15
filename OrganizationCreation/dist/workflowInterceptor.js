"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorHandlingInterceptor = createErrorHandlingInterceptor;
const workflow_1 = require("@temporalio/workflow");
const { statusUpdateActivity } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: '2 minutes'
});
function createErrorHandlingInterceptor(workflowType, id) {
    return {
        scheduleActivity(input, next) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield next(input);
                }
                catch (err) {
                    console.log(`Activity ${input.activityType} failed in workflow ${workflowType}`);
                    yield statusUpdateActivity(id, 'failure');
                    throw err;
                }
            });
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
