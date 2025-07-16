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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const OrgModel_1 = require("./utils/OrgModel");
const express_1 = require("express");
const workflows_1 = require("./temporal/workflows");
const client_1 = require("./utils/client");
const client_2 = require("./utils/client");
const router = (0, express_1.Router)();
const mongoose_1 = __importDefault(require("mongoose"));
router.get("/organizations", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, client_2.getAll)();
        res.status(200).send(result);
    }
    catch (err) {
        console.log(err === null || err === void 0 ? void 0 : err.message);
        res.status(500).send("Internal server error ");
    }
}));
router.post('/organizations', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, display_name, branding_logo_url, createdByEmail, primary_color, page_background_color } = req.body;
    if (!name || !display_name || !branding_logo_url || !createdByEmail || !primary_color || !page_background_color) {
        res.status(400).json('insufficient data to create an organization');
    }
    try {
        let organization = yield OrgModel_1.OrgModel.create({
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
        });
        let client = yield (0, client_1.getClient)();
        let createdOrg = yield client.workflow.start(workflows_1.createOrgWorkflow, {
            args: [organization, organization._id],
            startDelay: "1 minutes",
            workflowId: organization.name + Date.now(),
            taskQueue: 'organizationManagement'
        });
        res.status(200).json({
            workflowId: createdOrg.workflowId
        });
    }
    catch (err) {
        console.error("Error message:", err === null || err === void 0 ? void 0 : err.message);
        console.error("Stack trace:", err === null || err === void 0 ? void 0 : err.stack);
        console.error("Full error object:", err);
        console.log(err);
        throw new Error("error while creating the organization ");
    }
}));
router.patch("/organizations/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        return res.status(400).send("Invalid userId");
    }
    const { name, display_name } = req.body;
    try {
        let update = {};
        if (name)
            update.name = name;
        if (display_name)
            update.display_name = display_name;
        const updated = yield OrgModel_1.OrgModel.findByIdAndUpdate(new mongoose_1.default.Types.ObjectId(id), update, { new: true });
        yield OrgModel_1.OrgModel.findByIdAndUpdate(new mongoose_1.default.Types.ObjectId(id), {
            "status": 'updating'
        });
        if (!updated) {
            return res.status(404).send("Organization not found");
        }
        const client = yield (0, client_1.getClient)();
        console.log(updated.authid, update, updated.metadata.createdByEmail, updated._id);
        let updateworkflow = yield client.workflow.start(workflows_1.updateWorkflow, {
            args: [updated.authid, update, updated.metadata.createdByEmail, updated._id],
            startDelay: "30 seconds",
            workflowId: updated.name + '-' + Date.now(),
            taskQueue: 'organizationManagement',
        });
        res.status(200).json({
            workflowId: updateworkflow.workflowId
        });
    }
    catch (err) {
        res.status(500).send(err === null || err === void 0 ? void 0 : err.message);
    }
}));
router.delete('/organizations/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).send('error while deleting the user');
        return;
    }
    try {
        const org = yield OrgModel_1.OrgModel.findByIdAndUpdate(new mongoose_1.default.Types.ObjectId(id), {
            "status": "deleting"
        });
        const client = yield (0, client_1.getClient)();
        let orgworkflow = yield client.workflow.start(workflows_1.deleteWorkflow, {
            args: [org.authid, org.metadata.createdByEmail, org._id],
            startDelay: "30 seconds",
            workflowId: "deletingworkflow" + Date.now(),
            taskQueue: 'organizationManagement'
        });
        res.status(200).json({
            workflowId: orgworkflow.workflowId
        });
    }
    catch (err) {
        throw new Error(err === null || err === void 0 ? void 0 : err.message);
    }
}));
router.post('workflow/cancel/:workflowId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { workflowId } = req.params;
    try {
        const client = yield (0, client_1.getClient)();
        const workflow = client.workflow.getHandle(workflowId);
        yield workflow.cancel();
        res.status(204).send("successfully cancel request send ");
    }
    catch (err) {
        throw err;
    }
}));
router.post('/workflow/:workflowId/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { workflowId } = req.params;
    const { display_name } = req.body;
    if (!display_name) {
        res.status(400).json('insufficient data to send the signal');
    }
    try {
        const client = yield (0, client_1.getClient)();
        const handle = client.workflow.getHandle(workflowId);
        yield handle.signal(workflows_1.updateOrgSignal, display_name);
        res.status(200).send("Signal sent successfully");
    }
    catch (err) {
        console.error("Signal error:", err);
        res.status(500).send("Failed to send signal");
    }
}));
router.post('/workflow/:workflowId/terminate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { workflowId } = req.params;
    try {
        const client = yield (0, client_1.getClient)();
        const workflow = client.workflow.getHandle(workflowId);
        yield workflow.terminate("terminating");
        res.status(204).send("successfully terminated");
    }
    catch (err) {
        throw err;
    }
}));
exports.default = router;
