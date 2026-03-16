import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import { withMongoStyleId } from "../utils/serializers.js";

const normalizeDocument = (document) => ({
  ...withMongoStyleId(document),
  canDownload: document.type === "model_qp"
});

export const getDocuments = asyncHandler(async (req, res) => {
  const where = {};

  if (req.query.stream) {
    where.stream = req.query.stream;
  }

  if (req.query.type) {
    where.type = req.query.type;
  }

  const documents = await prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });

  res.json(documents.map(normalizeDocument));
});

export const getAdminDocuments = asyncHandler(async (req, res) => {
  const documents = await prisma.document.findMany({
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(
    documents.map((document) => ({
      ...normalizeDocument(document),
      uploader: document.uploader
    }))
  );
});

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("PDF file is required");
  }

  const { title, subject, stream, type } = req.body;

  const document = await prisma.document.create({
    data: {
      title,
      subject,
      stream,
      type,
      fileUrl: `${req.protocol}://${req.get("host")}/uploads/pdfs/${req.file.filename}`,
      uploadedBy: req.user.id
    }
  });

  const users = await prisma.user.findMany({
    where: {
      id: {
        not: req.user.id
      }
    },
    select: { id: true }
  });

  if (users.length) {
    await prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        documentId: document.id,
        title: `New ${type === "model_qp" ? "Model QP" : "Notes"} Uploaded`,
        message: `${stream} ${subject} ${title}`
      }))
    });
  }

  res.status(201).json({
    success: true,
    message: "Document uploaded successfully",
    document: normalizeDocument(document)
  });
});

export const updateDocument = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id);
  const existingDocument = await prisma.document.findUnique({
    where: { id: documentId }
  });

  if (!existingDocument) {
    res.status(404);
    throw new Error("Document not found");
  }

  const { title, subject, stream, type } = req.body;

  const updatedDocument = await prisma.document.update({
    where: { id: documentId },
    data: {
      title: title ?? existingDocument.title,
      subject: subject ?? existingDocument.subject,
      stream: stream ?? existingDocument.stream,
      type: type ?? existingDocument.type,
      fileUrl: req.file ? `${req.protocol}://${req.get("host")}/uploads/pdfs/${req.file.filename}` : existingDocument.fileUrl
    }
  });

  res.json({
    success: true,
    message: "Document updated successfully",
    document: normalizeDocument(updatedDocument)
  });
});
