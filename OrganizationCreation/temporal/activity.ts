import { sendEmail } from "../utils/mailsender";
import { SendEmailOptions } from "../utils/mailsender";
import { OrgModel,IOrg } from "../utils/OrgModel";
import mongoose from 'mongoose'
import { getToken } from "../utils/auth0TokenGenerator";
import axios from 'axios';
import { Iupdate } from "../utils/OrgModel";
import { deleter } from "../utils/client";
import { ApplicationFailure } from "@temporalio/common";


export async function sendEmailActivity(content:SendEmailOptions){
  try{
   await sendEmail(content)
  
  }
  catch(error:any){
   
   const statusCode = error?.response?.status;

    
    throw ApplicationFailure.create({
      message: `Failed to send email ${statusCode}`,
      type: "EmailErorr",
      nonRetryable: statusCode >= 400 && statusCode < 500,
    });
    
 
  }

}

export async function OrgCreateActivity(Org: IOrg): Promise<string> {
  const token = await getToken();

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url:`https://${process.env.AUTH0_DOMAIN}/api/v2/organizations`,
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
    
   const statusCode = error.response?.status;
  
    throw ApplicationFailure.create({
      message: `Error while creating an organization ${statusCode}`,
      type: "HttpErorr",
      nonRetryable: statusCode >= 400 && statusCode < 500,
    });
  }
}


export async function statusUpdateActivity(
  id: mongoose.Types.ObjectId,
  status?: string,
  failureReason?: string,
  authid?: string
): Promise<IOrg | undefined> {
  try {
    const orgDoc = await OrgModel.findById(id);

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
    
    const org = orgDoc.toObject() as IOrg;
    return org;
  } catch (err: any) {
    throw new Error(`Error while updating the status: ${err.message}`);
  }
}

export async function updateActivity(id:any,update:Iupdate){
const token=await getToken()

 

let config = {
  method: 'patch',
  maxBodyLength: Infinity,
  url: `https://${process.env.AUTH0_DOMAIN}/api/v2/organizations/${id}`,
  headers: { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json', 
    'Authorization':`Bearer ${token}` 
  },
  data :JSON.stringify(update)
};

await axios.request(config)
.then((response) => {
  return response.data
  

})
.catch((error:any) => {

   const statusCode = error.response?.status;

    
    throw ApplicationFailure.create({
      message: `Failed to update the org in the Auth0 ${statusCode}`,
      type: "HttpErorr",
      nonRetryable: statusCode >= 400 && statusCode < 500,
    });

})

}
export async function createInDB(organization:IOrg):Promise<mongoose.Types.ObjectId|undefined>{
try{

 const Org= await OrgModel.create(organization)
 return Org._id

}
catch(err:any){
   const statusCode = err.response?.status;

    
    throw ApplicationFailure.create({
      message: `Failed to update the org in the Auth0 ${statusCode}`,
      type: "HttpErorr",
      nonRetryable: statusCode >= 400 && statusCode < 500,
     
    });


}

}


export async function deleteActivity(id:string){
  try{
  await deleter(id)
  
  }
  catch(error:any){
   
   const statusCode = error.response?.status;
    
    
    throw ApplicationFailure.create({
      message: `Error while deleting the org in the Auth0 ${statusCode}`,
      type: "HttpErorr",
      nonRetryable: statusCode >= 400 && statusCode < 500,
    });
  }




}


export async function deleteInDBActivity(id:mongoose.Types.ObjectId){
    try{

      await OrgModel.findByIdAndDelete(new mongoose.Types.ObjectId(id))
    }
    catch(error:any){
      
   const statusCode = error.response?.status;

    
    throw ApplicationFailure.create({
      message: `error while deleting in DB ${statusCode}`,
      type: "DatabaseError",
      nonRetryable: statusCode >= 400 && statusCode < 500,
    });
    }
}

