import { OrganizationModel, IOrganization, IOrganizationUpdate } from '../models/OrganizationModel'
import { Request, Response } from 'express'
import { createOrganizationWorkflow, deleteOrganizationWorkflow, updateOrganizationWorkflow } from '../temporal/workflows/OrganizationWorkflow'
import { TemporalClient } from '../temporal/TemporalClient'
import { ManagementClient } from 'auth0'
import mongoose from 'mongoose'
import { OrganizationDeleteWorkflowInput, OrganizationupdateWorkflowInput } from '../utils/shared'
import { handleControllerError } from '../Errors/handleControllerError';

export async function getAllOrganizationController(req: Request, res: Response) {
    try {
        const management = new ManagementClient({
            clientId: process.env.AUTH0_CLIENT_ID!,
            clientSecret: process.env.AUTH0_CLIENT_SECRET!,
            domain: process.env.AUTH0_DOMAIN!,
        })
        const result = await management.organizations.getAll();
       
        
            res.status(200).json(result);
       
    } catch (err: any) {
        return handleControllerError(err, res, "Failed to fetch organization result");
    }
}

export async function createOrganizationController(req: Request, res: Response) {
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
        const existing = await OrganizationModel.findOne({ name });
        if (existing) {
            return res.status(409).json({ error: 'Organization already exists' });
        }
        
        let organization: IOrganization = {
             
            name,
            display_name,
            branding: { logo_url: branding_logo_url },
            metadata: { createdByEmail },
            colors: { primary: primary_color, page_background: page_background_color },
            status: "provisoning"
        } as any;
        
        organization = await OrganizationModel.create(organization);
        let client = await TemporalClient();
        let createdOrgWorkflow = await client.workflow.start(createOrganizationWorkflow, {
            args: [organization],
            
            workflowId: organization.name + Date.now(),
            taskQueue: 'organizationManagement'
        });
        res.status(200).json({
            organization: organization,
            workflowId: createdOrgWorkflow.workflowId
        });
    } catch (err: any) {
        console.error('Create org error:', err);
       
        return handleControllerError(err, res, "organization creation failed");
    }
}

export async function updateOrganizationController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "Invalid organization id" });
            return;
        }
        const {
            name,
            display_name,
            branding_logo_url,
            primary_color,
            page_background_color
        } = req.body;
        let update: IOrganizationUpdate = {};
        if (name) update.name = name;
        if (display_name) update.display_name = display_name;
        if (branding_logo_url || primary_color || page_background_color) {
            update.branding = update.branding || {};
            if (branding_logo_url) update.branding.logo_url = branding_logo_url;
            if (primary_color || page_background_color) {
                update.branding.colors = update.branding.colors || {};
                if (primary_color) update.branding.colors.primary = primary_color;
                if (page_background_color) update.branding.colors.page_background = page_background_color;
            }
        }
        
        const updatedOrganization = await OrganizationModel.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            update,
            { new: true }
        );
        
        if (!updatedOrganization) {
            return res.status(404).send("organization not found");
        }
        const org = updatedOrganization;
        const input: OrganizationupdateWorkflowInput = {
            authId: org.authid,
            update,
            receiver: org.metadata.createdByEmail,
            id: org._id
        };
        const client = await TemporalClient();
        let UpdateOrgworkflow = await client.workflow.start(updateOrganizationWorkflow, {
            args: [input],
            
            workflowId: "updatingOrg" + org.name + '-' + Date.now(),
            taskQueue: 'organizationManagement',
        });
        res.status(200).json({
            message: 'Organization update initiated'
        });
    } catch (err: any) {
        return handleControllerError(err, res, "failed update organization");
    }
}

export async function deleteOrganizationController(req: Request, res: Response) {
    try {
        const { id } = req.params
        if (!id) {
            res.status(400).json({
                error: "organization id is missing"
            })
            return
        }
       
        const org = await OrganizationModel.findByIdAndUpdate(new mongoose.Types.ObjectId(id), {
            "status": "deleting"
        });
       
        if (!org) {
            res.status(404).send("organization not found");
            return;
        }
        const orgResult = org;
        const input: OrganizationDeleteWorkflowInput = {
            authId: orgResult!.authid,
            receiver: orgResult!.metadata.createdByEmail,
            id: orgResult!._id
        }
        const client = await TemporalClient()
        let orgworkflow = await client.workflow.start(deleteOrganizationWorkflow, {
            args: [input],
            
            workflowId: "deletingworkflow-" + orgResult!.name + "-" + Date.now(),
            taskQueue: 'organizationManagement'
        })
        res.status(200).json({
            message: 'Organization deletion initiated'
        });
    } catch (err: any) {
        return handleControllerError(err, res, "failed to delete the organization");
    }
}



