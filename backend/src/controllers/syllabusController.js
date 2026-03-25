import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import { withMongoStyleId } from "../utils/serializers.js";
import { removeGeneratedAsset } from "../services/syllabusGeneratorService.js";

const TEN_YEARS_IN_MS = 10 * 365 * 24 * 60 * 60 * 1000;

const normalizeGeneration = (generation) => ({
  ...withMongoStyleId(generation),
  outputType: generation.outputType,
  sourceFileUrl: generation.sourceFileUrl,
  sourceFileName: generation.sourceFileName,
  generatedPdfUrl: generation.generatedPdfUrl,
  structuredContent: generation.structuredContent
});

export const generateSyllabusNotes = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Syllabus PDF or image is required.");
  }

  const subject = String(req.body.subject || "").trim();
  const course = String(req.body.course || "").trim();
  const semester = String(req.body.semester || "").trim();
  const topicsInput = String(req.body.topics || "").trim();
  const manualTopics = topicsInput
    .split(/\r?\n/)
    .map((topic) => topic.trim())
    .filter(Boolean);

  const sourceFileUrl = `${req.protocol}://${req.get("host")}/uploads/syllabus-source/${req.file.filename}`;
  const expiresAt = new Date(Date.now() + TEN_YEARS_IN_MS);

  const generation = await prisma.syllabusGeneration.create({
    data: {
      userId: req.user.id,
      title: subject ? `${subject} syllabus request` : `${course || "New"} syllabus request`,
      subject: subject || "Syllabus request",
      course: course || null,
      semester: semester || null,
      outputType: "smart_notes",
      sourceFileUrl,
      sourceFileName: req.file.originalname,
      generatedPdfUrl: sourceFileUrl,
      extractedText: "",
      structuredContent: {
        requestStatus: "pending",
        requestMessage:
          "Your syllabus was received and sent to the admin panel for review. Our team, verified teachers, or students can now prepare notes from it.",
        manualTopics
      },
      expiresAt
    }
  });

  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true }
  });

  if (admins.length) {
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: "New syllabus request",
        message: `${req.user.name || req.user.email} uploaded a syllabus for ${subject || course || "a new subject"}.`,
        type: "syllabus_request",
        targetPath: "/admin#syllabus-requests"
      }))
    });
  }

  res.status(201).json({
    success: true,
    message: "Syllabus uploaded successfully. Your request is now visible in the admin panel.",
    generation: normalizeGeneration(generation)
  });
});

export const getMySyllabusGenerations = asyncHandler(async (req, res) => {
  const generations = await prisma.syllabusGeneration.findMany({
    where: {
      userId: req.user.id
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  res.json({
    success: true,
    generations: generations.map(normalizeGeneration)
  });
});

export const getAdminSyllabusRequests = asyncHandler(async (req, res) => {
  const generations = await prisma.syllabusGeneration.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          university: true,
          course: true,
          semester: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  res.json({
    success: true,
    requests: generations.map((generation) => ({
      ...normalizeGeneration(generation),
      user: generation.user
    }))
  });
});

export const getSyllabusGenerationById = asyncHandler(async (req, res) => {
  const generationId = Number(req.params.id);
  const generation = await prisma.syllabusGeneration.findUnique({
    where: {
      id: generationId
    }
  });

  if (!generation || (generation.userId !== req.user.id && req.user.role !== "admin")) {
    res.status(404);
    throw new Error("Generated syllabus notes not found");
  }

  res.json({
    success: true,
    generation: normalizeGeneration(generation)
  });
});

export const deleteSyllabusGeneration = asyncHandler(async (req, res) => {
  const generationId = Number(req.params.id);
  const generation = await prisma.syllabusGeneration.findUnique({
    where: {
      id: generationId
    }
  });

  if (!generation || (generation.userId !== req.user.id && req.user.role !== "admin")) {
    res.status(404);
    throw new Error("Generated syllabus notes not found");
  }

  await prisma.syllabusGeneration.delete({
    where: {
      id: generationId
    }
  });

  await Promise.all([
    removeGeneratedAsset(generation.sourceFileUrl),
    removeGeneratedAsset(generation.generatedPdfUrl)
  ]);

  res.json({
    success: true,
    message: "Generated syllabus notes deleted successfully."
  });
});
