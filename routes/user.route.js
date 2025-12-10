import express from "express";
import { 
    login, 
    logout, 
    register, 
    updateProfile, 
    saveJob, 
    unsaveJob, 
    toggleSavedJob, 
    getSavedJobs 
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload, multiUpload } from "../middlewares/mutler.js";
 
const router = express.Router();

router.route("/register").post(singleUpload,register);
router.route("/login").post(login);
router.route("/logout").get(isAuthenticated,logout);
router.route("/profile/update").post(isAuthenticated,multiUpload,updateProfile);

// Saved jobs routes
router.route("/jobs/save/:jobId").post(isAuthenticated, saveJob);
router.route("/jobs/unsave/:jobId").post(isAuthenticated, unsaveJob);
router.route("/jobs/toggle-save/:jobId").post(isAuthenticated, toggleSavedJob);
router.route("/jobs/saved").get(isAuthenticated, getSavedJobs);

export default router;

