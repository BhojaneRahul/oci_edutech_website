import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import { withMongoStyleId } from "../utils/serializers.js";

export const getProjects = asyncHandler(async (req, res) => {
  const filter = req.query.degree ? { degree: req.query.degree } : {};
  const projects = await prisma.project.findMany({
    where: filter,
    orderBy: { createdAt: "desc" }
  });
  res.json(projects.map(withMongoStyleId));
});

export const createProject = asyncHandler(async (req, res) => {
  const project = await prisma.project.create({
    data: {
      title: req.body.title,
      description: req.body.description,
      degree: req.body.degree,
      downloadLink: req.body.downloadLink ?? ""
    }
  });
  res.status(201).json(withMongoStyleId(project));
});
