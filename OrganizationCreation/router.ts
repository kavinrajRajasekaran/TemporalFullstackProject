import { OrgModel, IOrg, Iupdate } from './utils/OrgModel'
import { Router, Request, Response } from 'express'
import { createOrgWorkflow, deleteWorkflow, updateWorkflow, updateOrgSignal } from './temporal/workflows'
import { getClient } from './utils/client'
import { getAll } from './utils/client'
const router = Router()
import mongoose from 'mongoose'




router.get("/organizations", async (req: Request, res: Response) => {
    try {

        const result = await getAll()



        res.status(200).send(result)
    }

    catch (err: any) {
        console.log(err?.message)
        res.status(500).send("Internal server error ")

    }
})




router.post('/organizations', async (req: Request, res: Response) => {
    const { name, display_name, branding_logo_url, createdByEmail, primary_color, page_background_color } = req.body
    if (!name || !display_name || !branding_logo_url || !createdByEmail || !primary_color || !page_background_color) {
        res.status(400).json('insufficient data to create an organization')

    }



    try {


        let organization: IOrg = await OrgModel.create({


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
        let client = await getClient()

        let createdOrg = await client.workflow.start(createOrgWorkflow, {
            args: [organization,organization._id!],
            startDelay: "1 minutes",
            workflowId: organization.name + Date.now(),
            taskQueue: 'organizationManagement'

        })
        res.status(200).json({
            workflowId: createdOrg.workflowId
        })

    }
    catch (err: any) {
        console.error("Error message:", err?.message);
        console.error("Stack trace:", err?.stack);
        console.error("Full error object:", err);
        console.log(err)
        throw new Error("error while creating the organization ")
    }

})


router.patch("/organizations/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).send("Invalid userId");
    }

    const { name, display_name } = req.body;

    try {
        let update: Iupdate = {};

        if (name) update.name = name;
        if (display_name) update.display_name = display_name
       



        const updated = await OrgModel.findByIdAndUpdate(new mongoose.Types.ObjectId(id), update, { new: true });
        await OrgModel.findByIdAndUpdate(new mongoose.Types.ObjectId(id), {
            "status": 'updating'
        })
        if (!updated) {
            return res.status(404).send("Organization not found");
        }

        const client = await getClient();
        console.log(updated.authid, update, updated.metadata.createdByEmail, updated._id)
         let updateworkflow=await client.workflow.start(updateWorkflow, {
            args: [updated.authid, update, updated.metadata.createdByEmail, updated._id],
            startDelay: "30 seconds",
            workflowId: updated.name + '-'+ Date.now(),
            taskQueue: 'organizationManagement',
        });

        res.status(200).json({
            workflowId: updateworkflow.workflowId
        })
    } catch (err: any) {
        res.status(500).send(err?.message);
    }

})

router.delete('/organizations/:id', async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id) {
        res.status(400).send('error while deleting the user')
        return
    }
    try {
        const org = await OrgModel.findByIdAndUpdate(new mongoose.Types.ObjectId(id), {
            "status": "deleting"
        })

        const client = await getClient()
        let orgworkflow=await client.workflow.start(deleteWorkflow, {
            args: [org!.authid, org!.metadata.createdByEmail, org!._id],
            startDelay: "30 seconds",
            workflowId: "deletingworkflow"+Date.now(),
            taskQueue: 'organizationManagement'
        })
        res.status(200).json({
            workflowId: orgworkflow.workflowId
        })
    }
    catch (err: any) {
        throw new Error(err?.message)
    }


})

router.post('workflow/cancel/:workflowId',async(req:Request,res:Response)=>{
    const {workflowId}=req.params
   try{

    const client=await getClient()
    const workflow= client.workflow.getHandle(workflowId)
    await workflow.cancel()
    res.status(204).send("successfully cancel request send ")
   }
   catch(err){
    throw err
   }


})


router.post('/workflow/:workflowId/update', async (req: Request, res: Response) => {


    const { workflowId } = req.params;

    const {display_name } = req.body;
   
    if (!display_name ) {
        res.status(400).json('insufficient data to send the signal')
    
    }






   

    try {
        const client = await getClient();
        const handle = client.workflow.getHandle(workflowId);

        await handle.signal(updateOrgSignal, display_name);

        res.status(200).send("Signal sent successfully");
    } catch (err: any) {
        console.error("Signal error:", err);
        res.status(500).send("Failed to send signal");
    }
});

router.post('/workflow/:workflowId/terminate',async(req:Request,res:Response)=>{
    const {workflowId}=req.params
   try{

    const client=await getClient()
    const workflow= client.workflow.getHandle(workflowId)
    await workflow.terminate("terminating")
    res.status(204).send("successfully terminated")
   }
   catch(err){
    throw err
   }


})



export default router








