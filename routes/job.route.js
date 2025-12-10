import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getAdminJobs, getAllEmployersJobs, getAllJobs, getJobById, postJob } from "../controllers/job.controller.js";

const router = express.Router();

router.route("/post").post(isAuthenticated, postJob);
router.route("/get").get(getAllJobs);
router.route("/admin/get").get(getAdminJobs);
router.route("/admin/all-employers").get(isAuthenticated, getAllEmployersJobs);
router.route("/get/:id").get(getJobById);

export default router;

