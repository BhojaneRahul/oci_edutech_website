import express from "express";
import {
  getDocumentById,
  getDocuments,
  incrementDocumentDownload,
  incrementDocumentView
} from "../controllers/documentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getDocuments);
router.get("/:id", getDocumentById);
router.post("/:id/view", protect, incrementDocumentView);
router.post("/:id/download", protect, incrementDocumentDownload);

export default router;
