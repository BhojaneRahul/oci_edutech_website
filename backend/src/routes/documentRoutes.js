import express from "express";
import {
  deleteTeacherNote,
  getDocumentById,
  getDocuments,
  getTeacherNotes,
  incrementDocumentDownload,
  incrementDocumentView,
  uploadTeacherNote
} from "../controllers/documentController.js";
import { protect, verifiedTeacherOnly } from "../middleware/authMiddleware.js";
import { uploadPdf } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", getDocuments);
router.get("/teacher-notes", getTeacherNotes);
router.post("/teacher-notes", protect, verifiedTeacherOnly, uploadPdf.single("file"), uploadTeacherNote);
router.delete("/teacher-notes/:id", protect, deleteTeacherNote);
router.get("/:id", getDocumentById);
router.post("/:id/view", protect, incrementDocumentView);
router.post("/:id/download", protect, incrementDocumentDownload);

export default router;
