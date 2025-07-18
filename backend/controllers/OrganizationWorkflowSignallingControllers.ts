import { Request, Response } from 'express'
import { TemporalClient } from '../temporal/TemporalClient'
import { IOrganization } from '../models/OrganizationModel'

export async function OrganizationTerminateWorkflowController(req: Request, res: Response) {
    const { workflowId } = req.params
    try {

        const Client = await TemporalClient()
        const terminateHandler = Client.workflow.getHandle(workflowId)
        await terminateHandler.terminate("terminating")
        res.status(204).send("successfully terminated")
    }
    catch (err: any) {
        res.json({
            statusCode: err.status,
            message: err?.message

        })
    }

}

export async function OrganizationCancelWorkflowController(req: Request, res: Response) {

    const {workflowId} = req.params
    try {

        const Client = await TemporalClient()
        const cancelHandler = Client.workflow.getHandle(workflowId)
        await cancelHandler.cancel()
        res.status(204).send("successfully cancel request send ")
    }
    catch (err: any) {
        res.json({
            statusCode: err.status,
            message: err?.message

        })

    }

}

export async function OrganizationUpdateWorkflowController(req: Request, res: Response) {
    try {
    
    const { workflowId } = req.params;

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



    


        let organization: IOrganization = {


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
        }


        
   

    
        const Client = await TemporalClient();
        const OrgupdateHandler = Client.workflow.getHandle(workflowId);

        let updatestatus= await OrgupdateHandler.executeUpdate("updateOrgSignal",{
            args:[organization]
        });

        res.status(200).send("Signal sent successfully");
    } catch (err: any) {
        res.json({
            statusCode: err.status,
            message: err?.message||"error while sending update signal to workflow"

        })
    }
}
