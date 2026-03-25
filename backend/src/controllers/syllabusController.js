import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import { withMongoStyleId } from "../utils/serializers.js";
import { removeGeneratedAsset } from "../services/syllabusGeneratorService.js";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const selectMatchedDocuments = {
  id: true,
  title: true,
  subject: true,
  stream: true,
  type: true,
  fileUrl: true,
  createdAt: true
};

const normalizeGeneration = (generation) => ({
  ...withMongoStyleId(generation),
  outputType: generation.outputType,
  sourceFileUrl: generation.sourceFileUrl,
  sourceFileName: generation.sourceFileName,
  generatedPdfUrl: generation.generatedPdfUrl,
  structuredContent: generation.structuredContent
});

const buildRecentDocumentFilters = ({ subject, course, semester }) => {
  const filters = [];

  if (subject) {
    filters.push({ subject: { contains: subject } });
    filters.push({ title: { contains: subject } });
  }

  if (course) {
    filters.push({ stream: { contains: course } });
    filters.push({ title: { contains: course } });
  }

  if (semester) {
    filters.push({ title: { contains: semester } });
    filters.push({ subject: { contains: semester } });
  }

  return filters;
};

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
  const expiresAt = new Date(Date.now() + ONE_DAY_IN_MS);
  const filters = buildRecentDocumentFilters({ subject, course, semester });
  const matchedDocuments = await prisma.document.findMany({
    where: filters.length ? { OR: filters } : undefined,
    orderBy: { createdAt: "desc" },
    take: 8,
    select: selectMatchedDocuments
  });

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
          "Your syllabus was received. Our team can review it and prepare recent notes or study materials based on the uploaded syllabus.",
        manualTopics,
        matchedDocuments
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
    message: "Syllabus uploaded successfully. Recent matching notes are ready below and the request is now visible in the admin panel.",
    generation: normalizeGeneration(generation)
  });
});

export const getMySyllabusGenerations = asyncHandler(async (req, res) => {
  const generations = await prisma.syllabusGeneration.findMany({
    where: {
      userId: req.user.id,
      expiresAt: {
        gt: new Date()
      }
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
