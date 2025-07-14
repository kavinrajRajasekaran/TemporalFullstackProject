import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activity';
import { OrgModel,IOrg, Iupdate} from '../utils/OrgModel';

import mongoose from 'mongoose'

const {OrgCreateActivity,statusUpdateActivity,sendEmailActivity,updateActivity,deleteActivity,deleteInDBActivity}=proxyActivities<typeof activities>({
startToCloseTimeout:"2 minutes",
retry:{
  maximumAttempts:5,
  maximumInterval:"20 seconds",
  backoffCoefficient:2
}

})


export async function createOrgWorkflow(Org:IOrg,id:mongoose.Types.ObjectId){
  try{
    await statusUpdateActivity(id,'provisoning')
  let authId:string|undefined=await OrgCreateActivity(Org)
  console.log(`authId`+authId)
   await sendEmailActivity({to:Org.metadata.createdByEmail,subject:'your organization created successfully'})
  await statusUpdateActivity(id,'succeed',undefined,authId)
     

  }
  catch(err){
      await statusUpdateActivity(id,'failure',undefined)
    throw new Error('error while creating the organization')
    
  }
 

}

export async function updateWorkflow(authId:any,update:Iupdate,receiver:string,id:mongoose.Types.ObjectId){
  try{
      await statusUpdateActivity(id,'updating')
    await updateActivity(authId,update)
    await sendEmailActivity({to:receiver,subject:'updated your organization'})
    await statusUpdateActivity(id,'succeed')

  }
  catch(err){
 await statusUpdateActivity(id,'failure','failed while updating the organization')
 throw new Error("error while updating the organization")
  }

}


export async function deleteWorkflow(authId:any,receiver:string,id:mongoose.Types.ObjectId){
  try{
   await deleteActivity(authId)
   await deleteInDBActivity(id)

   await sendEmailActivity({to:receiver,subject:"your org is successfully deleted"})

  }
  catch(err:any){
    await statusUpdateActivity(id,'failed',"failed while deleting organization")
    throw new Error(err?.message)
  }
}

 
