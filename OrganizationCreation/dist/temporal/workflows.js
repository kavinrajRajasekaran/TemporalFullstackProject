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
const workflow_1 = require("@temporalio/workflow");
exports.updateOrgSignal = (0, workflow_1.defineUpdate)('updateOrgSignal');
const { OrganizationCreationInAuthActivity, sendEmailToUserActivity, deleteInAuth0Activity, updateOrganizationInDBActivity, OrganizationStatusUpdateInDBActivity, deleteInDBActivity, UpdateOrganizationAuthActivity } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "2 minutes",
    retry: {
        maximumAttempts: 5,
        initialInterval: '5s',
        maximumInterval: '5 seconds',
        backoffCoefficient: 2,
    }
});
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
                updatedOrgData = yield updateOrganizationInDBActivity(updatedOrgData, Organization._id);
                Organization = updatedOrgData;
            }
            yield OrganizationStatusUpdateInDBActivity(Organization._id, 'provisoning');
            let authId = yield OrganizationCreationInAuthActivity(Organization);
            yield sendEmailToUserActivity({ to: Organization.metadata.createdByEmail, subject: 'your organization created successfully' });
            yield OrganizationStatusUpdateInDBActivity(Organization._id, 'succeed', undefined, authId);
        }
        catch (err) {
            if (Organization._id !== undefined) {
                yield OrganizationStatusUpdateInDBActivity(Organization._id, 'failure', undefined);
            }
            throw err;
        }
    });
}
function updateOrganizationWorkflow(input) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield OrganizationStatusUpdateInDBActivity(input.id, 'updating');
            yield UpdateOrganizationAuthActivity(input.authId, input.update);
            yield OrganizationStatusUpdateInDBActivity(input.id, 'succeed');
            yield sendEmailToUserActivity({ to: input.receiver, subject: 'updated your organization' });
        }
        catch (err) {
            yield OrganizationStatusUpdateInDBActivity(input.id, 'failure', 'failed while updating the organization');
            throw err;
        }
    });
}
function deleteOrganizationWorkflow(input) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield deleteInAuth0Activity(input.authId);
            yield deleteInDBActivity(input.id);
            yield sendEmailToUserActivity({ to: input.receiver, subject: "your org is successfully deleted" });
        }
        catch (err) {
            yield OrganizationStatusUpdateInDBActivity(input.id, 'failure', "failed while deleting organization");
            throw err;
        }
    });
}
