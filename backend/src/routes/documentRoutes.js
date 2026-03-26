import express from "express";
import {
  deleteTeacherNote,
  getAdminTeacherNotes,
  getDocumentById,
  getDocuments,
  getTeacherNotes,
  incrementDocumentDownload,
  incrementDocumentView,
  updateTeacherNote,
  updateTeacherNoteStatus,
  uploadTeacherNote
} from "../controllers/documentController.js";
import { adminOnly, protect, verifiedTeacherOnly } from "../middleware/authMiddleware.js";
import { uploadPdf } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", getDocuments);
router.get("/teacher-notes", getTeacherNotes);
router.post("/teacher-notes", protect, verifiedTeacherOnly, uploadPdf.single("file"), uploadTeacherNote);
router.put("/teacher-notes/:id", protect, verifiedTeacherOnly, uploadPdf.single("file"), updateTeacherNote);
router.delete("/teacher-notes/:id", protect, deleteTeacherNote);
router.get("/admin/teacher-notes", protect, adminOnly, getAdminTeacherNotes);
router.put("/admin/teacher-notes/:id/status", protect, adminOnly, updateTeacherNoteStatus);
router.get("/:id", getDocumentById);
router.post("/:id/view", protect, incrementDocumentView);
router.post("/:id/download", protect, incrementDocumentDownload);

export default router;
