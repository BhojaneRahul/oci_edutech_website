import fs from "fs";
import path from "path";
import asyncHandler from "express-async-handler";
import { fileURLToPath } from "url";
import { prisma } from "../config/db.js";
import {
  emitCommunityHistoryCleared,
  emitCommunityMessage,
  emitCommunityMessagesDeleted,
  emitCommunityMessageUpdate,
  formatCommunityMessage,
  getActiveCommunityUserIds,
  getCommunityPresenceSnapshot,
  registerCommunityHeartbeat
} from "../config/socket.js";
import { buildCommunityTargetPath, createNotifications } from "../services/notificationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const teacherVerificationInclude = {
  communityGroup: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  }
};

const preferredOrder = ["BCA Community", "BBA Community", "BSc Community", "BA Community", "B.Com Community"];
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const FOREVER_MUTE_UNTIL = new Date("9999-12-31T23:59:59.000Z");

const defaultCommunityGroups = [
  { name: "BCA Community", slug: "bca-community", description: "Degree-level discussion for BCA learners." },
  { name: "BBA Community", slug: "bba-community", description: "Business administration student hub." },
  { name: "BSc Community", slug: "bsc-community", description: "Science degree discussion space." },
  { name: "BA Community", slug: "ba-community", description: "Arts and humanities study community." },
  { name: "B.Com Community", slug: "bcom-community", description: "Commerce student group." },
  { name: "1st PUC", slug: "1st-puc", description: "First PUC student community." },
  { name: "2nd PUC", slug: "2nd-puc", description: "Second PUC student community." }
];

const isMissingTableError = (error, tableName) =>
  error?.code === "P2021" &&
  (!tableName || String(error?.meta?.table || "").toLowerCase() === tableName.toLowerCase());

const getSafeMuteSetting = async (userId, groupId) => {
  try {
    return await prisma.userMuteSetting.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });
  } catch (error) {
    if (isMissingTableError(error, "user_mute_settings")) {
      return null;
    }
    throw error;
  }
};

const getCommunityNotificationRecipientIds = async (groupId, senderId) => {
  const now = new Date();
  const activeViewerIds = new Set(getActiveCommunityUserIds(groupId));
  const mutedSettings = await prisma.userMuteSetting.findMany({
    where: {
      groupId,
      OR: [{ muteUntil: null }, { muteUntil: { gt: now } }]
    },
    select: { userId: true }
  });

  const mutedUserIds = new Set(mutedSettings.map((setting) => setting.userId));

  const users = await prisma.user.findMany({
    where: {
      communityGroupId: groupId,
      id: { not: senderId }
    },
    select: { id: true }
  });

  return users
    .map((user) => user.id)
    .filter((userId) => !mutedUserIds.has(userId))
    .filter((userId) => !activeViewerIds.has(userId));
};

const getSafeCommunityMessageIds = async (groupId, userId, take = 80, sort = "desc") => {
  try {
    return await prisma.communityMessage.findMany({
      take,
      orderBy: { createdAt: sort },
      where: {
        groupId,
        expiresAt: { gt: new Date() },
        hiddenForUsers: {
          none: {
            userId
          }
        }
      },
      select: { id: true }
    });
  } catch (error) {
    if (!isMissingTableError(error, "hidden_community_messages")) {
      throw error;
    }

    return prisma.communityMessage.findMany({
      take,
      orderBy: { createdAt: sort },
      where: {
        groupId,
        expiresAt: { gt: new Date() }
      },
      select: { id: true }
    });
  }
};

const sortCommunityGroups = (groups) =>
  [...groups].sort((left, right) => {
    const leftIndex = preferredOrder.indexOf(left.name);
    const rightIndex = preferredOrder.indexOf(right.name);
    if (leftIndex === -1 && rightIndex === -1) return left.name.localeCompare(right.name);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });

const ensureCommunityGroups = async () => {
  const count = await prisma.communityGroup.count();
  if (!count) {
    await prisma.communityGroup.createMany({ data: defaultCommunityGroups });
  }
  const groups = await prisma.communityGroup.findMany({ orderBy: { name: "asc" } });
  return sortCommunityGroups(groups);
};

const ensureCommunityAccess = async (userId, groupId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      communityGroupId: true
    }
  });

  if (user?.role !== "admin" && user?.communityGroupId !== groupId) {
    const error = new Error("You can only access your assigned community");
    error.statusCode = 403;
    throw error;
  }
};

const formatBytes = (bytes) => {
  if (!bytes) return 0;
  return Number(bytes);
};

const getChatFileType = (file) => {
  const lowerName = file.originalname.toLowerCase();
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) return "image";
  if (file.mimetype === "application/pdf" || lowerName.endsWith(".pdf")) return "pdf";
  if (
    file.mimetype === "application/msword" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".doc") ||
    lowerName.endsWith(".docx")
  ) {
    return "doc";
  }
  return "ppt";
};

const buildMutePayload = (setting) => {
  if (!setting?.muteUntil) {
    return { muted: false, muteUntil: null, label: null };
  }

  const muteUntil = new Date(setting.muteUntil);
  const forever = muteUntil.getUTCFullYear() >= 9999;

  return {
    muted: true,
    muteUntil,
    label: forever ? "Muted forever" : `Muted until ${muteUntil.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}`
  };
};

const getCommunityBootstrapData = async (userId) => {
  const [groups, user, verification] = await Promise.all([
    ensureCommunityGroups(),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        verifiedTeacher: true,
        communityGroupId: true
      }
    }),
    prisma.teacherVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: teacherVerificationInclude
    })
  ]);

  const activeGroupId = user?.communityGroupId ?? null;

  const [topMessages, verifiedTeachers, muteSetting, presence] = activeGroupId
    ? await Promise.all([
        getSafeCommunityMessageIds(activeGroupId, userId, 80, "desc"),
        prisma.user.findMany({
          where: {
            communityGroupId: activeGroupId,
            role: "teacher",
            verifiedTeacher: true
          },
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            course: true,
            verifiedTeacher: true,
            role: true
          },
          orderBy: { name: "asc" }
        }),
        getSafeMuteSetting(userId, activeGroupId),
        getCommunityPresenceSnapshot(activeGroupId)
      ])
    : [[], [], null, { onlineMembers: [], onlineCount: 0 }];

  const formattedMessages = await Promise.all(topMessages.reverse().map((message) => formatCommunityMessage(message.id, userId)));

  return {
    success: true,
    groups,
    activeGroupId,
    verification,
    verifiedTeachers,
    onlineMembers: presence.onlineMembers || [],
    onlineCount: presence.onlineCount || 0,
    muteSetting: buildMutePayload(muteSetting),
    messages: formattedMessages.filter(Boolean)
  };
};

export const getCommunityData = asyncHandler(async (req, res) => {
  res.json(await getCommunityBootstrapData(req.user.id));
});

export const getCommunityGroups = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    groups: await ensureCommunityGroups()
  });
});

export const getCommunityMessages = asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);
  if (!groupId) {
    res.status(400);
    throw new Error("Community group is required");
  }

  await ensureCommunityAccess(req.user.id, groupId);

  const [messages, verifiedTeachers, muteSetting] = await Promise.all([
    getSafeCommunityMessageIds(groupId, req.user.id, 150, "asc"),
    prisma.user.findMany({
      where: {
        communityGroupId: groupId,
        role: "teacher",
        verifiedTeacher: true
      },
      select: {
        id: true,
        name: true,
        profilePhoto: true,
        course: true,
        verifiedTeacher: true,
        role: true
      },
      orderBy: { name: "asc" }
    }),
    getSafeMuteSetting(req.user.id, groupId)
  ]);

  res.json({
    success: true,
    messages: (await Promise.all(messages.map((message) => formatCommunityMessage(message.id, req.user.id)))).filter(Boolean),
    verifiedTeachers,
    muteSetting: buildMutePayload(muteSetting)
  });
});

export const touchCommunityPresence = asyncHandler(async (req, res) => {
  const groupId = Number(req.body.groupId);

  if (!groupId) {
    res.status(400);
    throw new Error("Community group is required");
  }

  await ensureCommunityAccess(req.user.id, groupId);
  registerCommunityHeartbeat(req.user.id, groupId);

  res.json({
    success: true,
    ...(await getCommunityPresenceSnapshot(groupId))
  });
});

export const joinCommunityGroup = asyncHandler(async (req, res) => {
  const groupId = Number(req.body.groupId);
  const role = req.body.role;
  const name = req.body.name?.trim();

  if (!groupId) {
    res.status(400);
    throw new Error("Community group is required");
  }

  const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
  if (!group) {
    res.status(404);
    throw new Error("Community group not found");
  }

  if (role === "teacher") {
    res.status(400);
    throw new Error("Teachers must submit verification and wait for admin approval before entering community chat");
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      communityGroupId: groupId,
      role: req.user.role === "admin" ? "admin" : "student",
      verifiedTeacher: false,
      ...(name ? { name } : {})
    },
    select: {
      id: true,
      communityGroupId: true
    }
  });

  res.json({
    success: true,
    message: "Community joined successfully",
    activeGroupId: user.communityGroupId
  });
});

export const leaveCommunityGroup = asyncHandler(async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { communityGroupId: null }
  });

  res.json({ success: true, message: "You left the community successfully" });
});

export const submitTeacherVerification = asyncHandler(async (req, res) => {
  const { fullName, university, subjectExpertise, communityGroupId } = req.body;
  const groupId = Number(communityGroupId);

  if (!fullName || !university || !subjectExpertise || !groupId || !req.file) {
    res.status(400);
    throw new Error("Full name, university, subject expertise, community, and ID card are required");
  }

  const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
  if (!group) {
    res.status(404);
    throw new Error("Community group not found");
  }

  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      role: req.user.role === "admin" ? "admin" : "student",
      communityGroupId: null,
      verifiedTeacher: false
    }
  });

  const idCardUrl = `${req.protocol}://${req.get("host")}/uploads/teacher-ids/${req.file.filename}`;
  const existing = await prisma.teacherVerification.findFirst({
    where: { userId: req.user.id, status: "pending" }
  });

  const verification = existing
    ? await prisma.teacherVerification.update({
        where: { id: existing.id },
        data: {
          communityGroupId: groupId,
          fullName,
          university,
          subjectExpertise,
          idCardUrl,
          status: "pending",
          adminNote: null
        },
        include: teacherVerificationInclude
      })
    : await prisma.teacherVerification.create({
        data: {
          userId: req.user.id,
          communityGroupId: groupId,
          fullName,
          university,
          subjectExpertise,
          idCardUrl,
          status: "pending"
        },
        include: teacherVerificationInclude
      });

  res.status(201).json({
    success: true,
    message: "Teacher verification submitted. Chat will unlock after admin approval.",
    verification
  });
});

export const sendCommunityMessage = asyncHandler(async (req, res) => {
  const { groupId, text, replyToId, mentions = [] } = req.body;
  const numericGroupId = Number(groupId);

  if (!numericGroupId || !String(text || "").trim()) {
    res.status(400);
    throw new Error("Group and message text are required");
  }

  await ensureCommunityAccess(req.user.id, numericGroupId);

  const replyMessageId = replyToId ? Number(replyToId) : null;
  if (replyMessageId) {
    const replyMessage = await prisma.communityMessage.findUnique({
      where: { id: replyMessageId },
      select: { id: true, groupId: true }
    });
    if (!replyMessage || replyMessage.groupId !== numericGroupId) {
      res.status(400);
      throw new Error("Reply target is invalid");
    }
  }

  const message = await prisma.communityMessage.create({
    data: {
      groupId: numericGroupId,
      userId: req.user.id,
      content: String(text).trim(),
      replyToId: replyMessageId,
      mentions: Array.isArray(mentions) ? mentions : [],
      expiresAt: new Date(Date.now() + DAY_IN_MS)
    }
  });

  const recipientIds = await getCommunityNotificationRecipientIds(numericGroupId, req.user.id);
  if (recipientIds.length) {
    const group = await prisma.communityGroup.findUnique({
      where: { id: numericGroupId },
      select: { name: true }
    });

    await createNotifications({
      userIds: recipientIds,
      type: "community_message",
      title: group?.name || "Community message",
      message: `${req.user.name || "Someone"}: ${String(text).trim().slice(0, 100)}`,
      targetPath: buildCommunityTargetPath()
    });
  }

  await emitCommunityMessage(numericGroupId, message.id);

  res.status(201).json({
    success: true,
    message: await formatCommunityMessage(message.id, req.user.id)
  });
});

export const uploadCommunityMessageFile = asyncHandler(async (req, res) => {
  const groupId = Number(req.body.groupId);
  const text = String(req.body.text || "").trim();
  const replyToId = req.body.replyToId ? Number(req.body.replyToId) : null;

  if (!groupId || !req.file) {
    res.status(400);
    throw new Error("Community group and file are required");
  }

  await ensureCommunityAccess(req.user.id, groupId);

  const expiresAt = new Date(Date.now() + DAY_IN_MS);
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/community-chat/${req.file.filename}`;

  const created = await prisma.communityMessage.create({
    data: {
      groupId,
      userId: req.user.id,
      content: text || `${req.file.originalname} shared`,
      replyToId,
      mentions: [],
      expiresAt,
      files: {
        create: {
          fileUrl,
          fileName: req.file.originalname,
          fileType: getChatFileType(req.file),
          mimeType: req.file.mimetype,
          sizeBytes: formatBytes(req.file.size),
          expiresAt
        }
      }
    }
  });

  const recipientIds = await getCommunityNotificationRecipientIds(groupId, req.user.id);
  if (recipientIds.length) {
    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
      select: { name: true }
    });

    await createNotifications({
      userIds: recipientIds,
      type: "community_message",
      title: group?.name || "Community file",
      message: `${req.user.name || "Someone"} shared ${req.file.originalname}`,
      targetPath: buildCommunityTargetPath()
    });
  }

  await emitCommunityMessage(groupId, created.id);

  res.status(201).json({
    success: true,
    message: await formatCommunityMessage(created.id, req.user.id)
  });
});

export const reactToCommunityMessage = asyncHandler(async (req, res) => {
  const { messageId, reactionType } = req.body;
  const numericMessageId = Number(messageId);

  if (!numericMessageId || !reactionType) {
    res.status(400);
    throw new Error("Message and reaction are required");
  }

  const message = await prisma.communityMessage.findUnique({
    where: { id: numericMessageId },
    select: { id: true, groupId: true }
  });

  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  await ensureCommunityAccess(req.user.id, message.groupId);

  const existing = await prisma.messageReaction.findFirst({
    where: {
      messageId: numericMessageId,
      userId: req.user.id,
      emoji: reactionType
    }
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.messageReaction.create({
      data: {
        messageId: numericMessageId,
        userId: req.user.id,
        emoji: reactionType
      }
    });
  }

  await emitCommunityMessageUpdate(message.groupId, message.id);

  res.json({
    success: true,
    message: await formatCommunityMessage(message.id, req.user.id)
  });
});

export const reportCommunityMessage = asyncHandler(async (req, res) => {
  const { messageId, reportedUserId, reason, groupId } = req.body;
  const normalizedReason = String(reason || "").toLowerCase();
  const allowedReasons = ["spam", "abuse", "inappropriate"];

  if (!allowedReasons.includes(normalizedReason)) {
    res.status(400);
    throw new Error("Invalid report reason");
  }

  const numericGroupId = Number(groupId);
  if (!numericGroupId) {
    res.status(400);
    throw new Error("Community group is required");
  }

  await ensureCommunityAccess(req.user.id, numericGroupId);

  await prisma.chatReport.create({
    data: {
      reporterId: req.user.id,
      reportedUserId: reportedUserId ? Number(reportedUserId) : null,
      messageId: messageId ? Number(messageId) : null,
      groupId: numericGroupId,
      reason: normalizedReason
    }
  });

  res.status(201).json({
    success: true,
    message: "Report submitted successfully"
  });
});

export const clearPersonalCommunityHistory = asyncHandler(async (req, res) => {
  const groupId = Number(req.body.groupId);

  if (!groupId) {
    res.status(400);
    throw new Error("Community group is required");
  }

  await ensureCommunityAccess(req.user.id, groupId);

  const messages = await prisma.communityMessage.findMany({
    where: {
      groupId,
      expiresAt: { gt: new Date() }
    },
    select: { id: true }
  });

  if (messages.length) {
    await prisma.hiddenCommunityMessage.createMany({
      data: messages.map((message) => ({
        userId: req.user.id,
        messageId: message.id
      })),
      skipDuplicates: true
    });
  }

  emitCommunityHistoryCleared(req.user.id, groupId);

  res.json({
    success: true,
    message: "Your community history has been cleared"
  });
});

export const deleteCommunityMessages = asyncHandler(async (req, res) => {
  const groupId = Number(req.body.groupId);
  const messageIds = Array.isArray(req.body.messageIds)
    ? req.body.messageIds.map((id) => Number(id)).filter(Boolean)
    : req.body.messageId
      ? [Number(req.body.messageId)].filter(Boolean)
      : [];

  if (!groupId || !messageIds.length) {
    res.status(400);
    throw new Error("Community group and message ids are required");
  }

  await ensureCommunityAccess(req.user.id, groupId);

  const messages = await prisma.communityMessage.findMany({
    where: {
      id: { in: messageIds },
      groupId
    },
    include: {
      files: true
    }
  });

  if (!messages.length) {
    res.status(404);
    throw new Error("Messages not found");
  }

  const canModerate = req.user.role === "admin";
  const unauthorized = messages.find((message) => !canModerate && message.userId !== req.user.id);

  if (unauthorized) {
    res.status(403);
    throw new Error("You can delete only your own messages");
  }

  const foundIds = new Set(messages.map((message) => message.id));
  const missingIds = messageIds.filter((id) => !foundIds.has(id));

  if (missingIds.length) {
    res.status(404);
    throw new Error("Some selected messages no longer exist");
  }

  for (const message of messages) {
    for (const file of message.files) {
      let relativePath = file.fileUrl?.split("/uploads/")[1] || "";

      if (!relativePath && file.fileUrl) {
        try {
          const parsedUrl = new URL(file.fileUrl);
          relativePath = parsedUrl.pathname.replace(/^\/uploads\//, "");
        } catch {
          relativePath = String(file.fileUrl).replace(/^.*uploads[\\/]/, "");
        }
      }

      if (!relativePath) continue;

      const absolutePath = path.resolve(__dirname, "../../uploads", relativePath);
      if (fs.existsSync(absolutePath)) {
        try {
          fs.unlinkSync(absolutePath);
        } catch {
          // Ignore file cleanup issues so DB delete can continue.
        }
      }
    }
  }

  await prisma.communityMessage.deleteMany({
    where: {
      id: { in: messageIds },
      groupId
    }
  });

  emitCommunityMessagesDeleted(groupId, messageIds);

  res.json({
    success: true,
    message: messageIds.length > 1 ? "Messages deleted for everyone" : "Message deleted for everyone",
    deletedIds: messageIds
  });
});

export const muteCommunityNotifications = asyncHandler(async (req, res) => {
  const groupId = Number(req.body.groupId);
  const option = String(req.body.option || "");

  if (!groupId) {
    res.status(400);
    throw new Error("Community group is required");
  }

  await ensureCommunityAccess(req.user.id, groupId);

  let muteUntil = null;
  if (option === "1h") muteUntil = new Date(Date.now() + 60 * 60 * 1000);
  if (option === "8h") muteUntil = new Date(Date.now() + 8 * 60 * 60 * 1000);
  if (option === "forever") muteUntil = FOREVER_MUTE_UNTIL;

  if (!muteUntil) {
    res.status(400);
    throw new Error("Mute option must be 1h, 8h, or forever");
  }

  const setting = await prisma.userMuteSetting.upsert({
    where: {
      userId_groupId: {
        userId: req.user.id,
        groupId
      }
    },
    update: { muteUntil },
    create: {
      userId: req.user.id,
      groupId,
      muteUntil
    }
  });

  res.json({
    success: true,
    muteSetting: buildMutePayload(setting)
  });
});

export const unmuteCommunityNotifications = asyncHandler(async (req, res) => {
  const groupId = Number(req.body.groupId);

  if (!groupId) {
    res.status(400);
    throw new Error("Community group is required");
  }

  await ensureCommunityAccess(req.user.id, groupId);

  await prisma.userMuteSetting.deleteMany({
    where: {
      userId: req.user.id,
      groupId
    }
  });

  res.json({
    success: true,
    muteSetting: buildMutePayload(null)
  });
});

export const getCommunityFile = asyncHandler(async (req, res) => {
  const fileId = Number(req.params.id);
  if (!fileId) {
    res.status(400);
    throw new Error("File is required");
  }

  const file = await prisma.chatFile.findUnique({
    where: { id: fileId },
    include: {
      message: {
        select: {
          groupId: true
        }
      }
    }
  });

  if (!file) {
    res.status(404);
    throw new Error("File not found");
  }

  await ensureCommunityAccess(req.user.id, file.message.groupId);

  let relativePath = file.fileUrl?.split("/uploads/")[1] || "";

  if (!relativePath && file.fileUrl) {
    try {
      const parsedUrl = new URL(file.fileUrl);
      relativePath = parsedUrl.pathname.replace(/^\/uploads\//, "");
    } catch {
      relativePath = String(file.fileUrl).replace(/^.*uploads[\\/]/, "");
    }
  }

  if (!relativePath) {
    res.status(404);
    throw new Error("Stored file path is invalid");
  }

  const absolutePath = path.resolve(__dirname, "../../uploads", relativePath);

  if (!fs.existsSync(absolutePath)) {
    res.status(404);
    throw new Error("Stored file not found");
  }

  if (req.query.download === "1") {
    res.download(absolutePath, file.fileName);
    return;
  }

  res.sendFile(absolutePath);
});

export const getCommunityReports = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Admin access required");
  }

  const reports = await prisma.chatReport.findMany({
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      reportedUser: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      message: {
        select: {
          id: true,
          content: true,
          createdAt: true
        }
      },
      group: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({
    success: true,
    reports
  });
});
