import  mongoose, { Schema, model } from 'mongoose';

const UserSchema = new Schema({

  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  authId: { type: String },
  status: {
    type: String,
    enum: ['provisioning', 'updating', 'deleting', 'succeed', 'failed'],
    default: 'provisioning',
  },
  failureReason: { type: String },
}, { timestamps: true });

export type Tstatus='provisioning'|'updating'|'deleting'|'succeed'|'failed'

export interface IUser{
  _id?:mongoose.Types.ObjectId
  name:string,
  email:string,
  password?:string,
  authId:string,
  status:Tstatus,
  failureReason:string
}



export type status='provisioning'|'updating'|'deleting'|'succeed'|'failed'

export const UserModel = model<IUser>('User', UserSchema);
