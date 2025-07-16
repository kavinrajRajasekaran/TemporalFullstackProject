"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OrganizationControllers_1 = require("./controllers/OrganizationControllers");
const router = (0, express_1.Router)();
const workflowSignallingControllers_1 = require("./controllers/workflowSignallingControllers");
//to get all the organization created 
router.get("/organizations", OrganizationControllers_1.getAllOrganizationController);
//to create an organization
router.post('/organizations', OrganizationControllers_1.createOrganizationController);
//to update an organization 
router.patch("/organizations/:id", OrganizationControllers_1.updateOrganizationController);
//to delete an organization controller
router.delete('/organizations/:id', OrganizationControllers_1.deleteOrganizationController);
//to cancel an organization
router.post('/workflow/:workflowId/cancel', workflowSignallingControllers_1.OrganizationCancelWorkflowController);
//to update an organization 
router.post('/workflow/:workflowId/update', workflowSignallingControllers_1.OrganizationUpdateWorkflowController);
//to terminate an organization 
router.post('/workflow/:workflowId/terminate', workflowSignallingControllers_1.OrganizationTerminateWorkflowController);
exports.default = router;
