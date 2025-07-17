import { proxyActivities, sleep, condition, setHandler, defineUpdate } from '@temporalio/workflow';
import type * as activities from './activities';
import { IOrganization } from '../models/OrganizationModel';
import { OrganizationupdateWorkflowInput, OrganizationDeleteWorkflowInput } from '../utils/shared';

export const updateOrgSignal = defineUpdate<string, [IOrganization]>('updateOrgSignal');





const { OrganizationCreationInAuthActivity, sendEmailToUserActivity, deleteInAuth0Activity, updateOrganizationInDBActivity, OrganizationStatusUpdateInDBActivity, deleteInDBActivity, UpdateOrganizationAuthActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: "2 minutes",
  retry: {
    maximumAttempts: 5,
    initialInterval: '5s',
    maximumInterval: '5 seconds',
    backoffCoefficient: 2,

  }


})

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
      updatedOrgData = await updateOrganizationInDBActivity(updatedOrgData, Organization._id!)
      Organization = updatedOrgData!

    }






    await OrganizationStatusUpdateInDBActivity(Organization._id!, 'provisoning')

    let authId: string | undefined = await OrganizationCreationInAuthActivity(Organization)

    await sendEmailToUserActivity({ to: Organization.metadata.createdByEmail, subject: 'your organization created successfully' })

    await OrganizationStatusUpdateInDBActivity(Organization._id!, 'succeed', undefined, authId)


  }
  catch (err) {
    if (Organization._id !== undefined) {

      await OrganizationStatusUpdateInDBActivity(Organization._id!, 'failure', undefined)

    }
    throw err

  }


}


export async function updateOrganizationWorkflow(input: OrganizationupdateWorkflowInput) {
  try {
    await OrganizationStatusUpdateInDBActivity(input.id, 'updating')
    await UpdateOrganizationAuthActivity(input.authId, input.update)
    await OrganizationStatusUpdateInDBActivity(input.id, 'succeed')
    await sendEmailToUserActivity({ to: input.receiver, subject: 'updated your organization' })


  }
  catch (err) {
    await OrganizationStatusUpdateInDBActivity(input.id, 'failure', 'failed while updating the organization')
    throw err
  }

}


export async function deleteOrganizationWorkflow(input: OrganizationDeleteWorkflowInput) {
  try {
    await deleteInAuth0Activity(input.authId)
    await deleteInDBActivity(input.id)

    await sendEmailToUserActivity({ to: input.receiver, subject: "your org is successfully deleted" })

  }
  catch (err: any) {
    await OrganizationStatusUpdateInDBActivity(input.id, 'failure', "failed while deleting organization")
    throw err
  }
}





