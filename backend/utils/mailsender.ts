import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

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
  const mailOptions = {
    from: `"Kavinraj" <${process.env.GMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
