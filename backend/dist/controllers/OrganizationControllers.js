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
const OrganizationWorkflow_1 = require("../temporal/workflows/OrganizationWorkflow");
const TemporalClient_1 = require("../temporal/TemporalClient");
const auth0_1 = require("auth0");
const mongoose_1 = __importDefault(require("mongoose"));
const handleControllerError_1 = require("../Errors/handleControllerError");
function getAllOrganizationController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const management = new auth0_1.ManagementClient({
                clientId: process.env.AUTH0_CLIENT_ID,
                clientSecret: process.env.AUTH0_CLIENT_SECRET,
                domain: process.env.AUTH0_DOMAIN,
            });
            const result = yield management.organizations.getAll();
            if (result && Array.isArray(result.data)) {
                res.status(200).json(result.data);
            }
            else {
                res.status(200).json(Array.isArray(result) ? result : [result]);
            }
        }
        catch (err) {
            return (0, handleControllerError_1.handleControllerError)(err, res, "Failed to fetch organization result");
        }
    });
}
function createOrganizationController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
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
            // Duplicate check
            const existing = yield OrganizationModel_1.OrganizationModel.findOne({ name });
            if (existing) {
                return res.status(409).json({ error: 'Organization already exists' });
            }
            let organization = {
                _id: 'mocked-org-id',
                name,
                display_name,
                branding: { logo_url: branding_logo_url },
                metadata: { createdByEmail },
                colors: { primary: primary_color, page_background: page_background_color },
                status: "provisoning"
            };
            organization = yield OrganizationModel_1.OrganizationModel.create(organization);
            let client = yield (0, TemporalClient_1.TemporalClient)();
            let createdOrgWorkflow = yield client.workflow.start(OrganizationWorkflow_1.createOrganizationWorkflow, {
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
            // Always return 500 for workflow errors
            return (0, handleControllerError_1.handleControllerError)(err, res, "organization creation failed");
        }
    });
}
function updateOrganizationController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ error: "Invalid organization id" });
                return;
            }
            const { name, display_name, branding_logo_url, primary_color, page_background_color } = req.body;
            let update = {};
            if (name)
                update.name = name;
            if (display_name)
                update.display_name = display_name;
            if (branding_logo_url || primary_color || page_background_color) {
                update.branding = update.branding || {};
                if (branding_logo_url)
                    update.branding.logo_url = branding_logo_url;
                if (primary_color || page_background_color) {
                    update.branding.colors = update.branding.colors || {};
                    if (primary_color)
                        update.branding.colors.primary = primary_color;
                    if (page_background_color)
                        update.branding.colors.page_background = page_background_color;
                }
            }
            const updatedOrganization = yield OrganizationModel_1.OrganizationModel.findByIdAndUpdate(new mongoose_1.default.Types.ObjectId(id), update, { new: true });
            if (!updatedOrganization) {
                return res.status(404).send("organization not found");
            }
            const org = updatedOrganization;
            const input = {
                authId: org.authid,
                update,
                receiver: org.metadata.createdByEmail,
                id: org._id
            };
            const client = yield (0, TemporalClient_1.TemporalClient)();
            let UpdateOrgworkflow = yield client.workflow.start(OrganizationWorkflow_1.updateOrganizationWorkflow, {
                args: [input],
                startDelay: "30 seconds",
                workflowId: "updatingOrg" + org.name + '-' + Date.now(),
                taskQueue: 'organizationManagement',
            });
            res.status(200).json({
                message: 'Organization update initiated'
            });
        }
        catch (err) {
            return (0, handleControllerError_1.handleControllerError)(err, res, "failed update organization");
        }
    });
}
function deleteOrganizationController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: "organization id is missing"
                });
                return;
            }
            const org = yield OrganizationModel_1.OrganizationModel.findByIdAndUpdate(new mongoose_1.default.Types.ObjectId(id), {
                "status": "deleting"
            });
            if (!org) {
                res.status(404).send("organization not found");
                return;
            }
            const orgResult = org;
            const input = {
                authId: orgResult.authid,
                receiver: orgResult.metadata.createdByEmail,
                id: orgResult._id
            };
            const client = yield (0, TemporalClient_1.TemporalClient)();
            let orgworkflow = yield client.workflow.start(OrganizationWorkflow_1.deleteOrganizationWorkflow, {
                args: [input],
                startDelay: "30 seconds",
                workflowId: "deletingworkflow-" + orgResult.name + "-" + Date.now(),
                taskQueue: 'organizationManagement'
            });
            res.status(200).json({
                message: 'Organization deletion initiated'
            });
        }
        catch (err) {
            return (0, handleControllerError_1.handleControllerError)(err, res, "failed to delete the organization");
        }
    });
}
