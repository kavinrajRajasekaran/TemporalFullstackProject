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
exports.OrganizationTerminateWorkflowController = OrganizationTerminateWorkflowController;
exports.OrganizationCancelWorkflowController = OrganizationCancelWorkflowController;
exports.OrganizationUpdateWorkflowController = OrganizationUpdateWorkflowController;
const TemporalClient_1 = require("../temporal/TemporalClient");
const handleControllerError_1 = require("../Errors/handleControllerError");
function OrganizationTerminateWorkflowController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { workflowId } = req.params;
        try {
            const Client = yield (0, TemporalClient_1.TemporalClient)();
            const terminateHandler = Client.workflow.getHandle(workflowId);
            yield terminateHandler.terminate("terminating");
            res.status(204).send("successfully terminated");
        }
        catch (err) {
            return (0, handleControllerError_1.handleControllerError)(err, res, "Failed to terminate workflow");
        }
    });
}
function OrganizationCancelWorkflowController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { workflowId } = req.params;
        try {
            const Client = yield (0, TemporalClient_1.TemporalClient)();
            const cancelHandler = Client.workflow.getHandle(workflowId);
            yield cancelHandler.cancel();
            res.status(204).send("successfully cancel request send ");
        }
        catch (err) {
            return (0, handleControllerError_1.handleControllerError)(err, res, "Failed to cancel workflow");
        }
    });
}
function OrganizationUpdateWorkflowController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { workflowId } = req.params;
            const { name, display_name, branding_logo_url, createdByEmail, primary_color, page_background_color } = req.body;
            const requiredFields = [
                "name",
                "display_name",
                "branding_logo_url",
                "createdByEmail",
                "primary_color",
                "page_background_color"
            ];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            if (missingFields.length > 0) {
                return res.status(400).json({
                    error: "Missing required fields",
                    missing: missingFields
                });
            }
            let organization = {
                "name": name,
                "display_name": display_name,
                "branding": {
                    "logo_url": branding_logo_url
                },
                "metadata": {
                    "createdByEmail": createdByEmail,
                },
                "colors": {
                    "page_background": page_background_color,
                    "primary": primary_color
                },
                status: "provisoning"
            };
            const Client = yield (0, TemporalClient_1.TemporalClient)();
            const OrgupdateHandler = Client.workflow.getHandle(workflowId);
            let updatestatus = yield OrgupdateHandler.executeUpdate("updateOrgSignal", {
                args: [organization]
            });
            res.status(200).json({
                message: "Update signal sent",
                result: updatestatus
            });
        }
        catch (err) {
            return (0, handleControllerError_1.handleControllerError)(err, res, "error while sending update signal to workflow");
        }
    });
}
