import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";
import { prisma } from "../config/db.js";
import { withMongoStyleId } from "../utils/serializers.js";
import { buildDocumentTargetPath, createNotifications } from "../services/notificationService.js";

export const normalizeDocument = (document) => ({
  ...withMongoStyleId(document),
  canDownload: document.type === "model_qp",
  viewCount: document.viewCount ?? 0,
  downloadCount: document.downloadCount ?? 0,
  uploader: document.uploader
    ? {
        ...document.uploader,
        verifiedTeacher: Boolean(document.uploader.verifiedTeacher)
      }
    : undefined
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

export const getTeacherNotes = asyncHandler(async (req, res) => {
  const where = {
    type: "notes",
    uploader: {
      verifiedTeacher: true
    }
  };

  if (req.query.stream) {
    where.stream = String(req.query.stream);
  }

  if (req.query.subject) {
    where.subject = {
      contains: String(req.query.subject),
      mode: "insensitive"
    };
  }

  const documents = await prisma.document.findMany({
    where,
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          verifiedTeacher: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(documents.map(normalizeDocument));
});

export const getDocumentById = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id);
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  res.json({
    ...normalizeDocument(document),
    uploader: document.uploader
  });
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
  const requestedStreams = req.body.streams ?? req.body["streams[]"] ?? stream;

  const streams = Array.from(
    new Set(
      (Array.isArray(requestedStreams) ? requestedStreams : [requestedStreams])
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );

  if (!title || !subject || !type || !streams.length) {
    res.status(400);
    throw new Error("Title, subject, type, and at least one stream are required");
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/pdfs/${req.file.filename}`;

  const createdDocuments = await prisma.$transaction(
    streams.map((selectedStream) =>
      prisma.document.create({
        data: {
          title,
          subject,
          stream: selectedStream,
          type,
          fileUrl,
          uploadedBy: req.user.id
        }
      })
    )
  );

  const users = await prisma.user.findMany({
    where: {
      id: {
        not: req.user.id
      }
    },
    select: { id: true }
  });

  if (users.length) {
    for (const document of createdDocuments) {
      await createNotifications({
        userIds: users.map((user) => user.id),
        documentId: document.id,
        type: type === "model_qp" ? "document_model_qp" : "document_notes",
        title: `New ${type === "model_qp" ? "Model QP" : "Notes"} Uploaded`,
        message: `${document.stream} ${subject} ${title}`,
        targetPath: buildDocumentTargetPath(document)
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `Document uploaded successfully to ${createdDocuments.length} stream${createdDocuments.length > 1 ? "s" : ""}.`,
    documents: createdDocuments.map(normalizeDocument)
  });
});

export const uploadTeacherNote = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("PDF file is required");
  }

  const { title, subject, stream } = req.body;

  if (!title || !subject || !stream) {
    res.status(400);
    throw new Error("Title, subject, and stream are required");
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/pdfs/${req.file.filename}`;

  const createdDocument = await prisma.document.create({
    data: {
      title,
      subject,
      stream,
      type: "notes",
      fileUrl,
      uploadedBy: req.user.id
    },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          verifiedTeacher: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: "Teacher note uploaded successfully.",
    document: normalizeDocument(createdDocument)
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

export const deleteDocument = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id);
  const existingDocument = await prisma.document.findUnique({
    where: { id: documentId }
  });

  if (!existingDocument) {
    res.status(404);
    throw new Error("Document not found");
  }

  await prisma.document.delete({
    where: { id: documentId }
  });

  try {
    const filename = String(existingDocument.fileUrl).split("/uploads/pdfs/")[1];
    if (filename) {
      const filePath = path.resolve(process.cwd(), "backend", "uploads", "pdfs", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {
    // Keep the database delete successful even if file cleanup fails.
  }

  res.json({
    success: true,
    message: "Document deleted successfully"
  });
});

export const deleteTeacherNote = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id);
  const existingDocument = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      uploader: {
        select: {
          id: true,
          verifiedTeacher: true
        }
      }
    }
  });

  if (!existingDocument || existingDocument.type !== "notes" || !existingDocument.uploader?.verifiedTeacher) {
    res.status(404);
    throw new Error("Teacher note not found");
  }

  const canDelete = req.user.role === "admin" || existingDocument.uploadedBy === req.user.id;

  if (!canDelete) {
    res.status(403);
    throw new Error("You can only delete your own teacher notes");
  }

  await prisma.document.delete({
    where: { id: documentId }
  });

  try {
    const filename = String(existingDocument.fileUrl).split("/uploads/pdfs/")[1];
    if (filename) {
      const filePath = path.resolve(process.cwd(), "backend", "uploads", "pdfs", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {
    // Keep the database delete successful even if file cleanup fails.
  }

  res.json({
    success: true,
    message: "Teacher note deleted successfully"
  });
});

export const incrementDocumentView = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id);
  const existingView = await prisma.documentView.findUnique({
    where: {
      userId_documentId: {
        userId: req.user.id,
        documentId
      }
    }
  });

  let document;

  if (existingView) {
    document = await prisma.document.findUnique({
      where: { id: documentId }
    });
  } else {
    await prisma.documentView.create({
      data: {
        userId: req.user.id,
        documentId
      }
    });

    document = await prisma.document.update({
      where: { id: documentId },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });
  }

  res.json({
    success: true,
    viewCount: document?.viewCount ?? 0,
    counted: !existingView
  });
});

export const incrementDocumentDownload = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id);
  const existingDownload = await prisma.documentDownload.findUnique({
    where: {
      userId_documentId: {
        userId: req.user.id,
        documentId
      }
    }
  });

  let document;

  if (existingDownload) {
    document = await prisma.document.findUnique({
      where: { id: documentId }
    });
  } else {
    await prisma.documentDownload.create({
      data: {
        userId: req.user.id,
        documentId
      }
    });

    document = await prisma.document.update({
      where: { id: documentId },
      data: {
        downloadCount: {
          increment: 1
        }
      }
    });
  }

  res.json({
    success: true,
    downloadCount: document?.downloadCount ?? 0,
    counted: !existingDownload
  });
});
