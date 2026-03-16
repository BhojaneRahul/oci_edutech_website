import express from "express";
import { submitContactInquiry } from "../controllers/contactController.js";

const router = express.Router();

router.post("/", submitContactInquiry);

export default router;
