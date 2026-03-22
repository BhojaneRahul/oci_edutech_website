import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";
import { prisma } from "../config/db.js";
import { withMongoStyleId } from "../utils/serializers.js";
import { buildProjectTargetPath, createNotifications } from "../services/notificationService.js";

const normalizeProject = (project) => ({
  ...withMongoStyleId(project),
  technologies: Array.isArray(project.technologies) ? project.technologies : [],
  images: Array.isArray(project.images) ? project.images : []
});

export const getProjects = asyncHandler(async (req, res) => {
  const filter = req.query.category ? { category: String(req.query.category) } : {};
  const projects = await prisma.project.findMany({
    where: filter,
    orderBy: { createdAt: "desc" }
  });
  res.json(projects.map(normalizeProject));
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: Number(req.params.id) }
  });

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  res.json(normalizeProject(project));
});

const buildAssetUrl = (req, filename) => `${req.protocol}://${req.get("host")}/uploads/projects/${filename}`;

const getExistingArray = (value) => (Array.isArray(value) ? value : []);

export const createProject = asyncHandler(async (req, res) => {
  const { title, description, category, level, technologies } = req.body;

  if (!title || !description || !category || !level) {
    res.status(400);
    throw new Error("Title, description, category, and level are required");
  }

  const imageFiles = req.files?.images ?? [];
  const projectFile = req.files?.projectFile?.[0];
  const reportFile = req.files?.reportFile?.[0];

  const project = await prisma.project.create({
    data: {
      title,
      description,
      category,
      level,
      technologies: technologies
        ? String(technologies)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      images: imageFiles.map((file) => buildAssetUrl(req, file.filename)),
      fileUrl: projectFile ? buildAssetUrl(req, projectFile.filename) : null,
      reportUrl: reportFile ? buildAssetUrl(req, reportFile.filename) : null
    }
  });

  const users = await prisma.user.findMany({
    where: {
      id: {
        not: req.user.id
      }
    },
    select: { id: true }
  });

  if (users.length) {
    await createNotifications({
      userIds: users.map((user) => user.id),
      type: "project",
      title: "New Project Uploaded",
      message: `${title} • ${category}`,
      targetPath: buildProjectTargetPath(project.id)
    });
  }

  res.status(201).json({
    success: true,
    project: normalizeProject(project)
  });
});

export const getAdminProjects = asyncHandler(async (req, res) => {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" }
  });

  res.json(projects.map(normalizeProject));
});

export const deleteProject = asyncHandler(async (req, res) => {
  const projectId = Number(req.params.id);
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  await prisma.project.delete({
    where: { id: projectId }
  });

  const assetUrls = [...getExistingArray(project.images), project.fileUrl, project.reportUrl].filter(Boolean);

  assetUrls.forEach((assetUrl) => {
    try {
      const filename = String(assetUrl).split("/uploads/projects/")[1];
      if (!filename) return;
      const filePath = path.resolve(process.cwd(), "backend", "uploads", "projects", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Ignore file cleanup failures and keep the DB delete successful.
    }
  });

  res.json({ success: true, message: "Project deleted successfully" });
});

const sendProjectAsset = async (req, res, fieldName, missingMessage) => {
  const project = await prisma.project.findUnique({
    where: { id: Number(req.params.id) }
  });

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const assetUrl = project[fieldName];
  if (!assetUrl) {
    res.status(404);
    throw new Error(missingMessage);
  }

  const filename = String(assetUrl).split("/uploads/projects/")[1];
  const filePath = path.resolve(process.cwd(), "backend", "uploads", "projects", filename);

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File is no longer available");
  }

  res.download(filePath, path.basename(filePath));
};

export const downloadProjectFile = asyncHandler(async (req, res) => {
  await sendProjectAsset(req, res, "fileUrl", "Project file not found");
});

export const downloadProjectReport = asyncHandler(async (req, res) => {
  await sendProjectAsset(req, res, "reportUrl", "Project report not found");
});
