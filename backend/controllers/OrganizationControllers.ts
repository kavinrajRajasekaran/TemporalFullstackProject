import { OrganizationModel, IOrganization, IOrganizationUpdate } from '../models/OrganizationModel'
import { Request, Response } from 'express'
import { createOrganizationWorkflow, deleteOrganizationWorkflow, updateOrganizationWorkflow } from '../temporal/workflows/OrganizationWorkflow'
import { TemporalClient } from '../temporal/TemporalClient'
import { ManagementClient } from 'auth0'
import mongoose from 'mongoose'
import { OrganizationDeleteWorkflowInput, OrganizationupdateWorkflowInput } from '../utils/shared'



export async function getAllOrganizationController(req: Request, res: Response) {
    try {


        const management = new ManagementClient({
            clientId: process.env.AUTH0_CLIENT_ID!,
            clientSecret: process.env.AUTH0_CLIENT_SECRET!,
            domain: process.env.AUTH0_DOMAIN!,
        })

        const result = await management.organizations.getAll();

        res.status(200).json(result)

    }

    catch (err: any) {
        console.log(err?.message)
        res.status(500).json({message:"Failed to fetch organization result"})

    }
}



export async function createOrganizationController(req: Request, res: Response) {


     try {
    const { name, display_name, branding_logo_url, createdByEmail, primary_color, page_background_color } = req.body

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



   


        let organization: IOrganization = await OrganizationModel.create({


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



        })
        let client = await TemporalClient()

        let createdOrgWorkflow = await client.workflow.start(createOrganizationWorkflow, {
            args: [organization],
            startDelay: "1 minutes",
            workflowId: organization.name + Date.now(),
            taskQueue: 'organizationManagement'

        })
        res.status(200).json({
            organization: organization,
            workflowId: createdOrgWorkflow.workflowId
        })

    }
    catch (err: any) {

        res.status(500).json({
            message:'failed to create organization'
        })
    }


}



export async function updateOrganizationController(req: Request, res: Response) {

 try {
    const { id } = req.params;
    if (!id) {
       res.status(400).json({message:"Invalid organization id"});
        return 
    }

    const {
        name,
        display_name,
        branding_logo_url,
        primary_color,
        page_background_color
    } = req.body;

   
        let update: IOrganizationUpdate = {};

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

        const updatedOrganization = await OrganizationModel.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            update,
            { new: true }
        );

        if (!updatedOrganization) {
            return res.status(404).send("Organization not found");
        }

        const input: OrganizationupdateWorkflowInput = {
            authId: updatedOrganization.authid,
            update,
            receiver: updatedOrganization.metadata.createdByEmail,
            id: updatedOrganization._id
        };

        const client = await TemporalClient();

        let UpdateOrgworkflow = await client.workflow.start(updateOrganizationWorkflow, {
            args: [input],
            startDelay: "30 seconds",
            workflowId: "updatingOrg"+updatedOrganization.name + '-' + Date.now(),
            taskQueue: 'organizationManagement',
        });

        res.status(200).json({
            workflowId: UpdateOrgworkflow.workflowId
        });
    } catch (err: any) {
        console.log(err.message)
        res.status(500).json({message: " failed update organization"});
    }



}


export async function deleteOrganizationController(req: Request, res: Response) {
     try { 
    
    const { id } = req.params
    if (!id) {
        res.status(400).json({
            message:"organization id is missing"
        })
        return
    }
   
        const org = await OrganizationModel.findByIdAndUpdate(new mongoose.Types.ObjectId(id), {
            "status": "deleting"
        })
        if(!org){
            res.status(404).json({
                message:"organization not found "
            })
        }
        const input: OrganizationDeleteWorkflowInput = {
            authId: org!.authid,

            receiver: org!.metadata.createdByEmail,
            id: org!._id
        }
        const client = await TemporalClient()
        let orgworkflow = await client.workflow.start(deleteOrganizationWorkflow, {
            args: [input],
            startDelay: "30 seconds",
            workflowId: "deletingworkflow-"+org!.name+"-"+Date.now(),
            taskQueue: 'organizationManagement'
        })
        res.status(200).json({
            workflowId: orgworkflow.workflowId
        })
    }
    catch (err:any) {
        res.status(500).json({
           
            message:"failed to delete the organization"
        })
    }

}


