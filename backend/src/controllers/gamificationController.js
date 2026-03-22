import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import {
  awardDocumentOpen,
  awardMockTestXp,
  getDashboardData,
  getFullLeaderboardData,
  updateStudyProgress
} from "../services/gamificationService.js";

export const getGamificationDashboard = asyncHandler(async (req, res) => {
  const dashboard = await getDashboardData(req.user.id);

  res.json({
    success: true,
    ...dashboard
  });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await getFullLeaderboardData(req.user.id);

  res.json({
    success: true,
    ...leaderboard
  });
});

export const trackDocumentOpen = asyncHandler(async (req, res) => {
  const documentId = Number(req.body.documentId);

  if (!documentId) {
    res.status(400);
    throw new Error("Document id is required");
  }

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  await awardDocumentOpen(req.user.id, documentId);

  res.json({
    success: true,
    message: "Document activity tracked"
  });
});

export const trackStudyProgress = asyncHandler(async (req, res) => {
  const documentId = Number(req.body.documentId);
  const currentPage = Number(req.body.currentPage);
  const totalPages = Number(req.body.totalPages);

  if (!documentId || !currentPage || !totalPages) {
    res.status(400);
    throw new Error("Document id, current page, and total pages are required");
  }

  const progress = await updateStudyProgress(req.user.id, documentId, currentPage, totalPages);

  res.json({
    success: true,
    message: "Study progress updated",
    progress: {
      currentPage: progress.currentPage,
      totalPages: progress.totalPages,
      percentage: Math.min(100, Math.round((progress.currentPage / Math.max(progress.totalPages, 1)) * 100))
    }
  });
});

export const completeMockTest = asyncHandler(async (req, res) => {
  const mockTestId = Number(req.body.mockTestId);
  const score = req.body.score ? Number(req.body.score) : null;

  if (!mockTestId) {
    res.status(400);
    throw new Error("Mock test id is required");
  }

  const mockTest = await prisma.mockTest.findUnique({ where: { id: mockTestId } });
  if (!mockTest) {
    res.status(404);
    throw new Error("Mock test not found");
  }

  await awardMockTestXp(req.user.id, mockTestId, score);

  res.json({
    success: true,
    message: "Mock test completion tracked"
  });
});
