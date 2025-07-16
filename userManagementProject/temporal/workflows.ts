import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activity';
import mongoose from 'mongoose';

const {
  userCreationInAuth0, updateUserInAuth0, deleteUserInAuth0, deleteUserInDb
} = proxyActivities<typeof activities>({
  retry: {
    maximumAttempts: 5,
    maximumInterval: "30 seconds",
    backoffCoefficient: 2,

  },
  startToCloseTimeout: '2 minutes'
});
const {
  updateUserStatusInDB
} = proxyActivities<typeof activities>({
  retry: {
    maximumAttempts: 5,
    maximumInterval: "5 seconds",
    backoffCoefficient: 2,


  },
  startToCloseTimeout: '2 minutes'

});
export async function UserSignupWorkflow(
  name: string, email: string, password: string, _id: mongoose.Types.ObjectId
): Promise<void> {
  try {

    const authId = await userCreationInAuth0(name, email, password);
    await sleep('5000')
    await updateUserStatusInDB(_id, "succeed", undefined, authId)
  } catch (err: any) {
    await updateUserStatusInDB(_id, "failed", "failed while updating to auth0");
    throw err
  }
}

export async function UserUpdateWorkflow(authId: string, _id: mongoose.Types.ObjectId, name?: string, password?: string): Promise<void> {
  try {
    await updateUserInAuth0(authId, name, password)
    await sleep('5000')
    await updateUserStatusInDB(_id, "succeed")


  }
  catch (err: any) {


    await updateUserStatusInDB(_id, "failed", "failed while updating to auth0")
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
    await updateUserStatusInDB(_id, "failed", "failed while deletion  to auth0")
    throw err
        
  }
}



