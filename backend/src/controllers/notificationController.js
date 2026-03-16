import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 12
  });

  const unreadCount = await prisma.notification.count({
    where: {
      userId: req.user.id,
      isRead: false
    }
  });

  res.json({
    success: true,
    unreadCount,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      documentId: notification.documentId,
      isRead: notification.isRead,
      createdAt: notification.createdAt
    }))
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notificationId = Number(req.params.id);

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: req.user.id
    },
    data: {
      isRead: true
    }
  });

  res.json({
    success: true,
    message: "Notification marked as read"
  });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: {
      userId: req.user.id,
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  res.json({
    success: true,
    message: "All notifications marked as read"
  });
});
