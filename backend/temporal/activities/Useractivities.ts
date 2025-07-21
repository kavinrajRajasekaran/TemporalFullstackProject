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
  }
  catch (error: any) {
    let status: number;
    let errorData: any = null;
  
    if (error instanceof AppError) {
      status = error.status;
      errorData = { message: error.message }; 
    } else {
      status = error.response?.status ?? 500;
      errorData = error.response?.data ?? null;
    }
  
    const details = {
      statusCode: status,
      errorData,
    };
  
    throw ApplicationFailure.create({
      nonRetryable: status >= 400 && status < 500,
      message: "Error while creating user status in Auth0",
      details: [JSON.stringify(details)],
    });
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
  } 
  catch (error: any) {
    let status: number;
    let errorData: any = null;
  
    if (error instanceof AppError) {
      status = error.status;
      errorData = { message: error.message }; 
    } else {
      status = error.response?.status ?? 500;
      errorData = error.response?.data ?? null;
    }
  
    const details = {
      statusCode: status,
      errorData,
    };
  
    throw ApplicationFailure.create({
      nonRetryable: status >= 400 && status < 500,
      message: "Error while updating user status in database",
      details: [JSON.stringify(details)],
    });
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

   
  } 
  catch (error: any) {
    let status: number;
    let errorData: any = null;
  
    if (error instanceof AppError) {
      status = error.status;
      errorData = { message: error.message }; 
    } else {
      status = error.response?.status ?? 500;
      errorData = error.response?.data ?? null;
    }
  
    const details = {
      statusCode: status,
      errorData,
    };
  
    throw ApplicationFailure.create({
      nonRetryable: status >= 400 && status < 500,
      message: "Error while updating user status in auth0",
      details: [JSON.stringify(details)]
    });
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

   
  } 
  catch (error: any) {
    let status: number;
    let errorData: any = null;
  
    if (error instanceof AppError) {
      status = error.status;
      errorData = { message: error.message }; // or leave as null
    } else {
      status = error.response?.status ?? 500;
      errorData = error.response?.data ?? null;
    }
  
    const details = {
      statusCode: status,
      errorData,
    };
  
    throw ApplicationFailure.create({
      nonRetryable: status >= 400 && status < 500,
      message: "Error while deleting user status in auth0",
      details: [JSON.stringify(details)],
    });
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
    let status: number;
    let errorData: any = null;
  
    if (error instanceof AppError) {
      status = error.status;
      errorData = { message: error.message };
    } else {
      status = error.response?.status ?? 500;
      errorData = error.response?.data ?? null;
    }
  
    const details = {
      statusCode: status,
      errorData,
    };
  
    throw ApplicationFailure.create({
      nonRetryable: status >= 400 && status < 500,
      message: "Error while deleting user in database",
      details: [JSON.stringify(details)],
    });
  }
  

  

}

