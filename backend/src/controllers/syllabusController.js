import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import { withMongoStyleId } from "../utils/serializers.js";
import {
  buildStructuredNotes,
  extractTextFromSyllabusPdf,
  generateStructuredPdf,
  removeGeneratedAsset
} from "../services/syllabusGeneratorService.js";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

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
    throw new Error("Syllabus PDF is required");
  }

  const subject = String(req.body.subject || "").trim();
  const course = String(req.body.course || "").trim();
  const semester = String(req.body.semester || "").trim();
  const outputType = String(req.body.outputType || "smart_notes").trim();
  const topicsInput = String(req.body.topics || "").trim();
  const manualTopics = topicsInput
    .split(/\r?\n/)
    .map((topic) => topic.trim())
    .filter(Boolean);

  const allowedTypes = new Set(["smart_notes", "unit_summary", "question_bank", "study_plan"]);
  if (!allowedTypes.has(outputType)) {
    res.status(400);
    throw new Error("Invalid output type");
  }

  const sourceFileUrl = `${req.protocol}://${req.get("host")}/uploads/syllabus-source/${req.file.filename}`;
  const expiresAt = new Date(Date.now() + ONE_DAY_IN_MS);
  let generatedPdfUrl = null;

  try {
    const extractedText = await extractTextFromSyllabusPdf(req.file.path);

    if (!extractedText.trim()) {
      res.status(400);
      throw new Error("We could not extract readable text from this syllabus PDF.");
    }

    const structuredNotes = await buildStructuredNotes({
      extractedText,
      subject,
      course,
      semester,
      outputType,
      manualTopics,
      sourceFileName: req.file.originalname
    });

    const generatedPdf = await generateStructuredPdf({
      title: structuredNotes.title,
      subject,
      course,
      semester,
      outputType,
      sourceFileName: req.file.originalname,
      structuredNotes
    });

    generatedPdfUrl = `${req.protocol}://${req.get("host")}/uploads/syllabus-generated/${generatedPdf.filename}`;

    const generation = await prisma.syllabusGeneration.create({
      data: {
        userId: req.user.id,
        title: structuredNotes.title,
        subject: subject || structuredNotes.title,
        course: course || null,
        semester: semester || null,
        outputType,
        sourceFileUrl,
        sourceFileName: req.file.originalname,
        generatedPdfUrl,
        extractedText,
        structuredContent: structuredNotes,
        expiresAt
      }
    });

    res.status(201).json({
      success: true,
      message: "Smart notes generated successfully.",
      generation: normalizeGeneration(generation)
    });
  } catch (error) {
    await Promise.all([
      removeGeneratedAsset(sourceFileUrl).catch(() => undefined),
      generatedPdfUrl ? removeGeneratedAsset(generatedPdfUrl).catch(() => undefined) : Promise.resolve()
    ]);
    throw error;
  }
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
