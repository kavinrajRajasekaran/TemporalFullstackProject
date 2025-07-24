import mongoose from 'mongoose';

const DB_URI =process.env.DB_URI!

export async function connectToMongo(DB_URI:string) {
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

