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
exports.updateOrgSignal = void 0;
exports.createOrganizationWorkflow = createOrganizationWorkflow;
exports.updateOrganizationWorkflow = updateOrganizationWorkflow;
exports.deleteOrganizationWorkflow = deleteOrganizationWorkflow;
exports.ChildEmailSendingWorkflow = ChildEmailSendingWorkflow;
const workflow_1 = require("@temporalio/workflow");
exports.updateOrgSignal = (0, workflow_1.defineUpdate)('updateOrgSignal');
const { OrganizationCreationInAuthActivity, sendEmailToUserActivity, deleteInAuth0Activity, updateOrganizationInDBActivity, OrganizationStatusUpdateInDBActivity, deleteInDBActivity, UpdateOrganizationAuthActivity } = (0, workflow_1.proxyActivities)({
    retry: {
        initialInterval: '1 second',
        maximumInterval: '30 seconds',
        backoffCoefficient: 2,
        maximumAttempts: 5,
    },
    startToCloseTimeout: '2 minutes',
});
//to create an organization
function createOrganizationWorkflow(Organization) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let updatedOrgData;
            let timeout = false;
            (0, workflow_1.setHandler)(exports.updateOrgSignal, (newData) => {
                updatedOrgData = newData;
                if (timeout) {
                    return "failed to update ";
                }
                return 'successfully updated';
            });
            const updateReceived = yield (0, workflow_1.condition)(() => updatedOrgData !== undefined, '1 minute');
            timeout = true;
            if (updateReceived && updatedOrgData) {
                updatedOrgData = yield updateOrganizationInDBActivity({ organization: updatedOrgData, id: Organization._id });
                Organization = updatedOrgData;
            }
            yield OrganizationStatusUpdateInDBActivity({ id: Organization._id, status: 'provisoning' });
            let authId = yield OrganizationCreationInAuthActivity(Organization);
            yield OrganizationStatusUpdateInDBActivity({ id: Organization._id, status: 'succeed', failureReason: undefined, authid: authId });
            //   // await sendEmailToUserActivity({ to: Organization.metadata.createdByEmail, subject: 'your organization created successfully' })
            //  let child= await ChildEmailSendingWorkflow({ to: Organization.metadata.createdByEmail, subject: 'your organization created successfully' })
            //   await child.result()
            let child = yield (0, workflow_1.startChild)(ChildEmailSendingWorkflow, {
                args: [{ to: Organization.metadata.createdByEmail, subject: 'your organization created successfully' }]
            });
            console.log(yield child.result());
        }
        catch (err) {
            if (Organization._id !== undefined) {
                yield OrganizationStatusUpdateInDBActivity({ id: Organization._id, status: 'failure' });
            }
            throw err;
        }
    });
}
//to update an organization
function updateOrganizationWorkflow(input) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield OrganizationStatusUpdateInDBActivity({ id: input.id, status: 'updating' });
            yield UpdateOrganizationAuthActivity({ authid: input.authId, update: input.update });
            yield OrganizationStatusUpdateInDBActivity({ id: input.id, status: 'succeed' });
            yield sendEmailToUserActivity({ to: input.receiver, subject: 'updated your organization' });
        }
        catch (err) {
            yield OrganizationStatusUpdateInDBActivity({ id: input.id, status: 'failure', failureReason: 'failed while updating the organization' });
            throw err;
        }
    });
}
//to delete an organization
function deleteOrganizationWorkflow(input) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield deleteInAuth0Activity(input.authId);
            yield deleteInDBActivity(input.id);
            yield sendEmailToUserActivity({ to: input.receiver, subject: "your org is successfully deleted" });
        }
        catch (err) {
            yield OrganizationStatusUpdateInDBActivity({ id: input.id, status: 'failure', failureReason: "failed while deleting organization" });
            throw err;
        }
    });
}
function ChildEmailSendingWorkflow(input) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield sendEmailToUserActivity(input);
            return "email sent successfully";
        }
        catch (err) {
            throw err;
        }
    });
}
