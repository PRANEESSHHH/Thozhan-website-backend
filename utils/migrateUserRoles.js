import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import 'dotenv/config';

const migrateUserRoles = async () => {
  try {
    console.log('Starting user role migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log('Connected to MongoDB');
    
    // Find all users with old roles
    const studentUsers = await User.find({ role: 'student' });
    const recruiterUsers = await User.find({ role: 'recruiter' });
    
    console.log(`Found ${studentUsers.length} users with 'student' role`);
    console.log(`Found ${recruiterUsers.length} users with 'recruiter' role`);
    
    // Update student to worker
    if (studentUsers.length > 0) {
      const studentResult = await User.updateMany(
        { role: 'student' },
        { $set: { role: 'worker' } }
      );
      console.log(`Updated ${studentResult.modifiedCount} student users to workers`);
    }
    
    // Update recruiter to employer
    if (recruiterUsers.length > 0) {
      const recruiterResult = await User.updateMany(
        { role: 'recruiter' },
        { $set: { role: 'employer' } }
      );
      console.log(`Updated ${recruiterResult.modifiedCount} recruiter users to employers`);
    }
    
    console.log('Migration completed successfully');
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the migration
migrateUserRoles(); 