import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import { withMongoStyleId } from "../utils/serializers.js";

export const globalSearch = asyncHandler(async (req, res) => {
  const query = String(req.query.q || "").trim();

  if (!query) {
    res.json({
      success: true,
      degrees: [],
      subjects: [],
      documents: []
    });
    return;
  }

  const [degrees, subjects, documents] = await Promise.all([
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
    })
  ]);

  res.json({
    success: true,
    degrees: degrees.map(withMongoStyleId),
    subjects: subjects.map(withMongoStyleId),
    documents: documents.map((document) => ({
      ...withMongoStyleId(document),
      canDownload: document.type === "model_qp"
    }))
  });
});
