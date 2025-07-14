import mongoose from 'mongoose';

const DB_URI =process.env.DB_URI||'mongodb://localhost:27017/'

export async function connectToMongo() {
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}