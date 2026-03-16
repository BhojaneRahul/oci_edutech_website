import express from "express";
import { createProject, getProjects } from "../controllers/projectController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getProjects).post(protect, adminOnly, createProject);

export default router;
