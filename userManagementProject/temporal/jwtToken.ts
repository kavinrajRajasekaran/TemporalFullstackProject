
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose'
// Make sure this is set in your .env or replace with a constant in dev
const JWT_SECRET = process.env.JWT_SECRET || 'default_dev_secret';

export interface JWTPayload {
  userId:mongoose.Types.ObjectId;
}


export function generateToken(userId:mongoose.Types.ObjectId): string {
  const payload: JWTPayload = { userId};
  return jwt.sign(payload, JWT_SECRET!, { expiresIn:"7d" });
}


export function verifyToken(token:string):any| false {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!);
    return decoded;
  } catch {
    return false;
  }
}
