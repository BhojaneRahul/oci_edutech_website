import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";

const SITE_STATS_KEY = "site_stats";

async function getOrCreateVisitSetting() {
  return prisma.setting.upsert({
    where: { key: SITE_STATS_KEY },
    update: {},
    create: {
      key: SITE_STATS_KEY,
      value: {
        visits: 0,
        appInstalls: 0,
        youtubeMembers: 0
      }
    }
  });
}

async function buildStatsResponse() {
  const [visitSetting, documentCount, userCount, mockTestCount, projectCount] = await Promise.all([
    getOrCreateVisitSetting(),
    prisma.document.count(),
    prisma.user.count(),
    prisma.mockTest.count({
      where: { isPublished: true }
    }),
    prisma.project.count()
  ]);

  const value = typeof visitSetting.value === "object" && visitSetting.value ? visitSetting.value : {};
  const visits = Number(value.visits || 0);
  const appInstalls = String(value.appInstalls || "0");
  const youtubeMembers = String(value.youtubeMembers || "0");

  return {
    success: true,
    visits,
    documentCount,
    userCount,
    mockTestCount,
    projectCount,
    appInstalls,
    youtubeMembers
  };
}

export const getSiteStats = asyncHandler(async (req, res) => {
  res.json(await buildStatsResponse());
});

export const trackSiteVisit = asyncHandler(async (req, res) => {
  const visitSetting = await getOrCreateVisitSetting();
  const value = typeof visitSetting.value === "object" && visitSetting.value ? visitSetting.value : {};
  const nextVisits = Number(value.visits || 0) + 1;

  await prisma.setting.update({
    where: { key: SITE_STATS_KEY },
    data: {
      value: {
        ...value,
        visits: nextVisits
      }
    }
  });

  res.json(await buildStatsResponse());
});
