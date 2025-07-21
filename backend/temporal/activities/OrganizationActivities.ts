import { sendEmail,SendEmailOptions } from "../../utils/mailsender";
import { OrganizationModel, IOrganization} from "../../models/OrganizationModel";
import mongoose from 'mongoose'
import { getAuth0Token } from "../../utils/auth0TokenGenerator";
import axios from 'axios';
import{OrganizationStatusUpdateInDBActivityInput,UpdateOrganizationAuthActivityInput,updateOrganizationInDBActivityInput} from '../../utils/shared'
import { ManagementClient } from 'auth0';
import { ApplicationFailure } from "@temporalio/common";
import { AppError } from "../../Errors/AppError";



export async function sendEmailToUserActivity(options: SendEmailOptions) {
  try {
    await sendEmail(options)

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
      message: "Sending email to User Activity failed",
      details: [JSON.stringify(details)],
    });
  }
  

}

export async function OrganizationCreationInAuthActivity(Org: IOrganization): Promise<string> {
  
   try {
  const token = await getAuth0Token();

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

 
    const response = await axios.request(config);
    return response.data.id;
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
      message: "organization creation in the  auth0 activity failed",
      details: [JSON.stringify(details)],
    });
  }

}



 
export async function OrganizationStatusUpdateInDBActivity(
 input:OrganizationStatusUpdateInDBActivityInput
): Promise<IOrganization | undefined> {
  try {
    const orgDoc = await OrganizationModel.findById(input.id);


    if (!orgDoc) {
      throw new AppError("organization not found",404)
    }


    if (input.status) {

      orgDoc.status = input.status as any;
    }

    if (input.failureReason) {

      orgDoc.metadata.failureReason = input.failureReason;
    }

    if (input.authid) {
      orgDoc.authid = input.authid;
    }

    await orgDoc.save();

    const org = orgDoc as IOrganization;
    return org;
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
      message: "status updation in the DB activity failed",
      details: [JSON.stringify(details)],
    });
  }
}

export async function UpdateOrganizationAuthActivity(input:UpdateOrganizationAuthActivityInput) {
  
  try{
  const token = await getAuth0Token()



  let config = {
    method: 'patch',
    maxBodyLength: Infinity,
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/organizations/${input.authid}`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    data: JSON.stringify(input.update)
  };

  await axios.request(config)
    .then((response) => {
      return response.data


    })
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
        message: "Error while updating the organization in auth0",
        details: [JSON.stringify(details)],
      });
    }

}



export async function deleteInAuth0Activity(id: string) {
  try {

    if(!id){
      throw  new AppError("Invalid Organization id",400)
    }

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
      message: "Error while deleting oganization in the auth0",
      details: [JSON.stringify(details)],
    });
  }

}


export async function deleteInDBActivity(id: mongoose.Types.ObjectId) {
  try {

    let deletedOrg=await OrganizationModel.findByIdAndDelete(new mongoose.Types.ObjectId(id))
    if(deletedOrg==null){
      throw new AppError("orgaization not found",404)
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
      message: "Error while deleting organization in database activity",
      details: [JSON.stringify(details)],
    });
  }


}




export async function updateOrganizationInDBActivity(input:updateOrganizationInDBActivityInput):Promise<IOrganization|undefined>{
 
    try{
    let orgId=new mongoose.Types.ObjectId(input.id)
   let newOrganization= await OrganizationModel.findByIdAndUpdate(orgId,input.organization)
   if(newOrganization==null){
    throw new AppError("Organization not found",404)
   }
   return newOrganization
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
    message: "Error while creating user organization in database activity",
    details: [JSON.stringify(details)],
  });
}
}


