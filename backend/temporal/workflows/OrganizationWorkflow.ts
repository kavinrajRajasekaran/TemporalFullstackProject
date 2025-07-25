import { proxyActivities, sleep, condition, setHandler, defineUpdate,startChild } from '@temporalio/workflow';
import type * as activities from '../activities/OrganizationActivities';
import { IOrganization } from '../../models/OrganizationModel';
import { OrganizationupdateWorkflowInput, OrganizationDeleteWorkflowInput } from '../../utils/shared';
import { SendEmailOptions } from '../../utils/mailsender';
export const updateOrgSignal = defineUpdate<string, [IOrganization]>('updateOrgSignal');




const { OrganizationCreationInAuthActivity, sendEmailToUserActivity, deleteInAuth0Activity, updateOrganizationInDBActivity, OrganizationStatusUpdateInDBActivity, deleteInDBActivity, UpdateOrganizationAuthActivity } = proxyActivities<typeof activities>({
retry: {
    initialInterval: '1 second',
    maximumInterval: '30 seconds',
    backoffCoefficient: 2,
    maximumAttempts: 5,
  },
  startToCloseTimeout: '2 minutes',

})


//to create an organization
export async function createOrganizationWorkflow(Organization: IOrganization) {

  try {
    let updatedOrgData: IOrganization | undefined;
    let timeout: boolean = false

    setHandler(updateOrgSignal, (newData: IOrganization) => {
      updatedOrgData = newData;
      if (timeout) {
        return "failed to update "
      }
      return 'successfully updated';
    });





    const updateReceived = await condition(() => updatedOrgData !== undefined, '1 minute');

    timeout = true
    if (updateReceived && updatedOrgData) {
      updatedOrgData = await updateOrganizationInDBActivity({organization:updatedOrgData, id:Organization._id!})
      Organization = updatedOrgData!

    }






    await OrganizationStatusUpdateInDBActivity({id:Organization._id!, status:'provisoning'})

    let authId: string | undefined = await OrganizationCreationInAuthActivity(Organization)

    
    await OrganizationStatusUpdateInDBActivity({id:Organization._id!, status:'succeed',failureReason: undefined, authid:authId})

  let child =await startChild(ChildEmailSendingWorkflow,{
    args:[{to: Organization.metadata.createdByEmail, subject: 'your organization created successfully'}]
  
  })
  console.log(await child.result())
  }
  catch (err) {
    if (Organization._id !== undefined) {

      await OrganizationStatusUpdateInDBActivity({id:Organization._id!, status:'failure'})

    }
    throw err

  }


} 

//to update an organization
export async function updateOrganizationWorkflow(input: OrganizationupdateWorkflowInput) {
  try {
    await OrganizationStatusUpdateInDBActivity({id:input.id, status:'updating'})
    await UpdateOrganizationAuthActivity({authid:input.authId, update:input.update})
    await OrganizationStatusUpdateInDBActivity({id:input.id, status:'succeed'})
    await sendEmailToUserActivity({ to: input.receiver, subject: 'updated your organization' })


  }
  catch (err) {
   
    await OrganizationStatusUpdateInDBActivity({id:input.id, status:'failure', failureReason:'failed while updating the organization'})
   throw err
  }

}

//to delete an organization
export async function deleteOrganizationWorkflow(input: OrganizationDeleteWorkflowInput) {
  try {
    await deleteInAuth0Activity(input.authId)
    await deleteInDBActivity(input.id)

    await sendEmailToUserActivity({ to: input.receiver, subject: "your org is successfully deleted" })

  }
  catch (err: any) {
    await OrganizationStatusUpdateInDBActivity({id:input.id, status:'failure', failureReason:"failed while deleting organization"})
    throw err
  }
}


export async function ChildEmailSendingWorkflow(input:SendEmailOptions){
  try{
    await sendEmailToUserActivity(input)
    return "email sent successfully"
  }
  catch(err){
    throw err
  }
}







