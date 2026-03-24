import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";

const SITE_STATS_KEY = "site_stats";

export const getAdminOverview = asyncHandler(async (req, res) => {
  const [users, degrees, subjects, notes, mockTests, projects, documents, teacherVerifications, downloadSetting, siteStatsSetting] = await Promise.all([
    prisma.user.count(),
    prisma.degree.count(),
    prisma.subject.count(),
    prisma.note.count(),
    prisma.mockTest.count(),
    prisma.project.count(),
    prisma.document.count(),
    prisma.teacherVerification.count({ where: { status: "pending" } }),
    prisma.setting.findUnique({ where: { key: "downloadsEnabled" } }),
    prisma.setting.findUnique({ where: { key: SITE_STATS_KEY } })
  ]);

  const rawSiteStats =
    typeof siteStatsSetting?.value === "object" && siteStatsSetting.value ? siteStatsSetting.value : {};

  res.json({
    stats: { users, degrees, subjects, notes, mockTests, projects, documents, teacherVerifications },
    settings: {
      downloadsEnabled: downloadSetting?.value ?? false,
      siteStats: {
        appInstalls: String(rawSiteStats.appInstalls || "0"),
        youtubeMembers: String(rawSiteStats.youtubeMembers || "0")
      }
    }
  });
});

export const updateSiteStatsSettings = asyncHandler(async (req, res) => {
  const { appInstalls, youtubeMembers } = req.body;
  const nextInstalls = String(appInstalls || "").trim() || "0";
  const nextYoutubeMembers = String(youtubeMembers || "").trim() || "0";

  const existing = await prisma.setting.findUnique({
    where: { key: SITE_STATS_KEY }
  });

  const rawValue = typeof existing?.value === "object" && existing.value ? existing.value : {};

  const updated = await prisma.setting.upsert({
    where: { key: SITE_STATS_KEY },
    update: {
      value: {
        ...rawValue,
        appInstalls: nextInstalls,
        youtubeMembers: nextYoutubeMembers
      }
    },
    create: {
      key: SITE_STATS_KEY,
      value: {
        visits: 0,
        youtubeMembers: nextYoutubeMembers,
        appInstalls: nextInstalls
      }
    }
  });

  const value = typeof updated.value === "object" && updated.value ? updated.value : {};

  res.json({
    success: true,
    message: "Platform counters updated successfully",
    siteStats: {
      appInstalls: String(value.appInstalls || "0"),
      youtubeMembers: String(value.youtubeMembers || "0")
    }
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      university: true,
      phone: true,
      course: true,
      semester: true,
      role: true,
      verifiedTeacher: true,
      communityGroup: {
        select: {
          id: true,
          name: true
        }
      },
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });
  res.json(users);
});

export const updateUser = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  const { name, email, university, phone, course, semester, role, password, verifiedTeacher, communityGroupId } = req.body;

  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      NOT: { id: userId }
    }
  });

  if (existingUser) {
    res.status(400);
    throw new Error("Email is already in use");
  }

  const data = {
    name,
    email,
    university,
    phone: phone || null,
    course: course || null,
    semester: semester || null,
    role,
    verifiedTeacher: Boolean(verifiedTeacher),
    communityGroupId: communityGroupId ? Number(communityGroupId) : null
  };

  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data
  });

  res.json({
    success: true,
    message: "User updated successfully",
    user
  });
});

export const getTeacherVerifications = asyncHandler(async (req, res) => {
  const verifications = await prisma.teacherVerification.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true
        }
      },
      communityGroup: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(verifications);
});

export const reviewTeacherVerification = asyncHandler(async (req, res) => {
  const verificationId = Number(req.params.id);
  const { status, adminNote } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    res.status(400);
    throw new Error("Status must be approved or rejected");
  }

  const verification = await prisma.teacherVerification.update({
    where: { id: verificationId },
    data: {
      status,
      adminNote: adminNote || null
    }
  });

  await prisma.user.update({
    where: { id: verification.userId },
    data: {
      role: status === "approved" ? "teacher" : "student",
      verifiedTeacher: status === "approved",
      communityGroupId: status === "approved" ? verification.communityGroupId : null
    }
  });

  await prisma.notification.create({
    data: {
      userId: verification.userId,
      title: `Teacher verification ${status}`,
      message:
        status === "approved"
          ? "Your teacher verification has been approved. You can now join community chat with a verified badge."
          : "Your teacher verification was rejected. Please review the admin note and submit again.",
      documentId: null
    }
  });

  res.json({
    success: true,
    message: `Teacher verification ${status} successfully`
  });
});

export const deleteTeacherVerification = asyncHandler(async (req, res) => {
  const verificationId = Number(req.params.id);

  const verification = await prisma.teacherVerification.findUnique({
    where: { id: verificationId }
  });

  if (!verification) {
    res.status(404);
    throw new Error("Teacher verification request not found");
  }

  await prisma.teacherVerification.delete({
    where: { id: verificationId }
  });

  if (verification.userId) {
    await prisma.user.update({
      where: { id: verification.userId },
      data: {
        role: "student",
        verifiedTeacher: false,
        communityGroupId: null
      }
    });
  }

  res.json({
    success: true,
    message: "Teacher verification request deleted successfully"
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);

  if (req.user.id === userId) {
    res.status(400);
    throw new Error("You cannot delete your own admin account");
  }

  await prisma.user.delete({
    where: { id: userId }
  });

  res.json({
    success: true,
    message: "User deleted successfully"
  });
});
