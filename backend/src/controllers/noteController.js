import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import { withMongoStyleId, withMongoStyleIds } from "../utils/serializers.js";

export const getNotes = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.subjectId) {
    const subjectIds = String(req.query.subjectId)
      .split(",")
      .filter(Boolean)
      .map((id) => Number(id));
    filter.subjectId = subjectIds.length > 1 ? { $in: subjectIds } : subjectIds[0];
  }

  if (req.query.type) filter.type = req.query.type;

  if (filter.subjectId?.$in) {
    filter.subjectId = { in: filter.subjectId.$in };
  }

  const notes = await prisma.note.findMany({
    where: filter,
    include: { subject: true },
    orderBy: { createdAt: "desc" }
  });

  const normalizedNotes = notes.map((note) => ({
    ...withMongoStyleId(note),
    subjectId: withMongoStyleId(note.subject)
  }));
  res.json(normalizedNotes);
});

export const createNote = asyncHandler(async (req, res) => {
  const subject = await prisma.subject.findUnique({
    where: { id: Number(req.body.subjectId) }
  });

  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }

  const note = await prisma.note.create({
    data: {
      subjectId: Number(req.body.subjectId),
      title: req.body.title,
      pdfUrl: req.body.pdfUrl,
      type: req.body.type
    }
  });
  res.status(201).json(withMongoStyleId(note));
});
