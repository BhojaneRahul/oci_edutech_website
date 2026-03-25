import { prisma } from "../config/db.js";
import { removeGeneratedAsset } from "../services/syllabusGeneratorService.js";

const ONE_HOUR = 60 * 60 * 1000;

const cleanupExpiredSyllabusGenerations = async () => {
  const expiredGenerations = await prisma.syllabusGeneration.findMany({
    where: {
      expiresAt: {
        lte: new Date()
      }
    },
    select: {
      id: true,
      sourceFileUrl: true,
      generatedPdfUrl: true
    }
  });

  if (!expiredGenerations.length) {
    return;
  }

  await Promise.all(
    expiredGenerations.flatMap((generation) => [
      removeGeneratedAsset(generation.sourceFileUrl),
      removeGeneratedAsset(generation.generatedPdfUrl)
    ])
  );

  await prisma.syllabusGeneration.deleteMany({
    where: {
      id: {
        in: expiredGenerations.map((generation) => generation.id)
      }
    }
  });
};

export const startSyllabusCleanupJob = () => {
  cleanupExpiredSyllabusGenerations().catch((error) => {
    console.error("Syllabus cleanup failed:", error);
  });

  setInterval(() => {
    cleanupExpiredSyllabusGenerations().catch((error) => {
      console.error("Syllabus cleanup failed:", error);
    });
  }, ONE_HOUR);
};
