import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";

export const getAdminOverview = asyncHandler(async (req, res) => {
  const [users, degrees, subjects, notes, mockTests, projects, documents, downloadSetting] = await Promise.all([
    prisma.user.count(),
    prisma.degree.count(),
    prisma.subject.count(),
    prisma.note.count(),
    prisma.mockTest.count(),
    prisma.project.count(),
    prisma.document.count(),
    prisma.setting.findUnique({ where: { key: "downloadsEnabled" } })
  ]);

  res.json({
    stats: { users, degrees, subjects, notes, mockTests, projects, documents },
    settings: { downloadsEnabled: downloadSetting?.value ?? false }
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
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });
  res.json(users);
});

export const updateUser = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  const { name, email, university, phone, course, semester, role, password } = req.body;

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
    role
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
