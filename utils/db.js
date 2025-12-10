import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({});

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not defined');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas');
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('Please check your MongoDB Atlas connection string and credentials');
        process.exit(1); // Exit the application if database connection fails
    }
}

export default connectDB;