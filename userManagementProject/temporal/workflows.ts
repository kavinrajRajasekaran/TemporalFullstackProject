import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activity';
import { IUserDocument } from '../utils/userModel';
import mongoose from 'mongoose';

const {
  userCreationAuth0, updateUserInAuth0, deleteUserInAuth0, deleteIndb
} = proxyActivities<typeof activities>({
  retry: {
    maximumAttempts: 5,
    maximumInterval: "30 seconds",
    backoffCoefficient: 2,

  },
  startToCloseTimeout: '2 minutes'
});
const {
  updateStatus
} = proxyActivities<typeof activities>({
  retry: {
    maximumAttempts: 5,
    maximumInterval: "5 seconds",
    backoffCoefficient: 2,


  },
  startToCloseTimeout: '2 minutes'

});
export async function signupWorkflow(
  name: string, email: string, password: string, _id: mongoose.Types.ObjectId
): Promise<void> {
  try {

    const authId = await userCreationAuth0(name, email, password);
    await sleep('5000')
    await updateStatus(_id, "succeed", undefined, authId)
  } catch (err: any) {
    await updateStatus(_id, "failed", "failed while updating to auth0", undefined)
  }
}

export async function updateWorkflow(authId: string, _id: mongoose.Types.ObjectId, name?: string, password?: string): Promise<void> {
  try {
    await updateUserInAuth0(authId, name, password)
    await sleep('5000')
    await updateStatus(_id, "succeed", undefined, undefined)


  }
  catch (err: any) {


    await updateStatus(_id, "failed", "failed while updating to auth0", undefined)
  }
}

export async function deleteUserInfoWorkflow(authId: string, _id: mongoose.Types.ObjectId): Promise<void> {
  try {
    await deleteUserInAuth0(authId)
    await sleep('5000')
    await deleteIndb(authId)


  }
  catch (err: any) {
    await updateStatus(_id, "failed", "failed while deletion  to auth0", undefined)
  }
}



