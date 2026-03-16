import express from "express";
import { createMockTest, getMockTests } from "../controllers/mockTestController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getMockTests).post(protect, adminOnly, createMockTest);

export default router;
