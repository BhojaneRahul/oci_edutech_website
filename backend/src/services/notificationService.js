import { prisma } from "../config/db.js";
import { getSocketServer } from "../config/socket.js";

const userRoomName = (userId) => `user:${Number(userId)}`;

const buildNotificationPayload = (notification) => ({
  id: notification.id,
  title: notification.title,
  message: notification.message,
  type: notification.type || "general",
  documentId: notification.documentId ?? null,
  targetPath: notification.targetPath ?? null,
  isRead: notification.isRead,
  createdAt: notification.createdAt
});

export const buildDocumentTargetPath = (document) => {
  const params = new URLSearchParams({
    documentId: String(document.id),
    url: document.fileUrl,
    title: document.title,
    type: document.type
  });

  return `/viewer?${params.toString()}`;
};

export const buildMockTestTargetPath = (mockTestId) => `/mock-tests/${Number(mockTestId)}`;
export const buildProjectTargetPath = (projectId) => `/projects/${Number(projectId)}`;
export const buildCommunityTargetPath = () => "/community";

export const createNotifications = async ({ userIds, title, message, type = "general", documentId = null, targetPath = null }) => {
  const normalizedUserIds = [...new Set((Array.isArray(userIds) ? userIds : [userIds]).map((id) => Number(id)).filter(Boolean))];

  if (!normalizedUserIds.length) {
    return [];
  }

  await prisma.notification.createMany({
    data: normalizedUserIds.map((userId) => ({
      userId,
      title,
      message,
      type,
      documentId,
      targetPath
    }))
  });

  const notifications = await prisma.notification.findMany({
    where: {
      userId: { in: normalizedUserIds },
      title,
      message,
      type,
      documentId,
      targetPath
    },
    orderBy: { createdAt: "desc" },
    take: normalizedUserIds.length
  });

  const io = getSocketServer();
  if (io) {
    notifications.forEach((notification) => {
      io.to(userRoomName(notification.userId)).emit("notification:new", buildNotificationPayload(notification));
    });
  }

  return notifications.map(buildNotificationPayload);
};

export const serializeNotification = (notification) => buildNotificationPayload(notification);
