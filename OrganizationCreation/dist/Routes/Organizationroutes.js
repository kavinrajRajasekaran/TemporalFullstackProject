"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OrganizationControllers_1 = require("../controllers/OrganizationControllers");
const router = (0, express_1.Router)();
const OrganizationWorkflowSignallingControllers_1 = require("../controllers/OrganizationWorkflowSignallingControllers");
//to get all the organization created 
router.get("/", OrganizationControllers_1.getAllOrganizationController);
//to create an organization
router.post('/', OrganizationControllers_1.createOrganizationController);
//to update an organization 
router.patch("/:id", OrganizationControllers_1.updateOrganizationController);
//to delete an organization controller
router.delete('/:id', OrganizationControllers_1.deleteOrganizationController);
//to cancel an organization
router.post('/workflow/:workflowId/cancel', OrganizationWorkflowSignallingControllers_1.OrganizationCancelWorkflowController);
//to update an organization using workflowId 
router.put('/workflow/:workflowId/update', OrganizationWorkflowSignallingControllers_1.OrganizationUpdateWorkflowController);
//to terminate an organization using workflowId
router.post('/workflow/:workflowId/terminate', OrganizationWorkflowSignallingControllers_1.OrganizationTerminateWorkflowController);
exports.default = router;
