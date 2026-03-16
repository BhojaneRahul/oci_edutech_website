import express from "express";
import { createSubject, getSubjects } from "../controllers/subjectController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getSubjects).post(protect, adminOnly, createSubject);

export default router;
