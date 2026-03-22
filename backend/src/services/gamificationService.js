import { prisma } from "../config/db.js";

export const XP_VALUES = {
  NOTE_OPEN: 5,
  READ_5_PAGES: 10,
  BOOKMARK: 3,
  MOCK_TEST_COMPLETE: 50,
  DAILY_LOGIN: 5,
  MOCK_TEST_START: 5,
  MOCK_TEST_EXIT_PENALTY: 15,
  MOCK_TEST_SUBMIT_HIGH: 20,
  MOCK_TEST_SUBMIT_MEDIUM: 10,
  MOCK_TEST_SUBMIT_LOW: 5
};

export const ACTIVITY_TYPES = {
  NOTE_OPEN: "note_open",
  READ_PAGES: "read_pages",
  BOOKMARK: "bookmark",
  MOCK_TEST_COMPLETE: "mock_test_complete",
  DAILY_LOGIN: "daily_login",
  MOCK_TEST_START: "mock_test_start",
  MOCK_TEST_EXIT: "mock_test_exit",
  MOCK_TEST_SUBMIT: "mock_test_submit"
};

const startOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date = new Date()) => {
  const value = startOfDay(date);
  value.setDate(value.getDate() + 1);
  return value;
};

const differenceInDays = (currentDate, previousDate) => {
  const current = startOfDay(currentDate).getTime();
  const previous = startOfDay(previousDate).getTime();
  return Math.round((current - previous) / (1000 * 60 * 60 * 24));
};

export const calculateLevel = (xp) => Math.max(1, Math.floor(xp / 100) + 1);

async function ensureProfiles(tx, userId) {
  const [xpProfile, streakProfile] = await Promise.all([
    tx.userXp.upsert({
      where: { userId },
      update: {},
      create: { userId }
    }),
    tx.userStreak.upsert({
      where: { userId },
      update: {},
      create: { userId }
    })
  ]);

  return { xpProfile, streakProfile };
}

export async function touchStudyDay(userId, tx = prisma) {
  const { streakProfile } = await ensureProfiles(tx, userId);
  const today = startOfDay();

  if (!streakProfile.lastStudyDate) {
    return tx.userStreak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: today
      }
    });
  }

  const gap = differenceInDays(today, streakProfile.lastStudyDate);

  if (gap <= 0) {
    return streakProfile;
  }

  const nextStreak = gap === 1 ? streakProfile.currentStreak + 1 : 1;

  return tx.userStreak.update({
    where: { userId },
    data: {
      currentStreak: nextStreak,
      longestStreak: Math.max(streakProfile.longestStreak, nextStreak),
      lastStudyDate: today
    }
  });
}

export async function awardXp(userId, type, xpEarned, options = {}) {
  const {
    documentId = null,
    meta = null,
    uniqueScope = null,
    tx = prisma
  } = options;

  if (uniqueScope) {
    const existing = await tx.userActivity.findFirst({
      where: {
        userId,
        documentId: documentId ?? undefined,
        type,
        createdAt: {
          gte: uniqueScope.start,
          lt: uniqueScope.end
        }
      }
    });

    if (existing) {
      return null;
    }
  }

  const { xpProfile } = await ensureProfiles(tx, userId);
  const totalXp = Math.max(0, xpProfile.totalXp + xpEarned);
  const level = calculateLevel(totalXp);

  const [updatedXp] = await Promise.all([
    tx.userXp.update({
      where: { userId },
      data: {
        totalXp,
        level
      }
    }),
    tx.userActivity.create({
      data: {
        userId,
        documentId,
        type,
        xpEarned,
        meta
      }
    })
  ]);

  return updatedXp;
}

export async function adjustXp(userId, type, xpDelta, options = {}) {
  const { documentId = null, meta = null, tx = prisma } = options;
  const { xpProfile } = await ensureProfiles(tx, userId);
  const totalXp = Math.max(0, xpProfile.totalXp + xpDelta);
  const level = calculateLevel(totalXp);

  const [updatedXp] = await Promise.all([
    tx.userXp.update({
      where: { userId },
      data: {
        totalXp,
        level
      }
    }),
    tx.userActivity.create({
      data: {
        userId,
        documentId,
        type,
        xpEarned: xpDelta,
        meta
      }
    })
  ]);

  return updatedXp;
}

export async function awardDailyLogin(userId, tx = prisma) {
  const today = startOfDay();
  const tomorrow = endOfDay(today);
  await touchStudyDay(userId, tx);

  return awardXp(userId, ACTIVITY_TYPES.DAILY_LOGIN, XP_VALUES.DAILY_LOGIN, {
    tx,
    uniqueScope: {
      start: today,
      end: tomorrow
    },
    meta: { source: "login" }
  });
}

export async function awardDocumentOpen(userId, documentId, tx = prisma) {
  const today = startOfDay();
  const tomorrow = endOfDay(today);
  await touchStudyDay(userId, tx);

  return awardXp(userId, ACTIVITY_TYPES.NOTE_OPEN, XP_VALUES.NOTE_OPEN, {
    documentId,
    tx,
    uniqueScope: {
      start: today,
      end: tomorrow
    },
    meta: { source: "viewer_open" }
  });
}

export async function awardBookmarkXp(userId, documentId, tx = prisma) {
  const today = startOfDay();
  const tomorrow = endOfDay(today);
  await touchStudyDay(userId, tx);

  return awardXp(userId, ACTIVITY_TYPES.BOOKMARK, XP_VALUES.BOOKMARK, {
    documentId,
    tx,
    uniqueScope: {
      start: today,
      end: tomorrow
    },
    meta: { source: "bookmark" }
  });
}

export async function awardMockTestXp(userId, mockTestId, score = null, tx = prisma) {
  const today = startOfDay();
  const tomorrow = endOfDay(today);
  await touchStudyDay(userId, tx);

  return awardXp(userId, ACTIVITY_TYPES.MOCK_TEST_COMPLETE, XP_VALUES.MOCK_TEST_COMPLETE, {
    tx,
    uniqueScope: {
      start: today,
      end: tomorrow
    },
    meta: { mockTestId, score }
  });
}

export async function awardMockTestStartXp(userId, mockTestId, tx = prisma) {
  await touchStudyDay(userId, tx);

  return awardXp(userId, ACTIVITY_TYPES.MOCK_TEST_START, XP_VALUES.MOCK_TEST_START, {
    tx,
    meta: { mockTestId }
  });
}

export async function applyMockTestExitPenalty(userId, mockTestId, tx = prisma) {
  await touchStudyDay(userId, tx);

  return adjustXp(userId, ACTIVITY_TYPES.MOCK_TEST_EXIT, -XP_VALUES.MOCK_TEST_EXIT_PENALTY, {
    tx,
    meta: { mockTestId }
  });
}

export async function awardMockTestSubmitXp(userId, mockTestId, accuracy, tx = prisma) {
  await touchStudyDay(userId, tx);

  const xpEarned =
    accuracy >= 80
      ? XP_VALUES.MOCK_TEST_SUBMIT_HIGH
      : accuracy >= 50
        ? XP_VALUES.MOCK_TEST_SUBMIT_MEDIUM
        : XP_VALUES.MOCK_TEST_SUBMIT_LOW;

  await adjustXp(userId, ACTIVITY_TYPES.MOCK_TEST_SUBMIT, xpEarned, {
    tx,
    meta: { mockTestId, accuracy }
  });

  return xpEarned;
}

export async function updateStudyProgress(userId, documentId, currentPage, totalPages, tx = prisma) {
  const safeCurrentPage = Math.max(1, Number(currentPage) || 1);
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const pagesRead = Math.min(safeCurrentPage, safeTotalPages);
  const milestone = Math.floor(pagesRead / 5);

  const existing = await tx.studyProgress.findUnique({
    where: {
      userId_documentId: {
        userId,
        documentId
      }
    }
  });

  const previousMilestone = existing?.milestone ?? 0;

  const progress = await tx.studyProgress.upsert({
    where: {
      userId_documentId: {
        userId,
        documentId
      }
    },
    update: {
      currentPage: Math.max(existing?.currentPage ?? 1, safeCurrentPage),
      totalPages: Math.max(existing?.totalPages ?? 1, safeTotalPages),
      pagesRead: Math.max(existing?.pagesRead ?? 0, pagesRead),
      milestone: Math.max(previousMilestone, milestone)
    },
    create: {
      userId,
      documentId,
      currentPage: safeCurrentPage,
      totalPages: safeTotalPages,
      pagesRead,
      milestone
    }
  });

  await touchStudyDay(userId, tx);

  if (milestone > previousMilestone) {
    for (let index = previousMilestone + 1; index <= milestone; index += 1) {
      await awardXp(userId, ACTIVITY_TYPES.READ_PAGES, XP_VALUES.READ_5_PAGES, {
        documentId,
        tx,
        meta: {
          pagesRead: index * 5,
          totalPages: safeTotalPages
        }
      });
    }
  }

  return progress;
}

export async function getDashboardData(userId) {
  const [xpProfile, streakProfile, progressEntries, savedEntries, leaderboardUsers] = await Promise.all([
    prisma.userXp.upsert({
      where: { userId },
      update: {},
      create: { userId }
    }),
    prisma.userStreak.upsert({
      where: { userId },
      update: {},
      create: { userId }
    }),
    prisma.studyProgress.findMany({
      where: { userId },
      include: { document: true },
      orderBy: { updatedAt: "desc" },
      take: 6
    }),
    prisma.savedDocument.findMany({
      where: { userId },
      include: { document: true },
      orderBy: { createdAt: "desc" },
      take: 6
    }),
    prisma.user.findMany({
      where: {
        role: {
          in: ["student", "teacher", "admin"]
        }
      },
      include: {
        xpProfile: true,
        streakProfile: {
          select: {
            currentStreak: true
          }
        }
      },
      take: 10
    })
  ]);

  const interestStreams = new Set(
    [...progressEntries.map((entry) => entry.document.stream), ...savedEntries.map((entry) => entry.document.stream)].filter(Boolean)
  );

  const interestSubjects = new Set(
    [...progressEntries.map((entry) => entry.document.subject), ...savedEntries.map((entry) => entry.document.subject)].filter(Boolean)
  );

  const progressDocumentIds = progressEntries.map((entry) => entry.documentId);
  const savedDocumentIds = savedEntries.map((entry) => entry.documentId);
  const recommendationFilters = [
    interestStreams.size ? { stream: { in: [...interestStreams] } } : null,
    interestSubjects.size ? { subject: { in: [...interestSubjects] } } : null
  ].filter(Boolean);

  const recommendations = await prisma.document.findMany({
    where: recommendationFilters.length
      ? {
          OR: recommendationFilters,
          NOT: {
            id: { in: [...new Set([...progressDocumentIds, ...savedDocumentIds])] }
          }
        }
      : {
          NOT: {
            id: { in: [...new Set([...progressDocumentIds, ...savedDocumentIds])] }
          }
        },
    orderBy: { createdAt: "desc" },
    take: 6
  });

  const fallbackRecommendations =
    recommendations.length < 3
      ? await prisma.document.findMany({
          where: {
            NOT: {
              id: { in: [...new Set([...progressDocumentIds, ...savedDocumentIds, ...recommendations.map((item) => item.id)])] }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 6 - recommendations.length
        })
      : [];

  const leaderboard = [...leaderboardUsers]
    .sort((left, right) => {
      const xpDelta = (right.xpProfile?.totalXp ?? 0) - (left.xpProfile?.totalXp ?? 0);
      if (xpDelta !== 0) {
        return xpDelta;
      }

      const leftUpdated = left.xpProfile?.updatedAt?.getTime() ?? left.createdAt.getTime();
      const rightUpdated = right.xpProfile?.updatedAt?.getTime() ?? right.createdAt.getTime();
      return leftUpdated - rightUpdated;
    })
    .map((entry, index) => ({
      rank: index + 1,
      xp: entry.xpProfile?.totalXp ?? 0,
      level: entry.xpProfile?.level ?? 1,
      user: {
        id: entry.id,
        name: entry.name,
        profilePhoto: entry.profilePhoto,
        course: entry.course
      },
      streak: entry.streakProfile?.currentStreak ?? 0
    }));

  return {
    xp: xpProfile.totalXp,
    level: xpProfile.level,
    streak: {
      current: streakProfile.currentStreak,
      longest: streakProfile.longestStreak,
      lastStudyDate: streakProfile.lastStudyDate
    },
    progress: progressEntries.map((entry) => ({
      id: entry.id,
      documentId: entry.documentId,
      title: entry.document.title,
      subject: entry.document.subject,
      stream: entry.document.stream,
      type: entry.document.type,
      fileUrl: entry.document.fileUrl,
      currentPage: entry.currentPage,
      totalPages: entry.totalPages,
      percentage: Math.min(100, Math.round((entry.currentPage / Math.max(entry.totalPages, 1)) * 100))
    })),
    recommendations: [...recommendations, ...fallbackRecommendations].map((document) => ({
      _id: document.id,
      title: document.title,
      subject: document.subject,
      stream: document.stream,
      type: document.type,
      fileUrl: document.fileUrl,
      createdAt: document.createdAt
    })),
    leaderboard
  };
}

export async function getFullLeaderboardData(userId) {
  const leaderboardEntries = await prisma.user.findMany({
    where: {
      role: {
        in: ["student", "teacher", "admin"]
      }
    },
    include: {
      xpProfile: true,
      streakProfile: {
        select: {
          currentStreak: true
        }
      }
    }
  });

  const leaderboard = [...leaderboardEntries]
    .sort((left, right) => {
      const xpDelta = (right.xpProfile?.totalXp ?? 0) - (left.xpProfile?.totalXp ?? 0);
      if (xpDelta !== 0) {
        return xpDelta;
      }

      const leftUpdated = left.xpProfile?.updatedAt?.getTime() ?? left.createdAt.getTime();
      const rightUpdated = right.xpProfile?.updatedAt?.getTime() ?? right.createdAt.getTime();
      return leftUpdated - rightUpdated;
    })
    .map((entry, index) => ({
      rank: index + 1,
      xp: entry.xpProfile?.totalXp ?? 0,
      level: entry.xpProfile?.level ?? 1,
      user: {
        id: entry.id,
        name: entry.name,
        profilePhoto: entry.profilePhoto,
        course: entry.course
      },
      streak: entry.streakProfile?.currentStreak ?? 0
    }));

  const currentUserEntry = leaderboard.find((entry) => Number(entry.user.id) === Number(userId)) ?? null;

  return {
    leaderboard,
    currentUserEntry
  };
}
