import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import { NOTE_TYPES } from "../config/constants.js";
import { withMongoStyleId, withMongoStyleIds } from "../utils/serializers.js";
import { normalizeDocument } from "./documentController.js";

export const getDegrees = asyncHandler(async (req, res) => {
  const degrees = await prisma.degree.findMany({ orderBy: { name: "asc" } });
  res.json(withMongoStyleIds(degrees));
});

export const createDegree = asyncHandler(async (req, res) => {
  const degree = await prisma.degree.create({
    data: {
      name: req.body.name,
      description: req.body.description ?? "",
      icon: req.body.icon ?? "GraduationCap"
    }
  });
  res.status(201).json(withMongoStyleId(degree));
});

export const getDegreeDetail = asyncHandler(async (req, res) => {
  const degreeId = Number(req.params.id);
  const degree = await prisma.degree.findUnique({ where: { id: degreeId } });
  if (!degree) {
    res.status(404);
    throw new Error("Degree not found");
  }

  const subjects = await prisma.subject.findMany({
    where: { degreeId: degree.id },
    orderBy: [{ semester: "asc" }, { name: "asc" }]
  });
  const notes = await prisma.document.findMany({
    where: { stream: degree.name },
    orderBy: { createdAt: "desc" }
  });

  const normalizedNotes = notes.map(normalizeDocument);

  res.json({
    degree: withMongoStyleId(degree),
    subjects: withMongoStyleIds(subjects),
    notes: {
      notes: normalizedNotes.filter((item) => item.type === NOTE_TYPES.NOTES),
      modelQps: normalizedNotes.filter((item) => item.type === NOTE_TYPES.MODEL_QP)
    }
  });
});
