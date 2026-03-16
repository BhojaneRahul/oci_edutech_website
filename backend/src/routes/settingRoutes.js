import express from "express";
import { getSettings, upsertSetting } from "../controllers/settingsController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getSettings);
router.post("/", protect, adminOnly, upsertSetting);

export default router;
