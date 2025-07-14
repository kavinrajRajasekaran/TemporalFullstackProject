import { IUser, IUserDocument, UserModel, status } from "../utils/userModel";
import axios from 'axios'
import mongoose, { mongo } from 'mongoose'
import { getToken } from "../utils/auth0TokenGenerator";
import { connectToMongo } from "../utils/db";
import { ApplicationFailure } from "@temporalio/common";
connectToMongo()
export async function userCreationAuth0(name: string, email: string, password: string): Promise<string | undefined> {
  const token = await getToken()

  try {
    const res = await axios.post(
      'https://kavinraj.us.auth0.com/api/v2/users',
      {
        name: name,
        email: email,
        password: password,
        connection: 'Username-Password-Authentication'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data.user_id;
  } catch (error: any) {
    const status = error.response?.status;
    const isNonRetryable = status >= 400 && status < 500;

    console.error(' Auth0 creation failed:', error.response?.data || error.message);

    if (isNonRetryable) {
      throw ApplicationFailure.create({
        nonRetryable: true,
        message: "error while creation of the user in auth0",
        details: [error.response?.data ? JSON.stringify(error.response.data) : undefined]
      })
    } else {

      throw error;
    }
  }


}

export async function updateStatus(
  userId: mongoose.Types.ObjectId,
  statusValue: status,
  failureReason?: string,
  authId?: string
) {
  try {
    const update: Record<string, any> = {
      status: statusValue,
    };

    if (failureReason) update.failureReason = failureReason;
    if (authId) update.authId = authId;

    const user = await UserModel.findByIdAndUpdate(userId, update, {
      new: true, // return the updated document
    });

    if (!user) {
      console.warn(`User with ID ${userId} not found`);
    }

    return user;
  } catch (error: any) {
    const status = error.response?.status;
    const isNonRetryable = status >= 400 && status < 500;

    console.error(' Auth0 status update failed:', error.response?.data || error.message);

    if (isNonRetryable) {
      throw ApplicationFailure.create({
        nonRetryable: true,
        message: "error while updation status of the user in auth0",
        details: [error.response?.data ? JSON.stringify(error.response.data) : undefined]
      })
    } else {

      throw error;
    }
  }

}

export async function updateUserInAuth0(authId: string, name?: string, password?: string): Promise<void> {
  const token = await getToken();

  const updateFields: Record<string, any> = {};
  if (name) updateFields.name = name;
  if (password) updateFields.password = password;

  if (Object.keys(updateFields).length === 0) {
    throw new Error('No fields provided to update.');
  }

  try {
    await axios.patch(
      `https://kavinraj.us.auth0.com/api/v2/users/${authId}`,
      updateFields,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`Auth0 user ${authId} updated`);
  } catch (error: any) {
    console.error('Failed to update user in Auth0:', error.response?.data || error.message);
    throw error;
  }
}

export async function deleteUserInAuth0(authId: string): Promise<void> {
  const token = await getToken();



  try {
    await axios.delete(
      `https://kavinraj.us.auth0.com/api/v2/users/${authId}`,

      {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }
    );

    console.log(`Auth0 user ${authId} updated`);
  } catch (error: any) {
    const status = error.response?.status;
    const isNonRetryable = status >= 400 && status < 500;

    console.error(' Auth0 deletion failed:', error.response?.data || error.message);

    if (isNonRetryable) {
      throw ApplicationFailure.create({
        nonRetryable: true,
        message: "error while deletion of the user in auth0",
        details: [error.response?.data ? JSON.stringify(error.response.data) : undefined]
      })
    } else {

      throw error;
    }
  }
}


export async function deleteIndb(authId: string) {

  try {
    await UserModel.findOneAndDelete({ authId: authId })
  }
  catch (error: any) {
    const status = error.response?.status;
    const isNonRetryable = status >= 400 && status < 500;

    console.error(' Auth0 deletion failed:', error.response?.data || error.message);

    if (isNonRetryable) {
      throw ApplicationFailure.create({
        nonRetryable: true,
        message: "error while deletion of the user in auth0",
        details: [error.response?.data ? JSON.stringify(error.response.data) : undefined]
      })
    } else {

      throw error;
    }
  }

}

