import mongoose from 'mongoose';
import { Company } from '../models/company.model.js';
import { Job } from '../models/job.model.js';
import { User } from '../models/user.model.js';
import bcrypt from "bcryptjs";
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};

const addSampleData = async () => {
    try {
        await connectDB();

        // Clear existing data
        console.log('Clearing existing data...');
        await Company.deleteMany({});
        await Job.deleteMany({});

        // Create sample companies
        console.log('Creating sample companies...');
        const companies = await Company.insertMany([
            {
                name: "TechCorp Solutions",
                description: "Leading technology solutions provider",
                website: "https://techcorp.com",
                location: "San Francisco, CA",
                userId: new mongoose.Types.ObjectId(),
            },
            {
                name: "InnovateSoft",
                description: "Innovative software development company",
                website: "https://innovatesoft.com",
                location: "New York, NY",
                userId: new mongoose.Types.ObjectId(),
            },
            {
                name: "DataFlow Systems",
                description: "Data analytics and AI solutions",
                website: "https://dataflow.com",
                location: "Austin, TX",
                userId: new mongoose.Types.ObjectId(),
            },
            {
                name: "CloudTech Industries",
                description: "Cloud infrastructure services",
                website: "https://cloudtech.com",
                location: "Seattle, WA",
                userId: new mongoose.Types.ObjectId(),
            },
            {
                name: "WebSolutions Pro",
                description: "Full-stack web development agency",
                website: "https://websolutions.com",
                location: "Los Angeles, CA",
                userId: new mongoose.Types.ObjectId(),
            }
        ]);

        console.log(`Created ${companies.length} companies`);

        // Create sample jobs
        console.log('Creating sample jobs...');
        const jobs = [];
        
        const jobTitles = [
            "Full Stack Developer",
            "Frontend Developer", 
            "Backend Developer",
            "Data Scientist",
            "DevOps Engineer",
            "UI/UX Designer",
            "Product Manager",
            "Software Engineer",
            "Machine Learning Engineer",
            "System Administrator"
        ];

        const jobTypes = ["Full-time", "Part-time", "Contract", "Internship"];
        const locations = ["Remote", "San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Los Angeles, CA"];

        for (let i = 0; i < 20; i++) {
            const randomCompany = companies[Math.floor(Math.random() * companies.length)];
            const randomTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
            const randomJobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
            const randomLocation = locations[Math.floor(Math.random() * locations.length)];
            
            jobs.push({
                title: randomTitle,
                description: `We are looking for a talented ${randomTitle} to join our dynamic team. This is an excellent opportunity to work with cutting-edge technologies and contribute to innovative projects.`,
                requirements: ["Bachelor's degree in Computer Science", "2+ years of experience", "Strong communication skills", "Team player"],
                salary: Math.floor(Math.random() * 80000) + 60000, // $60k - $140k
                location: randomLocation,
                jobType: randomJobType,
                experienceLevel: Math.floor(Math.random() * 5) + 1, // 1-5 years
                position: Math.floor(Math.random() * 5) + 1, // 1-5 positions
                contactNumber: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                company: randomCompany._id,
                created_by: randomCompany.userId,
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Random date in last 30 days
            });
        }

        const createdJobs = await Job.insertMany(jobs);
        console.log(`Created ${createdJobs.length} jobs`);

        console.log('Sample data added successfully!');
        console.log('\nSample Companies:');
        companies.forEach((company, index) => {
            console.log(`${index + 1}. ${company.name} - ${company.location}`);
        });

        console.log('\nSample Jobs Created:');
        console.log(`Total Jobs: ${createdJobs.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error adding sample data:', error);
        process.exit(1);
    }
};

addSampleData(); 