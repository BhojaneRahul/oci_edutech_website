import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import { withMongoStyleId } from "../utils/serializers.js";
import { normalizeDocument } from "./documentController.js";

export const globalSearch = asyncHandler(async (req, res) => {
  const query = String(req.query.q || "").trim();
  const projectWhere = {
    OR: [
      { title: { contains: query } },
      { description: { contains: query } }
    ]
  };

  if (!query) {
    res.json({
      success: true,
      degrees: [],
      subjects: [],
      documents: [],
      mockTests: [],
      projects: []
    });
    return;
  }

  const [degrees, subjects, documents, mockTests, projects] = await Promise.all([
    prisma.degree.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } }
        ]
      },
      take: 6
    }),
    prisma.subject.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { group: { contains: query } },
          { semester: { contains: query } }
        ]
      },
      take: 8
    }),
    prisma.document.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { subject: { contains: query } },
          { stream: { contains: query } }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.mockTest.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { subject: { contains: query } },
          { stream: { contains: query } }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.project.findMany({
      where: projectWhere,
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  res.json({
    success: true,
    degrees: degrees.map(withMongoStyleId),
    subjects: subjects.map(withMongoStyleId),
    documents: documents.map(normalizeDocument),
    mockTests: mockTests.map(withMongoStyleId),
    projects: projects.map(withMongoStyleId)
  });
});
