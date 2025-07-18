import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from '../activities/Useractivities';
import mongoose from 'mongoose';


const {  updateUserStatusInDB ,userCreationInAuth0, updateUserInAuth0, deleteUserInAuth0, deleteUserInDb } = proxyActivities<typeof activities>({
  retry: {
    initialInterval: '1 second',
    maximumInterval: '30 seconds',
    backoffCoefficient: 2,
    maximumAttempts: 5,
  },
  startToCloseTimeout: '2 minutes',
});



export async function UserSignupWorkflow(
  name: string, email: string, password: string, _id: mongoose.Types.ObjectId
): Promise<void> {
  try {

    const authId = await userCreationInAuth0({name, email, password});
    await sleep('5000')
    await updateUserStatusInDB({userId:_id, statusValue:"succeed", failureReason:undefined, authId:authId})
  } catch (err: any) {
    
    await updateUserStatusInDB({userId:_id, statusValue:"failed", failureReason:"failed while updating to auth0"});
    throw err
  }
}

export async function UserUpdateWorkflow(authId: string, _id: mongoose.Types.ObjectId, name?: string, password?: string): Promise<void> {
  try {
    await updateUserInAuth0({authId, name, password})
    await sleep('5000')
    await updateUserStatusInDB({userId:_id,statusValue: "succeed"})


  }
  catch (err: any) {


    await updateUserStatusInDB({userId:_id, statusValue:"failed", failureReason:"failed while updating to auth0"})
    throw err
  }
}

export async function deleteUserInfoWorkflow(authId: string, _id: mongoose.Types.ObjectId): Promise<void> {
  try {
    await deleteUserInAuth0(authId)
    await sleep('5000')
    await deleteUserInDb(authId)


  }
  catch (err: any) {
    await updateUserStatusInDB({userId:_id, statusValue:"failed", failureReason:"failed while deletion  to auth0"})
    throw err

  }
}



