import { UserModel} from "../../models/userModel";
import axios from 'axios'
import {  getAuth0Token} from "../../utils/auth0TokenGenerator";
import {userCreationInAuth0Input,updateUserStatusInDBInput,updateUserInAuth0Input } from '../../utils/shared'
import { ApplicationFailure } from "@temporalio/common";
import { AppError } from "../../Errors/AppError";



export async function userCreationInAuth0(input:userCreationInAuth0Input): Promise<string | undefined> {
  

  try {
    const token = await getAuth0Token()
    const res = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users`,
      {
        name: input.name,
        email: input.email,
        password: input.password,
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
 throw ApplicationFailure.create({
        nonRetryable: false,
        message: "error while creation of the user in auth0",
        details: [error.response?.data ? JSON.stringify(error.response.data) : undefined]
      })
      
    }
  }


}



export async function updateUserStatusInDB(input:updateUserStatusInDBInput) {
  try {
    const update: Record<string, any> = {
      status: input.statusValue,
    };

    if (input.failureReason) update.failureReason = input.failureReason;
    if (input.authId) update.authId = input.authId;

    const user = await UserModel.findByIdAndUpdate(input.userId, update, {
      new: true,
    });

    if (!user) {
      throw new AppError("user not found in database",404)
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
    throw ApplicationFailure.create({
        nonRetryable: false,
        message: "error while updation status of the user in auth0",
        details: [error.response?.data ? JSON.stringify(error.response.data) : undefined]
      })
    }
  }

}



export async function updateUserInAuth0(input:updateUserInAuth0Input): Promise<void> {
  
  try {
    const token = await getAuth0Token();

  const updateFields: Record<string, any> = {};
  if (input.name) updateFields.name = input.name;
  if (input.password) updateFields.password = input.password;

  if (Object.keys(updateFields).length === 0) {
    throw new AppError('No fields provided to update.',400);
  }

    await axios.patch(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${input.authId}`,
      updateFields,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`Auth0 user ${input.authId} updated`);
  } catch (error: any) {
    const status = error.response?.status;
    const isNonRetryable = status >= 400 && status < 500;

    

    if (isNonRetryable) {
      throw ApplicationFailure.create({
        nonRetryable: true,
        message: "error while updation status of the user in auth0",
        details: [error.response?.data ? JSON.stringify(error.response.data) : undefined]
      })
    } else {

       throw ApplicationFailure.create({
        nonRetryable: false,
        message: "error while updation status of the user in auth0",
        details: [error.response?.data ? JSON.stringify(error.response.data) : undefined]
      })
    }
  }
}

export async function deleteUserInAuth0(authId: string): Promise<void> {
 



  try {
     const token = await getAuth0Token();
    await axios.delete(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${authId}`,

      {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }
    );

   
  } catch (error: any) {
    const status = error.response?.status;
    const isNonRetryable = status >= 400 && status < 500;

   
    if (isNonRetryable) {
      throw ApplicationFailure.create({
        nonRetryable: true,
        message: "error while deletion of the user in auth0",
        details: [error.response?.data ? JSON.stringify(error.response.data) : undefined]
      })
    } else {

      throw ApplicationFailure.create({
        nonRetryable:false,
        message: "error while deletion of the user in auth0",
        details: [error.response?.data ? JSON.stringify(error.response.data) : undefined]
      })
    }
  }
}


export async function deleteUserInDb(authId: string) {

  try {
    let deletedUser=await UserModel.findOneAndDelete({ authId: authId })
   if(!deletedUser){
    throw new AppError("user not found in the database ",404)
   }

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

        throw ApplicationFailure.create({
        nonRetryable:false,
        message: "error while deletion of the user in auth0",
        details: [error.response?.data ? JSON.stringify(error.response.data) : undefined]
      })
    }
  }

}

