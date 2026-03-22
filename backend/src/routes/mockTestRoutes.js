import express from "express";
import {
  createMockTest,
  exitMockTest,
  getMockTestById,
  getMockTests,
  saveMockTestAnswer,
  startMockTest,
  submitMockTest
} from "../controllers/mockTestController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getMockTests).post(protect, adminOnly, createMockTest);
router.post("/start", protect, startMockTest);
router.post("/answer", protect, saveMockTestAnswer);
router.post("/submit", protect, submitMockTest);
router.post("/exit", protect, exitMockTest);
router.get("/:id", getMockTestById);

export default router;
