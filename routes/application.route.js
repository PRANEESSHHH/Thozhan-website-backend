import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { applyJob, getApplicants, getAppliedJobs, updateStatus, getEmployerApplications } from "../controllers/application.controller.js";
 
const router = express.Router();

router.route("/test").get((req, res) => {
    res.json({
        message: "Application route is working!",
        success: true
    });
});
router.route("/apply/:id").post(isAuthenticated, applyJob);
router.route("/get").get(isAuthenticated, getAppliedJobs);
router.route("/:id/applicants").get(isAuthenticated, getApplicants);
router.route("/status/:id/update").post(isAuthenticated, updateStatus);
router.route("/employer/all").get(isAuthenticated, getEmployerApplications);

export default router;

