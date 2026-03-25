import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads/pdfs");
const avatarDir = path.resolve(__dirname, "../../uploads/avatars");
const teacherIdDir = path.resolve(__dirname, "../../uploads/teacher-ids");
const projectDir = path.resolve(__dirname, "../../uploads/projects");
const communityChatDir = path.resolve(__dirname, "../../uploads/community-chat");
const syllabusSourceDir = path.resolve(__dirname, "../../uploads/syllabus-source");
const syllabusGeneratedDir = path.resolve(__dirname, "../../uploads/syllabus-generated");

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(avatarDir, { recursive: true });
fs.mkdirSync(teacherIdDir, { recursive: true });
fs.mkdirSync(projectDir, { recursive: true });
fs.mkdirSync(communityChatDir, { recursive: true });
fs.mkdirSync(syllabusSourceDir, { recursive: true });
fs.mkdirSync(syllabusGeneratedDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    cb(new Error("Only PDF files are allowed"));
    return;
  }

  cb(null, true);
};

export const uploadPdf = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const avatarFilter = (req, file, cb) => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
    cb(new Error("Only JPG, PNG, or WEBP images are allowed"));
    return;
  }

  cb(null, true);
};

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const teacherIdStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, teacherIdDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const teacherIdFilter = (req, file, cb) => {
  if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.mimetype)) {
    cb(new Error("Only JPG, PNG, WEBP, or PDF files are allowed"));
    return;
  }

  cb(null, true);
};

export const uploadTeacherId = multer({
  storage: teacherIdStorage,
  fileFilter: teacherIdFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, projectDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeName}`);
  }
});

const projectFilter = (req, file, cb) => {
  const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
  const isZip =
    file.mimetype === "application/zip" ||
    file.mimetype === "application/x-zip-compressed" ||
    file.originalname.toLowerCase().endsWith(".zip");
  const isPdf = file.mimetype === "application/pdf";

  if (file.fieldname === "images" && isImage) {
    cb(null, true);
    return;
  }

  if (file.fieldname === "projectFile" && isZip) {
    cb(null, true);
    return;
  }

  if (file.fieldname === "reportFile" && isPdf) {
    cb(null, true);
    return;
  }

  cb(new Error("Invalid project upload file type"));
};

export const uploadProjectAssets = multer({
  storage: projectStorage,
  fileFilter: projectFilter,
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

const communityChatStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, communityChatDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeName}`);
  }
});

const communityChatFilter = (req, file, cb) => {
  const mime = file.mimetype;
  const lowerName = file.originalname.toLowerCase();
  const isImage = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mime);
  const isPdf = mime === "application/pdf" || lowerName.endsWith(".pdf");
  const isDoc =
    mime === "application/msword" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".doc") ||
    lowerName.endsWith(".docx");
  const isPpt =
    mime === "application/vnd.ms-powerpoint" ||
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    lowerName.endsWith(".ppt") ||
    lowerName.endsWith(".pptx");

  if (isImage || isPdf || isDoc || isPpt) {
    cb(null, true);
    return;
  }

  cb(new Error("Only images, PDF, DOC, DOCX, PPT, or PPTX files are allowed"));
};

export const uploadCommunityChatFile = multer({
  storage: communityChatStorage,
  fileFilter: communityChatFilter,
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

const syllabusStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, syllabusSourceDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeName}`);
  }
});

const syllabusFilter = (req, file, cb) => {
  const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    cb(new Error("Only PDF syllabus files are allowed"));
    return;
  }

  cb(null, true);
};

export const uploadSyllabusPdf = multer({
  storage: syllabusStorage,
  fileFilter: syllabusFilter,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

export { syllabusSourceDir, syllabusGeneratedDir };
