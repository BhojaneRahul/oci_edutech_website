import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import { USER_ROLES } from "../config/constants.js";

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return req.cookies?.token;
};

export const protect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await prisma.user.findUnique({
    where: { id: Number(decoded.id) },
    select: {
      id: true,
      name: true,
      email: true,
      profilePhoto: true,
      university: true,
      phone: true,
      course: true,
      semester: true,
      role: true,
      createdAt: true
    }
  });

  if (!req.user) {
    res.status(401);
    throw new Error("User not found");
  }

  next();
});

export const verifyJWT = protect;

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== USER_ROLES.ADMIN) {
    res.status(403);
    throw new Error("Admin access required");
  }

  next();
};
