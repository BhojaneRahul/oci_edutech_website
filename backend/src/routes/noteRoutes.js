import express from "express";
import { createNote, getNotes } from "../controllers/noteController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getNotes).post(protect, adminOnly, createNote);

export default router;
