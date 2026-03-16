import express from "express";
import { createDegree, getDegreeDetail, getDegrees } from "../controllers/degreeController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getDegrees).post(protect, adminOnly, createDegree);
router.get("/:id", getDegreeDetail);

export default router;
