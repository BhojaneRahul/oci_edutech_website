import express from "express";
import {
  clearNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getNotifications);
router.put("/read-all", markAllNotificationsRead);
router.delete("/clear", clearNotifications);
router.put("/:id/read", markNotificationRead);
router.delete("/:id", deleteNotification);

export default router;
