import express from "express";
import { deleteUser, getAdminOverview, getUsers, updateUser } from "../controllers/adminController.js";
import { getAdminDocuments, updateDocument, uploadDocument } from "../controllers/documentController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { uploadPdf } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);
router.get("/overview", getAdminOverview);
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/documents", getAdminDocuments);
router.post("/upload-document", uploadPdf.single("file"), uploadDocument);
router.put("/documents/:id", uploadPdf.single("file"), updateDocument);

export default router;
