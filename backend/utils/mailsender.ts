import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { AppError } from '../Errors/AppError';

dotenv.config();

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
if(!isValidEmail(options.to)){
  throw new AppError("Invalid Email Adress",400)
}

  const mailOptions = {
    from: `"Kavinraj" <${process.env.GMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };


    const info = await transporter.sendMail(mailOptions);
   
  } catch (error) {
    
    throw error;
  }
}



export function isValidEmail(email:string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}



