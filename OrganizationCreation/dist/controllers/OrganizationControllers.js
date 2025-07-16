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
exports.getAllOrganizationController = getAllOrganizationController;
exports.createOrganizationController = createOrganizationController;
exports.updateOrganizationController = updateOrganizationController;
exports.deleteOrganizationController = deleteOrganizationController;
const OrganizationModel_1 = require("../models/OrganizationModel");
const workflows_1 = require("../temporal/workflows");
const TemporalClient_1 = require("../temporal/TemporalClient");
const auth0_1 = require("auth0");
const mongoose_1 = __importDefault(require("mongoose"));
function getAllOrganizationController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const management = new auth0_1.ManagementClient({
                clientId: process.env.AUTH0_CLIENT_ID,
                clientSecret: process.env.AUTH0_CLIENT_SECRET,
                domain: process.env.AUTH0_DOMAIN,
            });
            const result = yield management.organizations.getAll();
            res.status(200).send(result);
        }
        catch (err) {
            console.log(err === null || err === void 0 ? void 0 : err.message);
            res.status(500).send("Internal server error ");
        }
    });
}
function createOrganizationController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
        try {
            let organization = yield OrganizationModel_1.OrganizationModel.create({
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
            let client = yield (0, TemporalClient_1.TemporalClient)();
            let createdOrgWorkflow = yield client.workflow.start(workflows_1.createOrganizationWorkflow, {
                args: [organization],
                startDelay: "1 minutes",
                workflowId: organization.name + Date.now(),
                taskQueue: 'organizationManagement'
            });
            res.status(200).json({
                organization: organization,
                workflowId: createdOrgWorkflow.workflowId
            });
        }
        catch (err) {
            res.status(500).json({
                message: (_a = err === null || err === void 0 ? void 0 : err.message) !== null && _a !== void 0 ? _a : 'error while creating organization'
            });
        }
    });
}
function updateOrganizationController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        if (!id) {
            return res.status(400).send("Invalid organization id");
        }
        const { name, display_name, branding_logo_url, primary_color, page_background_color } = req.body;
        try {
            let update = {};
            if (name) {
                update.name = name;
            }
            if (display_name) {
                update.display_name = display_name;
            }
            if (branding_logo_url || primary_color || page_background_color) {
                update.branding = update.branding || {};
                if (branding_logo_url) {
                    update.branding.logo_url = branding_logo_url;
                }
                if (primary_color || page_background_color) {
                    update.branding.colors = update.branding.colors || {};
                    if (primary_color) {
                        update.branding.colors.primary = primary_color;
                    }
                    if (page_background_color) {
                        update.branding.colors.page_background = page_background_color;
                    }
                }
            }
            const newOrganization = yield OrganizationModel_1.OrganizationModel.findByIdAndUpdate(new mongoose_1.default.Types.ObjectId(id), update, { new: true });
            if (!newOrganization) {
                return res.status(404).send("Organization not found");
            }
            const input = {
                authId: newOrganization.authid,
                update,
                receiver: newOrganization.metadata.createdByEmail,
                id: newOrganization._id
            };
            const client = yield (0, TemporalClient_1.TemporalClient)();
            let UpdateOrgworkflow = yield client.workflow.start(workflows_1.updateOrganizationWorkflow, {
                args: [input],
                startDelay: "30 seconds",
                workflowId: newOrganization.name + '-' + Date.now(),
                taskQueue: 'organizationManagement',
            });
            res.status(200).json({
                workflowId: UpdateOrgworkflow.workflowId
            });
        }
        catch (err) {
            res.status(500).send((_a = err === null || err === void 0 ? void 0 : err.message) !== null && _a !== void 0 ? _a : "Error while updating organization");
        }
    });
}
function deleteOrganizationController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        if (!id) {
            res.status(400).send('error while deleting the user');
            return;
        }
        try {
            const org = yield OrganizationModel_1.OrganizationModel.findByIdAndUpdate(new mongoose_1.default.Types.ObjectId(id), {
                "status": "deleting"
            });
            const input = {
                authId: org.authid,
                receiver: org.metadata.createdByEmail,
                id: org._id
            };
            const client = yield (0, TemporalClient_1.TemporalClient)();
            let orgworkflow = yield client.workflow.start(workflows_1.deleteOrganizationWorkflow, {
                args: [input],
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
    });
}
