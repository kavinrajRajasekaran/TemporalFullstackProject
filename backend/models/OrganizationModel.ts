export type Tstatus = 'provisoning' | 'updating' | 'deleting' | 'succeed' | 'failure'|"canceled"|"terminated";
import mongoose from 'mongoose';




const OrgSchema = new mongoose.Schema(
  {
    
    authid: {
      type: String,
    },
    name: {
      type: String,
      unique: true,
      required: true,
    },
    display_name: {
      type: String,
      required: true,
    },
    branding: {
      logo_url: {
        type: String,
      },
    },
    metadata: {
      createdByEmail: {
        type: String,
        required: true,
      },
      
      failureReason: {
        type: String,
      },
    },
    colors: {
      page_background: {
        type: String,
      },
      primary: {
        type: String,
      },
    },
    status: {
        type: String,
        enum: ['provisoning', 'updating', 'deleting', 'succeed', 'failure',"canceled","terminated"]
      }
  },
  { timestamps: true }
);

// Export typed model
export const OrganizationModel = mongoose.model<IOrganization & mongoose.Document>('Organization', OrgSchema);




//interfaces
export interface IOrganizationColors {
  page_background?: string;
  primary?: string;
}

export interface IOrganizationBranding {
  logo_url?: string;
}

export interface IOrganizationMetadata {
  createdByEmail: string;
 
  failureReason?: string;
}

export interface IOrganization {
    _id?:mongoose.Types.ObjectId
  authid?: string | null;
  name: string;
  status:Tstatus
  display_name: string;
  branding?: IOrganizationBranding;
  metadata: IOrganizationMetadata;
  colors?: IOrganizationColors;
}

export interface IOrganizationUpdate{
    name?:string,
    display_name?: string;
      branding?:IOrganizationUpdateBranding;
      metadata?: IOrganizationMetadata;
      
} 


export interface IOrganizationUpdateBranding{
  logo_url?:string,
  colors?:IOrganizationColors
}