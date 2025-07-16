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
exports.terminateWorkflowController = terminateWorkflowController;
exports.cancelWorkflowController = cancelWorkflowController;
exports.updateWorkflowController = updateWorkflowController;
const workflows_1 = require("../temporal/workflows");
const client_1 = require("../temporal/client");
function terminateWorkflowController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { workflowId } = req.params;
        try {
            const Client = yield (0, client_1.TemporalClient)();
            const terminateHandler = Client.workflow.getHandle(workflowId);
            yield terminateHandler.terminate("terminating");
            res.status(204).send("successfully terminated");
        }
        catch (err) {
            res.json({
                statusCode: err.status,
                message: err === null || err === void 0 ? void 0 : err.message
            });
        }
    });
}
function cancelWorkflowController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { workflowId } = req.params;
        try {
            const Client = yield (0, client_1.TemporalClient)();
            const cancelHandler = Client.workflow.getHandle(workflowId);
            yield cancelHandler.cancel();
            res.status(204).send("successfully cancel request send ");
        }
        catch (err) {
            res.json({
                statusCode: err.status,
                message: err === null || err === void 0 ? void 0 : err.message
            });
        }
    });
}
function updateWorkflowController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { workflowId } = req.params;
        const { display_name } = req.body;
        if (!display_name) {
            res.status(400).json('insufficient data to send the signal');
        }
        try {
            const Client = yield (0, client_1.TemporalClient)();
            const updateHandler = Client.workflow.getHandle(workflowId);
            yield updateHandler.signal(workflows_1.updateOrgSignal, display_name);
            res.status(200).send("Signal sent successfully");
        }
        catch (err) {
            res.json({
                statusCode: err.status,
                message: err === null || err === void 0 ? void 0 : err.message
            });
        }
    });
}
