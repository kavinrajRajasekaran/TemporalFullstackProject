import mongoose from 'mongoose'

import { IOrganizationUpdate } from '../models/OrganizationModel'

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