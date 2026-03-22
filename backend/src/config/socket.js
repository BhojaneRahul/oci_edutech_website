import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { prisma } from "./db.js";

const socketSessions = new Map();
let ioInstance = null;
const userRoomName = (userId) => `user:${Number(userId)}`;

const parseCookieValue = (cookieHeader, key) => {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
};

const allowedSocketOrigin = (origin) => !origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === process.env.CLIENT_URL;

const buildPresencePayload = async (groupId) => {
  const userIds = [...socketSessions.values()]
    .filter((session) => session.groupId === groupId)
    .map((session) => session.userId);

  const uniqueIds = [...new Set(userIds)];

  if (!uniqueIds.length) {
    return { onlineMembers: [], onlineCount: 0 };
  }

  const users = await prisma.user.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      name: true,
      profilePhoto: true,
      role: true,
      verifiedTeacher: true
    },
    orderBy: { name: "asc" }
  });

  return {
    onlineMembers: users,
    onlineCount: users.length
  };
};

const groupRoomName = (groupId) => `community:${groupId}`;

export const getActiveCommunityUserIds = (groupId) => {
  const numericGroupId = Number(groupId);
  if (!numericGroupId) return [];

  return [...new Set(
    [...socketSessions.values()]
      .filter((session) => session.groupId === numericGroupId)
      .map((session) => session.userId)
  )];
};

const isMissingTableError = (error, tableName) =>
  error?.code === "P2021" &&
  (!tableName || String(error?.meta?.table || "").toLowerCase() === tableName.toLowerCase());

export const formatCommunityMessage = async (messageId, viewerId = null) => {
  const baseInclude = {
    user: {
      select: {
        id: true,
        name: true,
        profilePhoto: true,
        role: true,
        verifiedTeacher: true
      }
    },
    replyTo: {
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    },
    files: true,
    reactions: {
      select: {
        emoji: true,
        userId: true
      }
    }
  };

  let message;

  try {
    message = await prisma.communityMessage.findUnique({
      where: { id: messageId },
      include: {
        ...baseInclude,
        hiddenForUsers: viewerId
          ? {
              where: { userId: Number(viewerId) },
              select: { id: true }
            }
          : false
      }
    });
  } catch (error) {
    if (!isMissingTableError(error, "hidden_community_messages")) {
      throw error;
    }

    message = await prisma.communityMessage.findUnique({
      where: { id: messageId },
      include: baseInclude
    });
  }

  if (!message) return null;
  if (viewerId && message.hiddenForUsers?.length) return null;

  const reactionMap = message.reactions.reduce((accumulator, reaction) => {
    const current = accumulator.get(reaction.emoji) ?? { emoji: reaction.emoji, count: 0, userIds: [] };
    current.count += 1;
    current.userIds.push(reaction.userId);
    accumulator.set(reaction.emoji, current);
    return accumulator;
  }, new Map());

  return {
    id: message.id,
    groupId: message.groupId,
    content: message.content,
    mentions: Array.isArray(message.mentions) ? message.mentions : [],
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    expiresAt: message.expiresAt,
    user: message.user,
    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          content: message.replyTo.content,
          user: message.replyTo.user
        }
      : null,
    files: message.files.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      fileType: file.fileType,
      mimeType: file.mimeType,
      fileUrl: file.fileUrl,
      sizeBytes: file.sizeBytes,
      expiresAt: file.expiresAt
    })),
    reactions: [...reactionMap.values()]
  };
};

export const getSocketServer = () => ioInstance;

export const emitCommunityMessage = async (groupId, messageId) => {
  if (!ioInstance) return;
  const payload = await formatCommunityMessage(messageId);
  if (payload) {
    ioInstance.to(groupRoomName(groupId)).emit("community:message", payload);
  }
};

export const emitCommunityMessageUpdate = async (groupId, messageId) => {
  if (!ioInstance) return;
  const payload = await formatCommunityMessage(messageId);
  if (payload) {
    ioInstance.to(groupRoomName(groupId)).emit("community:message:update", payload);
  }
};

export const emitCommunityMessagesDeleted = (groupId, messageIds) => {
  if (!ioInstance) return;
  const normalizedIds = (Array.isArray(messageIds) ? messageIds : [messageIds])
    .map((id) => Number(id))
    .filter(Boolean);

  if (!normalizedIds.length) return;

  ioInstance.to(groupRoomName(groupId)).emit("community:message:delete", {
    groupId: Number(groupId),
    messageIds: normalizedIds
  });
};

export const emitCommunityPresence = async (groupId) => {
  if (!ioInstance) return;
  ioInstance.to(groupRoomName(groupId)).emit("community:presence", await buildPresencePayload(groupId));
};

export const emitCommunityHistoryCleared = (userId, groupId) => {
  if (!ioInstance) return;
  for (const [socketId, session] of socketSessions.entries()) {
    if (session.userId === Number(userId) && session.groupId === Number(groupId)) {
      ioInstance.to(socketId).emit("community:history:cleared", { groupId: Number(groupId) });
    }
  }
};

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (allowedSocketOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by Socket.IO CORS"));
      },
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        parseCookieValue(socket.handshake.headers.cookie, "token");

      if (!token) {
        return next(new Error("Not authorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: Number(decoded.id) },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          verifiedTeacher: true,
          communityGroupId: true,
          profilePhoto: true
        }
      });

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoomName(socket.data.user.id));

    socket.on("community:join", async ({ groupId }) => {
      const numericGroupId = Number(groupId);
      if (!numericGroupId) return;

      socket.join(groupRoomName(numericGroupId));
      socketSessions.set(socket.id, { userId: socket.data.user.id, groupId: numericGroupId });
      await emitCommunityPresence(numericGroupId);
    });

    socket.on("community:typing", ({ groupId, typing }) => {
      const numericGroupId = Number(groupId);
      if (!numericGroupId) return;
      socket.to(groupRoomName(numericGroupId)).emit("community:typing", {
        userId: socket.data.user.id,
        userName: socket.data.user.name,
        typing: Boolean(typing)
      });
    });

    socket.on("disconnect", async () => {
      const session = socketSessions.get(socket.id);
      if (!session) return;
      socketSessions.delete(socket.id);
      await emitCommunityPresence(session.groupId);
    });
  });

  ioInstance = io;
  return io;
};
