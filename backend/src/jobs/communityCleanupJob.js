import fs from "fs/promises";
import path from "path";
import { prisma } from "../config/db.js";

const ONE_HOUR = 60 * 60 * 1000;

const removeStoredFile = async (fileUrl) => {
  if (!fileUrl?.includes("/uploads/")) return;

  const relativePath = fileUrl.split("/uploads/")[1];
  if (!relativePath) return;

  const absolutePath = path.resolve(process.cwd(), "backend", "uploads", relativePath);

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.error("Failed to remove expired community file:", absolutePath, error);
    }
  }
};

const cleanupExpiredCommunityData = async () => {
  const now = new Date();

  const expiredFiles = await prisma.chatFile.findMany({
    where: {
      expiresAt: { lte: now }
    },
    select: {
      id: true,
      fileUrl: true,
      messageId: true
    }
  });

  if (expiredFiles.length) {
    await Promise.all(expiredFiles.map((file) => removeStoredFile(file.fileUrl)));
    await prisma.chatFile.deleteMany({
      where: {
        id: {
          in: expiredFiles.map((file) => file.id)
        }
      }
    });
  }

  const expiredMessages = await prisma.communityMessage.findMany({
    where: {
      expiresAt: { lte: now }
    },
    select: { id: true }
  });

  if (!expiredMessages.length) return;

  const expiredMessageIds = expiredMessages.map((message) => message.id);

  await prisma.$transaction([
    prisma.hiddenCommunityMessage.deleteMany({
      where: { messageId: { in: expiredMessageIds } }
    }),
    prisma.messageReaction.deleteMany({
      where: { messageId: { in: expiredMessageIds } }
    }),
    prisma.chatReport.deleteMany({
      where: { messageId: { in: expiredMessageIds } }
    }),
    prisma.chatFile.deleteMany({
      where: { messageId: { in: expiredMessageIds } }
    }),
    prisma.communityMessage.deleteMany({
      where: { id: { in: expiredMessageIds } }
    })
  ]);
};

export const startCommunityCleanupJob = () => {
  cleanupExpiredCommunityData().catch((error) => {
    console.error("Community cleanup failed:", error);
  });

  setInterval(() => {
    cleanupExpiredCommunityData().catch((error) => {
      console.error("Community cleanup failed:", error);
    });
  }, ONE_HOUR);
};
