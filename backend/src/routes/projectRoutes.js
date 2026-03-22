import express from "express";
import {
  createProject,
  deleteProject,
  downloadProjectFile,
  downloadProjectReport,
  getAdminProjects,
  getProjectById,
  getProjects
} from "../controllers/projectController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { uploadProjectAssets } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", getProjects);
router.get("/admin/list", protect, adminOnly, getAdminProjects);
router.get("/download/:id", protect, downloadProjectFile);
router.get("/report/:id", protect, downloadProjectReport);
router.get("/:id", getProjectById);
router.post(
  "/",
  protect,
  adminOnly,
  uploadProjectAssets.fields([
    { name: "images", maxCount: 5 },
    { name: "projectFile", maxCount: 1 },
    { name: "reportFile", maxCount: 1 }
  ]),
  createProject
);
router.delete("/:id", protect, adminOnly, deleteProject);

export default router;
