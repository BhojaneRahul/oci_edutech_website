import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import { buildDocumentTargetPath, serializeNotification } from "../services/notificationService.js";

const resolveNotificationTargetPath = async (notification) => {
  if (notification.targetPath) {
    return notification.targetPath;
  }

  if (!notification.documentId) {
    return null;
  }

  const document = await prisma.document.findUnique({
    where: { id: notification.documentId },
    select: {
      id: true,
      fileUrl: true,
      title: true,
      type: true
    }
  });

  if (!document?.fileUrl) {
    return null;
  }

  return buildDocumentTargetPath(document);
};

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

  const serializedNotifications = await Promise.all(
    notifications.map(async (notification) => ({
      ...serializeNotification(notification),
      targetPath: await resolveNotificationTargetPath(notification)
    }))
  );

  res.json({
    success: true,
    unreadCount,
    notifications: serializedNotifications
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
  const type = typeof req.query.type === "string" ? req.query.type.trim() : "";
  const excludeType = typeof req.query.excludeType === "string" ? req.query.excludeType.trim() : "";

  await prisma.notification.updateMany({
    where: {
      userId: req.user.id,
      isRead: false,
      ...(type ? { type } : {}),
      ...(excludeType ? { type: { not: excludeType } } : {})
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

export const deleteNotification = asyncHandler(async (req, res) => {
  const notificationId = Number(req.params.id);

  await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId: req.user.id
    }
  });

  res.json({
    success: true,
    message: "Notification deleted"
  });
});

export const clearNotifications = asyncHandler(async (req, res) => {
  const excludeType = typeof req.query.excludeType === "string" ? req.query.excludeType.trim() : "";

  await prisma.notification.deleteMany({
    where: {
      userId: req.user.id,
      ...(excludeType ? { type: { not: excludeType } } : {})
    }
  });

  res.json({
    success: true,
    message: "Notifications cleared"
  });
});
