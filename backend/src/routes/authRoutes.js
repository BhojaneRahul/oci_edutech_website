import express from "express";
import passport from "../config/passport.js";
import {
  changePassword,
  forgotPassword,
  getLikedDocumentStatus,
  getSavedDocuments,
  getSavedDocumentStatus,
  getCurrentUser,
  googleCallback,
  likeDocument,
  loginUser,
  logoutUser,
  removeLikedDocument,
  removeSavedDocument,
  registerUser,
  resetPassword,
  saveDocument,
  uploadAvatar,
  updateProfile
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadAvatar as uploadAvatarMiddleware } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getCurrentUser);
router.get("/saved-documents", protect, getSavedDocuments);
router.get("/saved-documents/:documentId/status", protect, getSavedDocumentStatus);
router.post("/saved-documents", protect, saveDocument);
router.delete("/saved-documents/:documentId", protect, removeSavedDocument);
router.get("/liked-documents/:documentId/status", protect, getLikedDocumentStatus);
router.post("/liked-documents", protect, likeDocument);
router.delete("/liked-documents/:documentId", protect, removeLikedDocument);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/avatar", protect, uploadAvatarMiddleware.single("avatar"), uploadAvatar);
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.CLIENT_URL}/auth?error=google` }),
  googleCallback
);

export default router;
