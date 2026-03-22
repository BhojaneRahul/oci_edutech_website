import express from "express";
import { getSiteStats, trackSiteVisit } from "../controllers/siteStatsController.js";

const router = express.Router();

router.get("/stats", getSiteStats);
router.post("/visit", trackSiteVisit);

export default router;
