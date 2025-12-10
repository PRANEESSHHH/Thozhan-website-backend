import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";


// admin post krega job
export const postJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, location, jobType, experience, position, contactNumber, companyId } = req.body;
        const userId = req.id;

        console.log('=== POST JOB DEBUG ===');
        console.log('Request body:', req.body);
        console.log('User ID:', userId);
        console.log('=== END DEBUG ===');

        if (!title || !description || !requirements || !salary || !location || !jobType || !experience || !position || !contactNumber || !companyId) {
            console.log('Missing fields validation:');
            console.log('title:', !!title);
            console.log('description:', !!description);
            console.log('requirements:', !!requirements);
            console.log('salary:', !!salary);
            console.log('location:', !!location);
            console.log('jobType:', !!jobType);
            console.log('experience:', !!experience);
            console.log('position:', !!position);
            console.log('contactNumber:', !!contactNumber);
            console.log('companyId:', !!companyId);
            
            return res.status(400).json({
                message: "Something is missing.",
                success: false
            })
        };

        // Convert experience text to number for database storage
        let experienceLevel = 0;
        if (typeof experience === 'string') {
            const expLower = experience.toLowerCase();
            if (expLower.includes('entry') || expLower.includes('no experience')) {
                experienceLevel = 0;
            } else if (expLower.includes('1-2') || expLower.includes('junior')) {
                experienceLevel = 1;
            } else if (expLower.includes('3-5') || expLower.includes('mid')) {
                experienceLevel = 3;
            } else if (expLower.includes('5+') || expLower.includes('senior')) {
                experienceLevel = 5;
            } else if (expLower.includes('10+') || expLower.includes('expert')) {
                experienceLevel = 10;
            } else {
                // Try to extract number from string
                const numbers = experience.match(/\d+/);
                experienceLevel = numbers ? parseInt(numbers[0]) : 0;
            }
        } else if (typeof experience === 'number') {
            experienceLevel = experience;
        }

        console.log('Experience conversion:', experience, '->', experienceLevel);

        const job = await Job.create({
            title,
            description,
            requirements: requirements.split(","),
            salary: Number(salary),
            location,
            jobType,
            experienceLevel: experienceLevel,
            position: Number(position),
            contactNumber,
            company: companyId,
            created_by: userId
        });
        
        console.log('Job created successfully:', job._id);
        
        return res.status(201).json({
            message: "New job created successfully.",
            job,
            success: true
        });
    } catch (error) {
        console.log("Error in postJob:", error);
        console.log("Error stack:", error.stack);
        return res.status(500).json({
            message: "Internal server error: " + error.message,
            success: false
        });
    }
}

// student k liye
export const getAllJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword || "";
        
        // Try database first
        try {
            const query = {
                $or: [
                    { title: { $regex: keyword, $options: "i" } },
                    { description: { $regex: keyword, $options: "i" } },
                ]
            };
            const jobs = await Job.find(query).populate({
                path: "company"
            }).sort({ createdAt: -1 });
            
            // Add available positions information with error handling
            let jobsWithAvailablePositions;
            try {
                jobsWithAvailablePositions = await addAvailablePositionsToJobs(jobs);
            } catch (positionError) {
                console.log("Error calculating available positions, returning jobs without positions:", positionError);
                // Return jobs without available positions calculation if it fails
                jobsWithAvailablePositions = jobs.map(job => ({
                    ...job.toObject(),
                    availablePositions: job.position || 0 // Fallback to original position count
                }));
            }
            
            return res.status(200).json({
                jobs: jobsWithAvailablePositions || [],
                success: true
            });
        } catch (dbError) {
            console.error("Database error in getAllJobs:", dbError.message);
            return res.status(500).json({
                message: "Database connection error",
                success: false
            });
        }
    } catch (error) {
        console.log("Error in getAllJobs:", error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
}

// student
export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:"applications"
        });
        if (!job) {
            return res.status(404).json({
                message: "Job not found.",
                success: false
            })
        };

        // Add available positions information
        const availablePositions = await calculateAvailablePositions(jobId, job.position);

        const jobWithAvailablePositions = {
            ...job.toObject(),
            availablePositions
        };

        return res.status(200).json({ 
            job: jobWithAvailablePositions, 
            success: true 
        });
    } catch (error) {
        console.log("Error in getJobById:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

// admin kitne job create kra hai abhi tk
export const getAdminJobs = async (req, res) => {
    try {
        const adminId = req.id;
        
        // Try database first
        try {
            let query = {};
            
            // If no admin ID (no authentication), return all jobs for demo purposes
            if (adminId) {
                query = { created_by: adminId };
            }
            
            const jobs = await Job.find(query).populate({
                path:'company',
                createdAt:-1
            }).populate({
                path: 'applications'
            }).sort({ createdAt: -1 });
            
            // Add available positions information
            const jobsWithAvailablePositions = await addAvailablePositionsToJobs(jobs);
            
            return res.status(200).json({
                jobs: jobsWithAvailablePositions || [],
                success: true
            });
        } catch (dbError) {
            console.error("Database error in getAdminJobs:", dbError.message);
            return res.status(500).json({
                message: "Database connection error",
                success: false
            });
        }
    } catch (error) {
        console.log("Error in getAdminJobs:", error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
}

// Helper function to calculate available positions for a job
const calculateAvailablePositions = async (jobId, totalPositions) => {
    try {
        const acceptedApplicationsCount = await Application.countDocuments({
            job: jobId,
            status: 'accepted'
        });
        return Math.max(0, (totalPositions || 0) - acceptedApplicationsCount);
    } catch (error) {
        console.log("Error calculating available positions for job:", jobId, error);
        return totalPositions || 0; // Return original position count on error
    }
};

// Helper function to add available positions to job objects
const addAvailablePositionsToJobs = async (jobs) => {
    try {
        return await Promise.all(
            jobs.map(async (job) => {
                try {
                    const availablePositions = await calculateAvailablePositions(job._id, job.position);
                    return {
                        ...job.toObject(),
                        availablePositions
                    };
                } catch (jobError) {
                    console.log("Error processing individual job:", job._id, jobError);
                    // Return job without available positions calculation
                    return {
                        ...job.toObject(),
                        availablePositions: job.position || 0
                    };
                }
            })
        );
    } catch (error) {
        console.log("Error in addAvailablePositionsToJobs:", error);
        // Fallback: return jobs without available positions calculation
        return jobs.map(job => ({
            ...job.toObject(),
            availablePositions: job.position || 0
        }));
    }
};

// Admin: Get all jobs from all employers
export const getAllEmployersJobs = async (req, res) => {
    try {
        // Get all jobs from all employers, sorted by most recent first
        const jobs = await Job.find().populate({
            path: 'company',
            select: 'name logo website'
        }).populate({
            path: 'applications',
            select: '_id'
        }).sort({ createdAt: -1 });
        
        // Add available positions information
        const jobsWithAvailablePositions = await addAvailablePositionsToJobs(jobs);
        
        return res.status(200).json({
            jobs: jobsWithAvailablePositions || [],
            success: true
        });
    } catch (error) {
        console.log("Error in getAllEmployersJobs:", error);
        return res.status(500).json({
            message: "Internal server error",
            jobs: [],
            success: false
        });
    }
}
