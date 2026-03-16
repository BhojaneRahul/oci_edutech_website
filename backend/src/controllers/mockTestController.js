import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import { withMongoStyleId } from "../utils/serializers.js";

export const getMockTests = asyncHandler(async (req, res) => {
  const filter = req.query.degreeId ? { degreeId: Number(req.query.degreeId) } : {};
  const mockTests = await prisma.mockTest.findMany({
    where: filter,
    orderBy: { createdAt: "desc" }
  });
  res.json(mockTests.map(withMongoStyleId));
});

export const createMockTest = asyncHandler(async (req, res) => {
  const mockTest = await prisma.mockTest.create({
    data: {
      title: req.body.title,
      degreeId: Number(req.body.degreeId),
      questions: req.body.questions
    }
  });
  res.status(201).json(withMongoStyleId(mockTest));
});
