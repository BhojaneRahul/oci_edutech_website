import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";
import { clearAuthCookie, setAuthCookie } from "../utils/authCookies.js";
import { awardBookmarkXp, awardDailyLogin } from "../services/gamificationService.js";

const safelyRunGamification = async (task) => {
  try {
    await task();
  } catch (error) {
    console.error("Gamification side-effect failed:", error);
  }
};

const buildAuthResponse = (user) => ({
  success: true,
  message: "Authentication successful",
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    profilePhoto: user.profilePhoto,
    university: user.university,
    phone: user.phone,
    course: user.course,
    semester: user.semester,
    role: user.role,
    verifiedTeacher: user.verifiedTeacher,
    communityGroupId: user.communityGroupId,
    createdAt: user.createdAt
  }
});

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, university, phone, course, semester, role, communityGroupId } = req.body;

  if (!name || !email || !password || !university) {
    res.status(400);
    throw new Error("Name, email, password, and university or PUC board are required");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(400);
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      university,
      phone: phone || null,
      course: course || null,
      semester: semester || null,
      role: role === "teacher" ? "teacher" : "student",
      communityGroupId: communityGroupId ? Number(communityGroupId) : null
    }
  });
  const token = generateToken({ id: user.id, role: user.role });
  setAuthCookie(res, token);
  await safelyRunGamification(() => awardDailyLogin(user.id));
  res.status(201).json(buildAuthResponse(user));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user?.password || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = generateToken({ id: user.id, role: user.role });
  setAuthCookie(res, token);
  await safelyRunGamification(() => awardDailyLogin(user.id));
  res.json(buildAuthResponse(user));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  await safelyRunGamification(() => awardDailyLogin(req.user.id));
  res.json({ success: true, user: req.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, role, university, phone, course, semester } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Name is required");
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      name,
      role: req.user.role === "admin" ? req.user.role : role === "teacher" ? "teacher" : "student",
      university: university || null,
      phone: phone || null,
      course: course || null,
      semester: semester || null
    }
  });

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: buildAuthResponse(user).user
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current password and new password are required");
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!user?.password || !(await bcrypt.compare(currentPassword, user.password))) {
    res.status(400);
    throw new Error("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword }
  });

  res.json({
    success: true,
    message: "Password updated successfully"
  });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Avatar file is required");
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      profilePhoto: `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`
    }
  });

  res.json({
    success: true,
    message: "Avatar uploaded successfully",
    user: buildAuthResponse(user).user
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.json({
      success: true,
      message: "If an account exists, a reset link has been generated."
    });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiry: expiry
    }
  });

  res.json({
    success: true,
    message: "Password reset link generated successfully.",
    resetUrl:
      process.env.NODE_ENV === "production"
        ? undefined
        : `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400);
    throw new Error("Token and new password are required");
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    res.status(400);
    throw new Error("Reset link is invalid or expired");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(password, 10),
      resetToken: null,
      resetTokenExpiry: null
    }
  });

  res.json({
    success: true,
    message: "Password reset successfully"
  });
});

export const googleCallback = asyncHandler(async (req, res) => {
  const token = generateToken({ id: req.user.id, role: req.user.role });
  setAuthCookie(res, token);
  await safelyRunGamification(() => awardDailyLogin(req.user.id));
  res.redirect(req.user.role === "admin" ? `${process.env.CLIENT_URL}/admin` : `${process.env.CLIENT_URL}/account`);
});

export const getSavedDocuments = asyncHandler(async (req, res) => {
  const savedDocuments = await prisma.savedDocument.findMany({
    where: { userId: req.user.id },
    include: {
      document: true
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(
    savedDocuments.map((entry) => ({
      id: entry.id,
      savedAt: entry.createdAt,
      document: {
        _id: entry.document.id,
        title: entry.document.title,
        subject: entry.document.subject,
        stream: entry.document.stream,
        type: entry.document.type,
        fileUrl: entry.document.fileUrl,
        createdAt: entry.document.createdAt,
        canDownload: entry.document.type === "model_qp",
        viewCount: entry.document.viewCount ?? 0,
        downloadCount: entry.document.downloadCount ?? 0
      }
    }))
  );
});

export const getSavedDocumentStatus = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.documentId);

  const saved = await prisma.savedDocument.findUnique({
    where: {
      userId_documentId: {
        userId: req.user.id,
        documentId
      }
    }
  });

  res.json({
    success: true,
    saved: Boolean(saved)
  });
});

export const getLikedDocumentStatus = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.documentId);

  const [liked, likeCount] = await Promise.all([
    prisma.likedDocument.findUnique({
      where: {
        userId_documentId: {
          userId: req.user.id,
          documentId
        }
      }
    }),
    prisma.likedDocument.count({
      where: { documentId }
    })
  ]);

  res.json({
    success: true,
    liked: Boolean(liked),
    count: likeCount
  });
});

export const saveDocument = asyncHandler(async (req, res) => {
  const documentId = Number(req.body.documentId);

  if (!documentId) {
    res.status(400);
    throw new Error("Document id is required");
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId }
  });

  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  await prisma.savedDocument.upsert({
    where: {
      userId_documentId: {
        userId: req.user.id,
        documentId
      }
    },
    update: {},
    create: {
      userId: req.user.id,
      documentId
    }
  });

  await safelyRunGamification(() => awardBookmarkXp(req.user.id, documentId));

  res.json({
    success: true,
    message: "Document saved successfully"
  });
});

export const removeSavedDocument = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.documentId);

  await prisma.savedDocument.deleteMany({
    where: {
      userId: req.user.id,
      documentId
    }
  });

  res.json({
    success: true,
    message: "Saved document removed successfully"
  });
});

export const likeDocument = asyncHandler(async (req, res) => {
  const documentId = Number(req.body.documentId);

  if (!documentId) {
    res.status(400);
    throw new Error("Document id is required");
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId }
  });

  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  await prisma.likedDocument.upsert({
    where: {
      userId_documentId: {
        userId: req.user.id,
        documentId
      }
    },
    update: {},
    create: {
      userId: req.user.id,
      documentId
    }
  });

  const likeCount = await prisma.likedDocument.count({
    where: { documentId }
  });

  res.json({
    success: true,
    message: "Document liked successfully",
    count: likeCount
  });
});

export const removeLikedDocument = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.documentId);

  await prisma.likedDocument.deleteMany({
    where: {
      userId: req.user.id,
      documentId
    }
  });

  const likeCount = await prisma.likedDocument.count({
    where: { documentId }
  });

  res.json({
    success: true,
    message: "Liked document removed successfully",
    count: likeCount
  });
});

export const logoutUser = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

