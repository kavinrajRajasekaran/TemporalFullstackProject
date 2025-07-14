export type Tstatus = 'provisoning' | 'updating' | 'deleting' | 'succeed' | 'failure';
import mongoose from 'mongoose';
export interface IColors {
  page_background?: string;
  primary?: string;
}

export interface IBranding {
  logo_url?: string;
}

export interface IMetadata {
  createdByEmail: string;
 
  failureReason?: string;
}

export interface IOrg {
    _id?:mongoose.Types.ObjectId
  authid?: string | null;
  name: string;
  status:string
  display_name: string;
  branding?: IBranding;
  metadata: IMetadata;
  colors?: IColors;
}

export interface Iupdate{
    name?:string,
    display_name?: string;
      branding?: IBranding;
      metadata?: IMetadata;
      colors?: IColors;
} 


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
        enum: ['provisoning', 'updating', 'deleting', 'succeed', 'failure'],
      }
  },
  { timestamps: true }
);

// Export typed model
export const OrgModel = mongoose.model<IOrg & mongoose.Document>('Organization', OrgSchema);
