import mongoose from 'mongoose'

import { IOrganizationUpdate ,IOrganization} from '../models/OrganizationModel'
import { status } from '../models/userModel'


//organization interfaces 
export interface OrganizationupdateWorkflowInput {
    authId: any,
    update: IOrganizationUpdate,
    receiver: string,
    id: mongoose.Types.ObjectId
}

export interface OrganizationDeleteWorkflowInput {
    authId: any,

    receiver: string,
    id: mongoose.Types.ObjectId
}


export interface OrganizationStatusUpdateInDBActivityInput  {
   id: mongoose.Types.ObjectId,
  status?: string,
  failureReason?: string,
  authid?: string
}

export interface UpdateOrganizationAuthActivityInput{
authid:string, 
update: IOrganizationUpdate
}

export interface updateOrganizationInDBActivityInput{
organization:IOrganization,
id:mongoose.Types.ObjectId
}


//user interfaces

export interface userCreationInAuth0Input{
  name: string,
   email: string,
    password: string
}




export interface updateUserStatusInDBInput{
 userId: mongoose.Types.ObjectId,
  statusValue: status,
  failureReason?: string,
  authId?: string
}

export interface updateUserInAuth0Input {
  authId: string,
   name?: string,
    password?: string
}