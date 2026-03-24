import express from "express";
import {
  deleteTeacherVerification,
  deleteUser,
  getAdminOverview,
  getTeacherVerifications,
  getUsers,
  reviewTeacherVerification,
  updateSiteStatsSettings,
  updateUser
} from "../controllers/adminController.js";
import { deleteDocument, getAdminDocuments, updateDocument, uploadDocument } from "../controllers/documentController.js";
import {
  createMockTest,
  deleteMockTest,
  getAdminMockTestById,
  getAdminMockTests,
  updateMockTest
} from "../controllers/mockTestController.js";
import { createProject, deleteProject, getAdminProjects } from "../controllers/projectController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { uploadPdf, uploadProjectAssets } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);
router.get("/overview", getAdminOverview);
router.put("/site-stats", updateSiteStatsSettings);
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/teacher-verifications", getTeacherVerifications);
router.put("/teacher-verifications/:id", reviewTeacherVerification);
router.delete("/teacher-verifications/:id", deleteTeacherVerification);
router.get("/documents", getAdminDocuments);
router.post("/upload-document", uploadPdf.single("file"), uploadDocument);
router.put("/documents/:id", uploadPdf.single("file"), updateDocument);
router.delete("/documents/:id", deleteDocument);
router.get("/mock-tests", getAdminMockTests);
router.get("/mock-tests/:id", getAdminMockTestById);
router.post("/mock-tests", createMockTest);
router.put("/mock-tests/:id", updateMockTest);
router.delete("/mock-tests/:id", deleteMockTest);
router.get("/projects", getAdminProjects);
router.post(
  "/project",
  uploadProjectAssets.fields([
    { name: "images", maxCount: 5 },
    { name: "projectFile", maxCount: 1 },
    { name: "reportFile", maxCount: 1 }
  ]),
  createProject
);
router.delete("/projects/:id", deleteProject);

export default router;
