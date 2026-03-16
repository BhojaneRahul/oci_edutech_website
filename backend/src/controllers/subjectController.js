import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import { withMongoStyleId, withMongoStyleIds } from "../utils/serializers.js";

export const getSubjects = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.degreeId) filter.degreeId = Number(req.query.degreeId);
  if (req.query.category) filter.category = req.query.category;
  if (req.query.group) filter.group = req.query.group;

  const subjects = await prisma.subject.findMany({
    where: filter,
    orderBy: [{ semester: "asc" }, { name: "asc" }]
  });
  res.json(withMongoStyleIds(subjects));
});

export const createSubject = asyncHandler(async (req, res) => {
  const subject = await prisma.subject.create({
    data: {
      degreeId: req.body.degreeId ? Number(req.body.degreeId) : null,
      category: req.body.category ?? "degree",
      group: req.body.group ?? "",
      name: req.body.name,
      semester: req.body.semester ?? ""
    }
  });
  res.status(201).json(withMongoStyleId(subject));
});
