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
exports.createOrgWorkflow = createOrgWorkflow;
exports.updateWorkflow = updateWorkflow;
exports.deleteWorkflow = deleteWorkflow;
const workflow_1 = require("@temporalio/workflow");
const { OrgCreateActivity, sendEmailActivity, updateActivity, deleteActivity } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "2 minutes",
    retry: {
        maximumAttempts: 5,
        initialInterval: '5s',
        maximumInterval: '5 seconds',
        backoffCoefficient: 1,
    }
});
const { statusUpdateActivity, deleteInDBActivity } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "2 minutes",
    retry: {
        maximumAttempts: 10,
        initialInterval: '5s',
        maximumInterval: '5 seconds',
        backoffCoefficient: 1,
    }
});
function createOrgWorkflow(Org, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield statusUpdateActivity(id, 'provisoning');
            let authId = yield OrgCreateActivity(Org);
            yield sendEmailActivity({ to: Org.metadata.createdByEmail, subject: 'your organization created successfully' });
            yield statusUpdateActivity(id, 'succeed', undefined, authId);
        }
        catch (err) {
            yield statusUpdateActivity(id, 'failure', undefined);
            throw err;
        }
    });
}
function updateWorkflow(authId, update, receiver, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield statusUpdateActivity(id, 'updating');
            yield updateActivity(authId, update);
            yield sendEmailActivity({ to: receiver, subject: 'updated your organization' });
            yield statusUpdateActivity(id, 'succeed');
        }
        catch (err) {
            yield statusUpdateActivity(id, 'failure', 'failed while updating the organization');
            throw err;
        }
    });
}
function deleteWorkflow(authId, receiver, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield deleteActivity(authId);
            yield deleteInDBActivity(id);
            yield sendEmailActivity({ to: receiver, subject: "your org is successfully deleted" });
        }
        catch (err) {
            yield statusUpdateActivity(id, 'failure', "failed while deleting organization");
            throw err;
        }
    });
}
