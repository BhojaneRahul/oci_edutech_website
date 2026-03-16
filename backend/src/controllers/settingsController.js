import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await prisma.setting.findMany();
  res.json(
    settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {})
  );
});

export const upsertSetting = asyncHandler(async (req, res) => {
  const setting = await prisma.setting.upsert({
    where: { key: req.body.key },
    update: { value: req.body.value },
    create: { key: req.body.key, value: req.body.value }
  });

  res.json(setting);
});
