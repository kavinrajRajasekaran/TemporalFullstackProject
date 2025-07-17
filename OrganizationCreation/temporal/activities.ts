import { sendEmail } from "../utils/mailsender";
import { SendEmailOptions } from "../utils/mailsender";
import { OrganizationModel, IOrganization,IOrganizationUpdate} from "../models/OrganizationModel";
import mongoose from 'mongoose'
import { getToken } from "../utils/auth0TokenGenerator";
import axios from 'axios';

import { ManagementClient } from 'auth0';
import { ApplicationFailure } from "@temporalio/common";


export async function sendEmailToUserActivity(options: SendEmailOptions) {
  try {
    await sendEmail(options)

  }
  catch (error: any) {

    const status = error.response?.status;
    const isNonRetryable = status >= 400 && status < 500;


    if (isNonRetryable) {
      throw ApplicationFailure.create({
        nonRetryable: true,
        message: "Sending email to User Activity failed",
        details: [error.response?.data ? JSON.stringify(error.response.data) : undefined]
      })
    } else {

      throw error;
    }


  }

}

export async function OrganizationCreationInAuthActivity(Org: IOrganization): Promise<string> {
  const token = await getToken();

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/organizations`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    data: JSON.stringify({
      "name": Org.name,
      "display_name": Org.display_name,
      "branding": {
        "logo_url": Org.branding?.logo_url,
        "colors": {
          "primary": Org.colors?.primary,
          "page_background": Org.colors?.page_background
        }
      }
    })
  };

  try {
    const response = await axios.request(config);
    return response.data.id;
  } catch (error: any) {

    const status = error.response?.status;
    const isNonRetryable = status >= 400 && status < 500;



    if (isNonRetryable) {
      throw ApplicationFailure.create({
        nonRetryable: true,
        message: "organization creation in the  auth0 activity failed",
        details: [error.response?.data ? JSON.stringify(error.response.data) : undefined]
      })
    } else {

      throw error;
    }

  }
}




export async function OrganizationStatusUpdateInDBActivity(
  id: mongoose.Types.ObjectId,
  status?: string,
  failureReason?: string,
  authid?: string
): Promise<IOrganization | undefined> {
  try {
    const orgDoc = await OrganizationModel.findById(id);

    if (!orgDoc) {
      throw new Error('Organization not found');
    }


    if (status) {

      orgDoc.status = status as any;
    }

    if (failureReason) {

      orgDoc.metadata.failureReason = failureReason;
    }

    if (authid) {
      orgDoc.authid = authid;
    }

    await orgDoc.save();

    const org = orgDoc.toObject() as IOrganization;
    return org;
  } catch (error: any) {
    const statusCode = error.response?.status;
    throw ApplicationFailure.create({
      message: `status updation in the DB activity failed ${statusCode}`,
      type: 'DBError',
      nonRetryable: statusCode >= 400 && statusCode < 500,
      details: [{
        statusCode,
        responseData: error.response?.data ?? null,
        originalMessage: error.message,

      }],
    });
  }
}

export async function UpdateOrganizationAuthActivity(id: any, update: IOrganizationUpdate) {
  const token = await getToken()



  let config = {
    method: 'patch',
    maxBodyLength: Infinity,
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/organizations/${id}`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    data: JSON.stringify(update)
  };

  await axios.request(config)
    .then((response) => {
      return response.data


    })
    .catch((error: any) => {

      const statusCode = error.response?.status;
      throw ApplicationFailure.create({
        message: `Error while updating the organization in auth0 ${statusCode}`,
        type: 'HttpError',
        nonRetryable: statusCode >= 400 && statusCode < 500,
        details: [{
          statusCode,
          responseData: error.response?.data ?? null,
          originalMessage: error.message,

        }],
      });


    })

}



export async function deleteInAuth0Activity(id: string) {
  try {

    const management = new ManagementClient({
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      domain: process.env.AUTH0_DOMAIN!,
    });

    await management.organizations.delete({
      id: id
    });

  }
  catch (error: any) {

    const statusCode = error.response?.status;

    throw ApplicationFailure.create({
      message: `Error while deleting oganization in the auth0 ${statusCode}`,
      type: 'HttpError',
      nonRetryable: statusCode >= 400 && statusCode < 500,
      details: [{
        statusCode,
        responseData: error.response?.data ?? null,
        originalMessage: error.message,

      }],
    });


  }

}


export async function deleteInDBActivity(id: mongoose.Types.ObjectId) {
  try {

    await OrganizationModel.findByIdAndDelete(new mongoose.Types.ObjectId(id))
  }
  catch (error: any) {

    const statusCode = error.response?.status || 500;


    throw ApplicationFailure.create({
      message: `Error while deleting organization in database activity ${statusCode}`,
      type: 'DBErorr',
      nonRetryable: statusCode >= 400 && statusCode < 500,
      details: [{
        statusCode,
        responseData: error.response?.data ?? null,
        originalMessage: error.message,

      }],
    });

  }


}


export async function updateOrganizationInDBActivity(organization:IOrganization,id:mongoose.Types.ObjectId):Promise<IOrganization|undefined>{
 
   
  
  try{
    let orgId=new mongoose.Types.ObjectId(id)
   let newOrganization= await OrganizationModel.findByIdAndUpdate(orgId,organization)
   return newOrganization||undefined
  }
  catch(error:any){
const statusCode = error.response?.status || 500;


    throw ApplicationFailure.create({
      message: `Error while creating user organization in database activity ${statusCode}`,
      type: 'DBErorr',
      nonRetryable: statusCode >= 400 && statusCode < 500,
      details: [{
        statusCode,
        responseData: error.response?.data ?? null,
        originalMessage: error.message,

      }],
    });


  }
}


