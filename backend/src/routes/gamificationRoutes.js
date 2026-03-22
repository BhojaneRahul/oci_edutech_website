import express from "express";
import {
  completeMockTest,
  getGamificationDashboard,
  getLeaderboard,
  trackDocumentOpen,
  trackStudyProgress
} from "../controllers/gamificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, getGamificationDashboard);
router.get("/leaderboard", protect, getLeaderboard);
router.post("/document-open", protect, trackDocumentOpen);
router.post("/study-progress", protect, trackStudyProgress);
router.post("/mock-test-complete", protect, completeMockTest);

export default router;
