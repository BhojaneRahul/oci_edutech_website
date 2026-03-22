import "./config/env.js";
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import degreeRoutes from "./routes/degreeRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import mockTestRoutes from "./routes/mockTestRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import gamificationRoutes from "./routes/gamificationRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import siteStatsRoutes from "./routes/siteStatsRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import passport from "./config/passport.js";
import { initSocket } from "./config/socket.js";
import { startCommunityCleanupJob } from "./jobs/communityCleanupJob.js";

const app = express();
const server = http.createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);
const isAllowedLocalOrigin = (origin) => /^http:\/\/localhost:\d+$/.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || isAllowedLocalOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(passport.initialize());
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/degrees", degreeRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/mocktests", mockTestRoutes);
app.use("/api/mock-tests", mockTestRoutes);
app.use("/api/mock-test", mockTestRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/site", siteStatsRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
initSocket(server);
startCommunityCleanupJob();
server.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
