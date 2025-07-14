import { OrgModel, IOrg,Iupdate } from './utils/OrgModel'
import { Router, Request, Response } from 'express'
import { createOrgWorkflow, deleteWorkflow, updateWorkflow } from './temporal/workflows'
import { getClient } from './utils/client'
import { getAll } from './utils/client'
const router = Router()
import mongoose from 'mongoose'


router.get("/allOrgs",async (req:Request,res:Response)=>{
    try{
       
        const result=await getAll()
         

 
    res.status(200).send(result)
         }
    
    catch(err:any){
        console.log(err?.message)
        res.status(500).send("Internal server error ")

    }
})




router.post('/create', async (req: Request, res: Response) => {
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
                createdByEmail: createdByEmail,
                 
            },
            "colors": {
                "page_background": page_background_color,
                "primary": primary_color
            },
            status:"provisoning"
           


        })
        let client = await getClient()

        let createdOrg = await client.workflow.start(createOrgWorkflow, {
            args: [organization,organization._id!],
            startDelay:"30 seconds",
            workflowId: organization.name + Date.now(),
            taskQueue: 'organizationManagement'

        })
        res.status(200).send("workflow started")

    }
    catch (err:any) {
          console.error("Error message:", err?.message);
  console.error("Stack trace:", err?.stack);
  console.error("Full error object:", err);
        console.log(err)
        throw new Error("error while creating the organization ")
    }

})


router.patch("/update/:id",async(req:Request,res:Response)=>{
const { id } = req.params;
if (!id) {
  return res.status(400).send("Invalid userId");
}

const { name, display_name} = req.body;

try {
  let update: Iupdate = {};

  if (name) update.name = name;  
  if(display_name) update.display_name=display_name 
 
    
 

  const updated = await OrgModel.findByIdAndUpdate(new mongoose.Types.ObjectId(id), update, { new: true });
  await OrgModel.findByIdAndUpdate(new mongoose.Types.ObjectId(id),{
    "status":'updating'
  })
  if (!updated) {
    return res.status(404).send("Organization not found");
  }

  const client = await getClient();
  console.log(updated.authid, update, updated.metadata.createdByEmail, updated._id)
  await client.workflow.start(updateWorkflow, {
    args: [updated.authid, update, updated.metadata.createdByEmail, updated._id],
    startDelay:"30 seconds",
    workflowId: updated.name + '-' + Date.now(),
    taskQueue: 'organizationManagement',
  });

  res.status(200).send(updated);
} catch (err: any) {
  res.status(500).send(err?.message);
}

})

router.patch('/delete/:id',async(req:Request,res:Response)=>{
const{id}=req.params
if(!id){
    res.status(400).send('error while deleting the user')
    return
}
try{
const org=await OrgModel.findByIdAndUpdate(new mongoose.Types.ObjectId(id),{
    "status":"deleting"
})

const client=await getClient()
await client.workflow.start(deleteWorkflow,{
    args: [org!.authid, org!.metadata.createdByEmail, org!._id],
    startDelay:"30 seconds",
    workflowId:"deleting workflow"+Date.now(),
    taskQueue:'organizationManagement'
})
res.status(200).send("delete workflow started")
}
catch(err:any){
    throw new Error(err?.message)
}


})

export default router








