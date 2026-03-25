import express from "express";
import {
  getAdminSyllabusRequests,
  deleteSyllabusGeneration,
  generateSyllabusNotes,
  getMySyllabusGenerations,
  getSyllabusGenerationById
} from "../controllers/syllabusController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { uploadSyllabusPdf } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getMySyllabusGenerations);
router.post("/generate", uploadSyllabusPdf.single("file"), generateSyllabusNotes);
router.get("/admin/requests", adminOnly, getAdminSyllabusRequests);
router.get("/:id", getSyllabusGenerationById);
router.delete("/:id", deleteSyllabusGeneration);

export default router;
