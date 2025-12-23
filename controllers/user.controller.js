import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;
         
        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        
        let cloudResponse = null;
        if (req.file) {
            const file = req.file;
            const fileUri = getDataUri(file);
            cloudResponse = await cloudinary.uploader.upload(fileUri.content);
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                message: 'User already exist with this email.',
                success: false,
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile:{
                profilePhoto: cloudResponse ? cloudResponse.secure_url : "",
            }
        });

        return res.status(201).json({
            message: "Account created successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        };
        // check role is correct or not
        if (role !== user.role) {
            return res.status(400).json({
                message: "Account doesn't exist with current role.",
                success: false
            })
        };

        const tokenData = {
            userId: user._id
        }
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile,
            savedJobs: user.savedJobs || [],
            createdAt: user.createdAt
        }

        // Cookie settings for cross-origin authentication
        const cookieOptions = {
            maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
            httpOnly: true, // Prevents JavaScript access to cookie
            secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
            domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined
        };

        return res.status(200).cookie("token", token, cookieOptions).json({
            message: `Welcome back ${user.fullname}`,
            user,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
export const logout = async (req, res) => {
    try {
        // Use same cookie options to properly clear the cookie
        const cookieOptions = {
            maxAge: 0,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined
        };
        
        return res.status(200).cookie("token", "", cookieOptions).json({
            message: "Logged out successfully.",
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
export const updateProfile = async (req, res) => {
    try {
        const { 
            fullname, 
            email, 
            phoneNumber, 
            bio, 
            skills, 
            location, 
            experience,
            // New enhanced fields for job seekers
            linkedin,
            website,
            availability,
            salaryExpectation,
            preferredJobType,
            yearsOfExperience,
            certifications,
            languages,
            // Employer specific fields
            companyName,
            companyWebsite,
            companySize,
            industry,
            companyDescription,
            foundedYear,
            companyLinkedin
        } = req.body;
        
        let resumeCloudResponse = null;
        let profilePhotoCloudResponse = null;
        
        // Check for resume file upload
        if (req.files && req.files.file && req.files.file[0]) {
            const file = req.files.file[0];
            const fileUri = getDataUri(file);
            resumeCloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                resource_type: 'auto'
            });
        }
        
        // Check for profile photo upload
        if (req.files && req.files.profilePhoto && req.files.profilePhoto[0]) {
            const profilePhoto = req.files.profilePhoto[0];
            const fileUri = getDataUri(profilePhoto);
            profilePhotoCloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                resource_type: 'image'
            });
        }

        let skillsArray;
        if(skills){
            skillsArray = skills.split(",").map(skill => skill.trim()).filter(skill => skill.length > 0);
        }

        let certificationsArray;
        if(certifications){
            try {
                certificationsArray = JSON.parse(certifications);
            } catch (e) {
                certificationsArray = [];
            }
        }

        let languagesArray;
        if(languages){
            try {
                languagesArray = JSON.parse(languages);
            } catch (e) {
                languagesArray = [];
            }
        }
        
        const userId = req.id; // middleware authentication
        let user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({
                message: "User not found.",
                success: false
            })
        }

        // updating basic data
        if(fullname) user.fullname = fullname
        if(email) user.email = email
        if(phoneNumber) user.phoneNumber = phoneNumber
        
        // updating profile data
        if(bio) user.profile.bio = bio
        if(skills) user.profile.skills = skillsArray
        if(location) user.profile.location = location
        if(experience) user.profile.experience = experience
        
        // Enhanced job seeker fields
        if(linkedin !== undefined) user.profile.linkedin = linkedin
        if(website !== undefined) user.profile.website = website
        if(availability !== undefined) user.profile.availability = availability
        if(salaryExpectation !== undefined) user.profile.salaryExpectation = salaryExpectation
        if(preferredJobType !== undefined) user.profile.preferredJobType = preferredJobType
        if(yearsOfExperience !== undefined) user.profile.yearsOfExperience = yearsOfExperience
        if(certificationsArray) user.profile.certifications = certificationsArray
        if(languagesArray) user.profile.languages = languagesArray
        
        // Employer specific fields
        if(companyName !== undefined) user.profile.companyName = companyName
        if(companyWebsite !== undefined) user.profile.companyWebsite = companyWebsite
        if(companySize !== undefined) user.profile.companySize = companySize
        if(industry !== undefined) user.profile.industry = industry
        if(companyDescription !== undefined) user.profile.companyDescription = companyDescription
        if(foundedYear !== undefined) user.profile.foundedYear = foundedYear
        if(companyLinkedin !== undefined) user.profile.companyLinkedin = companyLinkedin
      
        // update resume if uploaded
        if(resumeCloudResponse){
            user.profile.resume = resumeCloudResponse.secure_url; // save the cloudinary url
            user.profile.resumeOriginalName = req.files.file[0].originalname; // Save the original file name
        }
        
        // update profile photo if uploaded
        if(profilePhotoCloudResponse){
            user.profile.profilePhoto = profilePhotoCloudResponse.secure_url;
        }

        await user.save();

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).json({
            message:"Profile updated successfully.",
            user,
            success:true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

export const saveJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.id;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Check if the job is already saved
        if (user.savedJobs.includes(jobId)) {
            return res.status(400).json({
                message: "Job already saved",
                success: false
            });
        }

        // Add the job to savedJobs
        user.savedJobs.push(jobId);
        await user.save();

        return res.status(200).json({
            message: "Job saved successfully",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const unsaveJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.id;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Check if the job is saved
        if (!user.savedJobs.includes(jobId)) {
            return res.status(400).json({
                message: "Job not saved",
                success: false
            });
        }

        // Remove the job from savedJobs
        user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
        await user.save();

        return res.status(200).json({
            message: "Job removed from saved",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const toggleSavedJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.id;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Check if the job is already saved
        const jobIndex = user.savedJobs.findIndex(id => id.toString() === jobId);
        
        if (jobIndex !== -1) {
            // Remove the job from savedJobs
            user.savedJobs.splice(jobIndex, 1);
            await user.save();
            return res.status(200).json({
                message: "Job removed from saved",
                success: true,
                isSaved: false
            });
        } else {
            // Add the job to savedJobs
            user.savedJobs.push(jobId);
            await user.save();
            return res.status(200).json({
                message: "Job saved successfully",
                success: true,
                isSaved: true
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const getSavedJobs = async (req, res) => {
    try {
        const userId = req.id;

        // Find the user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Check if savedJobs array exists
        if (!user.savedJobs || !Array.isArray(user.savedJobs)) {
            return res.status(200).json({
                savedJobs: [],
                success: true
            });
        }

        // Populate job data with proper error handling
        try {
            await user.populate({
                path: 'savedJobs',
                populate: {
                    path: 'company',
                    select: 'name logo'
                }
            });

            // Filter out any null references that may have occurred if jobs were deleted
            const validSavedJobs = user.savedJobs.filter(job => job !== null);

            return res.status(200).json({
                savedJobs: validSavedJobs,
                success: true
            });
        } catch (populateError) {
            console.error("Error while populating saved jobs:", populateError);

            // Return just the IDs if population fails
            return res.status(200).json({
                savedJobs: user.savedJobs,
                success: true,
                populationFailed: true
            });
        }
    } catch (error) {
        console.error("Error in getSavedJobs:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        const userId = req.id;

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        return res.status(200).json({
            user,
            success: true
        });
    } catch (error) {
        console.error("Error in getProfile:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
