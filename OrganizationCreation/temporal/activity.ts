import { sendEmail } from "../utils/mailsender";
import { SendEmailOptions } from "../utils/mailsender";
import { OrgModel,IOrg } from "../utils/OrgModel";
import mongoose from 'mongoose'
import { getToken } from "../utils/auth0TokenGenerator";
import axios from 'axios';
import { Iupdate } from "../utils/OrgModel";
import { deleter } from "../utils/client";



export async function sendEmailActivity(content:SendEmailOptions){
  try{
   await sendEmail(content)
  
  }
  catch(err:any){
   throw new Error("error while sending email")
    

  }

}

export async function OrgCreateActivity(Org: IOrg): Promise<string> {
  const token = await getToken();

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url:`${process.env.ORG_URI}`,
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
    throw new Error('error while creating a orgInAUth: ' + error?.message);
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
  url: `${process.env.ORG_URI}/${id}`,
  headers: { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json', 
    'Authorization':`Bearer ${token}` },
  data :JSON.stringify(update)
};

await axios.request(config)
.then((response) => {
  return response.data
  

})
.catch((error:any) => {
  console.log(error?.message)
  throw new Error("Error while updating organization")
});


   
}


export async function deleteActivity(id:string){
  try{
  await deleter(id)
  
  }
  catch(err){
    throw new Error("error while deleting the organization")
  }




}


export async function deleteInDBActivity(id:mongoose.Types.ObjectId){
    try{
      await OrgModel.findByIdAndDelete(id)
    }
    catch(err:any){
      console.log(err?.message)
      throw new Error('error while deleting the org in db')
    }
}

