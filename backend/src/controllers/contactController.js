import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";

export const submitContactInquiry = asyncHandler(async (req, res) => {
  const { fullName, email, category, message, userId } = req.body;

  if (!fullName || !email || !category || !message) {
    res.status(400);
    throw new Error("Full name, email, category, and message are required");
  }

  await prisma.contactInquiry.create({
    data: {
      fullName,
      email,
      category,
      message,
      userId: userId ? Number(userId) : null
    }
  });

  res.status(201).json({
    success: true,
    message: "Your message has been sent successfully"
  });
});
