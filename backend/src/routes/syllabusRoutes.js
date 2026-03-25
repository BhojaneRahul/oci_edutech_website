import express from "express";
import {
  deleteSyllabusGeneration,
  generateSyllabusNotes,
  getMySyllabusGenerations,
  getSyllabusGenerationById
} from "../controllers/syllabusController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadSyllabusPdf } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getMySyllabusGenerations);
router.post("/generate", uploadSyllabusPdf.single("file"), generateSyllabusNotes);
router.get("/:id", getSyllabusGenerationById);
router.delete("/:id", deleteSyllabusGeneration);

export default router;
