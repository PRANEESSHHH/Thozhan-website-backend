import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";

// Helper function to get available positions for a job
export const getAvailablePositions = async (jobId) => {
    try {
        const job = await Job.findById(jobId);
        if (!job) return 0;
        
        const acceptedApplicationsCount = await Application.countDocuments({
            job: jobId,
            status: 'accepted'
        });
        
        return Math.max(0, job.position - acceptedApplicationsCount);
    } catch (error) {
        console.log("Error calculating available positions:", error);
        return 0;
    }
};

export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required.",
                success: false
            })
        };

        // check if the jobs exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            })
        }

        // check if there are available positions
        const acceptedApplicationsCount = await Application.countDocuments({ 
            job: jobId, 
            status: 'accepted' 
        });
        
        if (acceptedApplicationsCount >= job.position) {
            return res.status(400).json({
                message: "No positions available for this job",
                success: false
            });
        }

        // check if the user has already applied for the job
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });

        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this jobs",
                success: false
            });
        }

        // create a new application
        const newApplication = await Application.create({
            job:jobId,
            applicant:userId,
        });

        job.applications.push(newApplication._id);
        await job.save();
        return res.status(201).json({
            message:"Job applied successfully.",
            success:true
        })
    } catch (error) {
        console.log("Error in applyJob:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const getAppliedJobs = async (req,res) => {
    try {
        const userId = req.id;
        const application = await Application.find({applicant:userId}).sort({createdAt:-1}).populate({
            path:'job',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'company',
                options:{sort:{createdAt:-1}},
            }
        });
        if(!application){
            return res.status(404).json({
                message:"No Applications",
                success:false
            })
        };
        return res.status(200).json({
            application,
            success:true
        })
    } catch (error) {
        console.log("Error in getAppliedJobs:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

// admin dekhega kitna user ne apply kiya hai
export const getApplicants = async (req,res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:'applications',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'applicant'
            }
        });
        if(!job){
            return res.status(404).json({
                message:'Job not found.',
                success:false
            })
        };
        return res.status(200).json({
            job, 
            success:true
        });
    } catch (error) {
        console.log("Error in getApplicants:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

export const updateStatus = async (req,res) => {
    try {
        const {status} = req.body;
        const applicationId = req.params.id;
        
        console.log('Update status request:', { applicationId, status });
        
        if(!status){
            return res.status(400).json({
                message:'Status is required',
                success:false
            })
        };

        // Validate status
        const validStatuses = ['pending', 'accepted', 'rejected', 'waitlist'];
        if (!validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                success: false
            });
        }

        // find the application by application id
        const application = await Application.findOne({_id:applicationId}).populate({
            path: 'applicant',
            select: 'fullname email'
        }).populate({
            path: 'job',
            select: 'title position'
        });
        
        if(!application){
            return res.status(404).json({
                message:"Application not found.",
                success:false
            })
        };

        const previousStatus = application.status;
        const newStatus = status.toLowerCase();

        // If changing to 'accepted', check if there are available positions
        if (newStatus === 'accepted' && previousStatus !== 'accepted') {
            const acceptedApplicationsCount = await Application.countDocuments({ 
                job: application.job._id, 
                status: 'accepted' 
            });
            
            if (acceptedApplicationsCount >= application.job.position) {
                return res.status(400).json({
                    message: "No positions available for this job",
                    success: false
                });
            }
        }

        // update the status
        application.status = newStatus;
        await application.save();

        console.log('Status updated successfully:', {
            applicationId,
            previousStatus,
            newStatus: application.status,
            applicant: application.applicant?.fullname,
            job: application.job?.title
        });

        return res.status(200).json({
            message:"Status updated successfully.",
            application: {
                _id: application._id,
                status: application.status,
                applicant: application.applicant,
                job: application.job
            },
            success:true
        });

    } catch (error) {
        console.log("Error in updateStatus:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

// Get all applications for an employer across all their jobs
export const getEmployerApplications = async (req, res) => {
    try {
        const employerId = req.id;
        
        // Find all jobs posted by this employer
        const employerJobs = await Job.find({ created_by: employerId }).select('_id');
        const jobIds = employerJobs.map(job => job._id);
        
        // Find all applications for these jobs
        const applications = await Application.find({ 
            job: { $in: jobIds } 
        }).populate({
            path: 'applicant',
            select: 'fullname email phoneNumber profile.resume profile.resumeOriginalName'
        }).populate({
            path: 'job',
            select: 'title company',
            populate: {
                path: 'company',
                select: 'name'
            }
        }).sort({ createdAt: -1 });
        
        return res.status(200).json({
            applications,
            total: applications.length,
            success: true
        });
        
    } catch (error) {
        console.log("Error in getEmployerApplications:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}